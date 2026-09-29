"""
NetGuard Router Management & Device Time-Blocking Daemon
FastAPI Backend with Background Cron / Expiry Engine
"""

import asyncio
from datetime import datetime
from contextlib import asynccontextmanager
from typing import List, Optional
from fastapi import FastAPI, Depends, HTTPException, Query, status
from fastapi.middleware.cors import CORSMiddleware
from sqlalchemy.orm import Session

from database import engine, Base, get_db, SessionLocal
import models
import schemas
from router_driver import RouterDriver

# Create SQLite database tables
Base.metadata.create_all(bind=engine)

# Initialize router driver (handles iptables, OpenWrt, or simulated mode)
router_driver = RouterDriver(mode="simulation")  # Change to "iptables" or "openwrt" for production

# Background task flag
background_worker_running = True


async def check_expired_devices_loop():
    """
    Background worker loop that runs every 10 seconds.
    Identifies devices whose expiry datetime has passed,
    triggers automated router blocking via MAC address,
    and updates status in SQLite database.
    """
    while background_worker_running:
        try:
            db: Session = SessionLocal()
            now = datetime.utcnow()
            
            # Query active devices whose expiry time is non-null and <= now
            expired_devices = (
                db.query(models.Device)
                .filter(
                    models.Device.status == "active",
                    models.Device.expiry.isnot(None),
                    models.Device.expiry <= now
                )
                .all()
            )

            for device in expired_devices:
                # 1. Trigger automated router firewall blocking
                success, msg = router_driver.block_mac(
                    mac=device.mac,
                    ip=device.ip,
                    reason=f"Validity expired at {device.expiry}"
                )

                # 2. Update device status in SQLite database
                device.status = "blocked"
                device.last_blocked_at = now

                # 3. Log audit action
                audit_log = models.AuditLog(
                    device_id=device.id,
                    mac=device.mac,
                    action="auto_block",
                    details=f"Auto-blocked due to expiry. Router response: {msg}",
                    timestamp=now
                )
                db.add(audit_log)
                print(f"[DAEMON] 🚨 Auto-Blocked {device.name} ({device.mac}) at {now}")

            if expired_devices:
                db.commit()

            db.close()
        except Exception as e:
            print(f"[DAEMON ERROR] Background loop exception: {e}")

        # Wait 10 seconds before next check
        await asyncio.sleep(10)


@asynccontextmanager
async def lifespan(app: FastAPI):
    # Startup: spawn background cron worker
    worker_task = asyncio.create_task(check_expired_devices_loop())
    print("[SYSTEM] 🚀 NetGuard Router Management Daemon Started")
    yield
    # Shutdown: gracefully terminate background worker
    global background_worker_running
    background_worker_running = False
    worker_task.cancel()
    print("[SYSTEM] 🛑 NetGuard Daemon Stopped")


app = FastAPI(
    title="NetGuard Router Management & Time-Blocking API",
    description="Control connected devices, schedule validity expiry, and trigger automated router blocks.",
    version="1.0.0",
    lifespan=lifespan
)

# Enable CORS for Flutter Mobile Client and Web Admin
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


# ==============================================================
# REST API ENDPOINTS
# ==============================================================

@app.get("/", tags=["Health"])
def health_check():
    return {
        "status": "online",
        "service": "NetGuard Router Daemon",
        "server_time_utc": datetime.utcnow().isoformat(),
        "router_mode": router_driver.mode
    }


@app.get("/api/devices", response_model=List[schemas.DeviceResponse], tags=["Devices"])
def get_connected_devices(
    status_filter: Optional[str] = Query(None, description="Filter by 'active' or 'blocked'"),
    db: Session = Depends(get_db)
):
    """
    Fetch all connected devices stored in the database with their current status and expiry schedule.
    """
    query = db.query(models.Device)
    if status_filter:
        query = query.filter(models.Device.status == status_filter.lower())
    
    devices = query.all()
    # Compute dynamic remaining seconds
    return [schemas.DeviceResponse.model_validate(dev) for dev in devices]


@app.get("/api/devices/{device_id}", response_model=schemas.DeviceResponse, tags=["Devices"])
def get_device_by_id(device_id: int, db: Session = Depends(get_db)):
    """
    Retrieve single device details by ID.
    """
    device = db.query(models.Device).filter(models.Device.id == device_id).first()
    if not device:
        raise HTTPException(status_code=404, detail="Device not found")
    return schemas.DeviceResponse.model_validate(device)


@app.post("/api/devices/{device_id}/schedule", response_model=schemas.DeviceResponse, tags=["Scheduling"])
def set_device_schedule(
    device_id: int,
    payload: schemas.ScheduleRequest,
    db: Session = Depends(get_db)
):
    """
    Receive and save device expiry schedule:
      - Supports custom date-time (e.g. 'YYYY-MM-DD HH:MM:SS')
      - Or duration presets (e.g. 1 hour, 1 day, 7 days, up to 1 month / 30 days)
    If the device was previously blocked, setting a future expiry will unblock it.
    """
    device = db.query(models.Device).filter(models.Device.id == device_id).first()
    if not device:
        raise HTTPException(status_code=404, detail="Device not found")

    target_expiry = payload.calculate_expiry_datetime()
    
    if target_expiry <= datetime.utcnow():
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Expiry datetime must be in the future (up to 30 days)."
        )

    # Save schedule
    device.expiry = target_expiry
    
    # If currently blocked, unblock upon receiving a new valid schedule
    if device.status == "blocked":
        success, msg = router_driver.unblock_mac(device.mac, device.ip)
        device.status = "active"
        db.add(models.AuditLog(
            device_id=device.id,
            mac=device.mac,
            action="unblock_on_reschedule",
            details=f"Unblocked with new schedule until {target_expiry}. Router: {msg}",
            timestamp=datetime.utcnow()
        ))

    db.commit()
    db.refresh(device)
    return schemas.DeviceResponse.model_validate(device)


@app.delete("/api/devices/{device_id}/schedule", response_model=schemas.DeviceResponse, tags=["Scheduling"])
def clear_device_schedule(device_id: int, db: Session = Depends(get_db)):
    """
    Cancel existing schedule on device (grants unlimited active duration).
    """
    device = db.query(models.Device).filter(models.Device.id == device_id).first()
    if not device:
        raise HTTPException(status_code=404, detail="Device not found")

    device.expiry = None
    db.commit()
    db.refresh(device)
    return schemas.DeviceResponse.model_validate(device)


@app.post("/api/devices/{device_id}/block", response_model=schemas.DeviceResponse, tags=["Router Control"])
def manual_block_device(device_id: int, db: Session = Depends(get_db)):
    """
    Immediately trigger router firewall block for the given device's MAC address.
    """
    device = db.query(models.Device).filter(models.Device.id == device_id).first()
    if not device:
        raise HTTPException(status_code=404, detail="Device not found")

    success, msg = router_driver.block_mac(device.mac, device.ip, reason="Manual block via app")
    device.status = "blocked"
    device.last_blocked_at = datetime.utcnow()

    db.add(models.AuditLog(
        device_id=device.id,
        mac=device.mac,
        action="manual_block",
        details=msg,
        timestamp=datetime.utcnow()
    ))
    db.commit()
    db.refresh(device)
    return schemas.DeviceResponse.model_validate(device)


@app.post("/api/devices/{device_id}/unblock", response_model=schemas.DeviceResponse, tags=["Router Control"])
def manual_unblock_device(device_id: int, db: Session = Depends(get_db)):
    """
    Immediately remove router firewall block rule for the given device's MAC address.
    """
    device = db.query(models.Device).filter(models.Device.id == device_id).first()
    if not device:
        raise HTTPException(status_code=404, detail="Device not found")

    success, msg = router_driver.unblock_mac(device.mac, device.ip)
    device.status = "active"

    db.add(models.AuditLog(
        device_id=device.id,
        mac=device.mac,
        action="manual_unblock",
        details=msg,
        timestamp=datetime.utcnow()
    ))
    db.commit()
    db.refresh(device)
    return schemas.DeviceResponse.model_validate(device)


@app.post("/api/devices", response_model=schemas.DeviceResponse, status_code=201, tags=["Devices"])
def register_new_device(payload: schemas.DeviceBase, db: Session = Depends(get_db)):
    """
    Register a newly discovered or manually added network client device.
    """
    existing = db.query(models.Device).filter(models.Device.mac == payload.mac.upper()).first()
    if existing:
        raise HTTPException(status_code=400, detail="Device with this MAC address already registered")

    new_device = models.Device(
        name=payload.name,
        ip=payload.ip,
        mac=payload.mac.upper(),
        category=payload.category or "mobile",
        manufacturer=payload.manufacturer or "Unknown",
        status="active"
    )
    db.add(new_device)
    db.commit()
    db.refresh(new_device)
    return schemas.DeviceResponse.model_validate(new_device)


@app.get("/api/router/status", tags=["Router Control"])
def get_router_status(db: Session = Depends(get_db)):
    """
    Inspect router firewall driver status and aggregate device stats.
    """
    total = db.query(models.Device).count()
    active = db.query(models.Device).filter(models.Device.status == "active").count()
    blocked = db.query(models.Device).filter(models.Device.status == "blocked").count()
    scheduled = db.query(models.Device).filter(
        models.Device.status == "active",
        models.Device.expiry.isnot(None)
    ).count()

    return {
        "router_ip": router_driver.router_ip,
        "driver_mode": router_driver.mode,
        "daemon_status": "running" if background_worker_running else "stopped",
        "stats": {
            "total_devices": total,
            "active_devices": active,
            "blocked_devices": blocked,
            "scheduled_devices": scheduled
        }
    }


@app.get("/api/logs", response_model=List[schemas.AuditLogResponse], tags=["Logs"])
def get_audit_logs(limit: int = 50, db: Session = Depends(get_db)):
    """
    Get recent firewall and blocking action audit history.
    """
    logs = (
        db.query(models.AuditLog)
        .order_by(models.AuditLog.timestamp.desc())
        .limit(limit)
        .all()
    )
    return logs


@app.post("/api/router/scan", response_model=List[schemas.DeviceResponse], tags=["Router Control"])
def scan_and_sync_real_devices(db: Session = Depends(get_db)):
    """
    Scans real connected devices directly from the router's ARP and DHCP lease tables.
    NO demo/mock devices. Only genuine connected clients are discovered and stored.
    """
    scanned_clients = router_driver.scan_real_connected_devices()
    newly_added = []

    for client in scanned_clients:
        mac = client["mac"].upper()
        existing = db.query(models.Device).filter(models.Device.mac == mac).first()
        if not existing:
            new_dev = models.Device(
                name=client.get("name", f"Device-{client['ip'].split('.')[-1]}"),
                ip=client["ip"],
                mac=mac,
                category=client.get("category", "mobile"),
                manufacturer=client.get("manufacturer", "Genuine Router Device"),
                status="active",
                expiry=None
            )
            db.add(new_dev)
            newly_added.append(new_dev)
        else:
            # Update IP in case of DHCP reassignment
            if existing.ip != client["ip"]:
                existing.ip = client["ip"]

    if newly_added or scanned_clients:
        db.commit()

    all_devices = db.query(models.Device).all()
    return [schemas.DeviceResponse.model_validate(dev) for dev in all_devices]


@app.delete("/api/devices/{device_id}", tags=["Devices"])
def delete_device(device_id: int, db: Session = Depends(get_db)):
    """
    Remove a device entry from the management list.
    """
    dev = db.query(models.Device).filter(models.Device.id == device_id).first()
    if not dev:
        raise HTTPException(status_code=404, detail="Device not found")
    
    # If blocked, remove firewall drop first
    if dev.status == "blocked":
        router_driver.unblock_mac(dev.mac, dev.ip)

    db.delete(dev)
    db.commit()
    return {"status": "deleted", "device_id": device_id}

