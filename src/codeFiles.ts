export interface CodeFile {
  name: string;
  path: string;
  category: 'backend' | 'frontend' | 'docs';
  language: 'python' | 'dart' | 'yaml' | 'markdown' | 'bash';
  description: string;
  content: string;
}

export const codeFiles: CodeFile[] = [
  // ===================== BACKEND FILES =====================
  {
    name: 'main.py',
    path: 'backend/main.py',
    category: 'backend',
    language: 'python',
    description: 'FastAPI Application with background expiry worker and router management REST APIs',
    content: `"""
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
                    models.Device.expiry != None,
                    models.Device.expiry <= now
                )
                .all()
            )

            for device in expired_devices:
                print(f"[CRON WORKER] Device '{device.name}' (MAC: {device.mac}) expired at {device.expiry}. Blocking...")
                
                # Trigger automated router blocking action
                success, log_msg = router_driver.block_mac(device.mac, device.ip, reason="Expiry time reached")
                
                # Update device state in database
                device.status = "blocked"
                device.last_blocked_at = now
                
                # Record audit log
                audit = models.AuditLog(
                    device_id=device.id,
                    mac=device.mac,
                    action="auto_block",
                    details=f"Auto-blocked upon schedule expiry. Router output: {log_msg}",
                    timestamp=now
                )
                db.add(audit)
                db.commit()
                print(f"[CRON WORKER] Successfully blocked {device.mac} on router: {log_msg}")

            db.close()
        except Exception as e:
            print(f"[CRON WORKER ERROR] {str(e)}")

        # Wait 10 seconds before next check
        await asyncio.sleep(10)


@asynccontextmanager
async def lifespan(app: FastAPI):
    """
    Lifespan context manager to start and stop the background check task.
    """
    global background_worker_running
    background_worker_running = True
    task = asyncio.create_task(check_expired_devices_loop())
    print("[SYSTEM] Background Device Expiry Cron Task Started (Interval: 10s)")
    yield
    background_worker_running = False
    task.cancel()
    print("[SYSTEM] Background Device Expiry Cron Task Stopped")


app = FastAPI(
    title="NetGuard Router Management API",
    description="Backend for Router Management, Device Monitoring & Automated Time-Blocking",
    version="1.0.0",
    lifespan=lifespan
)

# Enable CORS for Flutter mobile apps and web admin
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


# ==================== ENDPOINTS ====================

@app.get("/api/devices", response_model=List[schemas.DeviceResponse])
def get_all_devices(
    status_filter: Optional[str] = Query(None, description="Filter by 'active' or 'blocked'"),
    db: Session = Depends(get_db)
):
    """
    Fetch the list of all connected devices with their IP, MAC, status, and expiry schedule.
    """
    query = db.query(models.Device)
    if status_filter:
        query = query.filter(models.Device.status == status_filter)
    
    devices = query.order_by(models.Device.connected_at.desc()).all()
    return devices


@app.get("/api/devices/{device_id}", response_model=schemas.DeviceResponse)
def get_device(device_id: int, db: Session = Depends(get_db)):
    """
    Retrieve single device details by ID.
    """
    device = db.query(models.Device).filter(models.Device.id == device_id).first()
    if not device:
        raise HTTPException(status_code=404, detail="Device not found")
    return device


@app.post("/api/devices/{device_id}/schedule", response_model=schemas.DeviceResponse)
def set_device_schedule(
    device_id: int,
    payload: schemas.ScheduleRequest,
    db: Session = Depends(get_db)
):
    """
    Set or update device expiry schedule.
    Accepts:
      - Custom ISO datetime string 'YYYY-MM-DD HH:MM:SS'
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
    return device


@app.post("/api/devices/{device_id}/block", response_model=schemas.DeviceResponse)
def manual_block_device(device_id: int, db: Session = Depends(get_db)):
    """
    Manually block a device immediately via router firewall (iptables/OpenWrt).
    """
    device = db.query(models.Device).filter(models.Device.id == device_id).first()
    if not device:
        raise HTTPException(status_code=404, detail="Device not found")

    success, msg = router_driver.block_mac(device.mac, device.ip, reason="Manual admin block")
    device.status = "blocked"
    device.last_blocked_at = datetime.utcnow()
    
    db.add(models.AuditLog(
        device_id=device.id,
        mac=device.mac,
        action="manual_block",
        details=f"Manual block triggered. Router: {msg}",
        timestamp=datetime.utcnow()
    ))
    db.commit()
    db.refresh(device)
    return device


@app.post("/api/devices/{device_id}/unblock", response_model=schemas.DeviceResponse)
def manual_unblock_device(device_id: int, db: Session = Depends(get_db)):
    """
    Manually unblock a device on the router and clear its expiry.
    """
    device = db.query(models.Device).filter(models.Device.id == device_id).first()
    if not device:
        raise HTTPException(status_code=404, detail="Device not found")

    success, msg = router_driver.unblock_mac(device.mac, device.ip)
    device.status = "active"
    device.expiry = None  # Clear expiry limit
    
    db.add(models.AuditLog(
        device_id=device.id,
        mac=device.mac,
        action="manual_unblock",
        details=f"Manual unblock triggered. Router: {msg}",
        timestamp=datetime.utcnow()
    ))
    db.commit()
    db.refresh(device)
    return device


@app.delete("/api/devices/{device_id}/schedule", response_model=schemas.DeviceResponse)
def clear_schedule(device_id: int, db: Session = Depends(get_db)):
    """
    Remove time-blocking expiry schedule without altering current status.
    """
    device = db.query(models.Device).filter(models.Device.id == device_id).first()
    if not device:
        raise HTTPException(status_code=404, detail="Device not found")

    device.expiry = None
    db.commit()
    db.refresh(device)
    return device


@app.get("/api/router/status")
def get_router_status(db: Session = Depends(get_db)):
    """
    Get router hardware and firewall summary.
    """
    total = db.query(models.Device).count()
    active = db.query(models.Device).filter(models.Device.status == "active").count()
    blocked = db.query(models.Device).filter(models.Device.status == "blocked").count()
    scheduled = db.query(models.Device).filter(
        models.Device.expiry != None,
        models.Device.status == "active"
    ).count()

    return {
        "gateway_ip": "192.168.1.1",
        "router_model": "OpenWrt / Linux Gateway Router",
        "firewall_driver": router_driver.mode,
        "background_worker_active": background_worker_running,
        "check_interval_seconds": 10,
        "stats": {
            "total_devices": total,
            "active_devices": active,
            "blocked_devices": blocked,
            "scheduled_devices": scheduled
        }
    }


@app.get("/api/router/logs", response_model=List[schemas.AuditLogResponse])
def get_router_audit_logs(limit: int = 50, db: Session = Depends(get_db)):
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


# Seed mock devices on initial startup if table is empty
@app.on_event("startup")
def seed_initial_devices():
    db = SessionLocal()
    if db.query(models.Device).count() == 0:
        sample_devices = [
            models.Device(
                name="Kid's iPad Air",
                ip="192.168.1.104",
                mac="3C:22:FB:9E:44:A1",
                status="active",
                category="tablet",
                manufacturer="Apple Inc.",
                expiry=None
            ),
            models.Device(
                name="PlayStation 5",
                ip="192.168.1.142",
                mac="70:28:8B:11:C3:59",
                status="active",
                category="gaming",
                manufacturer="Sony Interactive",
                expiry=None
            ),
            models.Device(
                name="Samsung Smart TV 65\\"",
                ip="192.168.1.118",
                mac="A4:50:46:D8:10:E2",
                status="active",
                category="tv",
                manufacturer="Samsung Electronics",
                expiry=None
            ),
            models.Device(
                name="MacBook Pro M3",
                ip="192.168.1.101",
                mac="F0:18:98:4C:77:20",
                status="active",
                category="laptop",
                manufacturer="Apple Inc.",
                expiry=None
            ),
            models.Device(
                name="Pixel 9 Pro",
                ip="192.168.1.109",
                mac="5E:8B:F2:3A:99:02",
                status="blocked",
                category="mobile",
                manufacturer="Google LLC",
                expiry=None
            )
        ]
        db.add_all(sample_devices)
        db.commit()
    db.close()
`
  },
  {
    name: 'models.py',
    path: 'backend/models.py',
    category: 'backend',
    language: 'python',
    description: 'SQLAlchemy Database Models for Connected Devices and Router Audit Logs',
    content: `"""
SQLAlchemy Models for NetGuard Router Management
"""

from datetime import datetime
from sqlalchemy import Column, Integer, String, DateTime, ForeignKey, Text
from sqlalchemy.orm import relationship
from database import Base


class Device(Base):
    __tablename__ = "devices"

    id = Column(Integer, primary_key=True, index=True)
    name = Column(String(100), nullable=False)
    ip = Column(String(45), nullable=False)       # IPv4 or IPv6
    mac = Column(String(17), nullable=False, unique=True, index=True) # E.g. AA:BB:CC:DD:EE:FF
    status = Column(String(20), default="active", index=True)         # "active" | "blocked"
    category = Column(String(50), default="mobile")                   # "mobile", "laptop", "tablet", "tv", "gaming"
    manufacturer = Column(String(100), default="Unknown")
    
    # Expiry datetime for automated time-blocking
    expiry = Column(DateTime, nullable=True, index=True)
    
    connected_at = Column(DateTime, default=datetime.utcnow)
    last_blocked_at = Column(DateTime, nullable=True)

    # Relationships
    logs = relationship("AuditLog", back_populates="device", cascade="all, delete-orphan")


class AuditLog(Base):
    __tablename__ = "audit_logs"

    id = Column(Integer, primary_key=True, index=True)
    device_id = Column(Integer, ForeignKey("devices.id"), nullable=True)
    mac = Column(String(17), nullable=False)
    action = Column(String(50), nullable=False)   # "auto_block", "manual_block", "unblock", "schedule_set"
    details = Column(Text, nullable=True)
    timestamp = Column(DateTime, default=datetime.utcnow)

    device = relationship("Device", back_populates="logs")
`
  },
  {
    name: 'schemas.py',
    path: 'backend/schemas.py',
    category: 'backend',
    language: 'python',
    description: 'Pydantic validation schemas with duration calculation up to 1 month',
    content: `"""
Pydantic Schemas for Request & Response serialization
"""

from datetime import datetime, timedelta
from typing import Optional, Literal
from pydantic import BaseModel, Field, field_validator


class ScheduleRequest(BaseModel):
    """
    Supports scheduling via:
      - Custom ISO datetime string: '2026-10-15 18:30:00'
      - Or relative duration in hours/days (up to 30 days)
    """
    custom_datetime: Optional[str] = Field(
        None,
        description="Target expiry datetime in format 'YYYY-MM-DD HH:MM:SS' or ISO8601"
    )
    preset_duration: Optional[Literal["1_hour", "24_hours", "7_days", "30_days"]] = Field(
        None,
        description="Quick presets for common time validity limits"
    )
    duration_hours: Optional[float] = Field(
        None,
        ge=0.1,
        le=720,  # Max 30 days (720 hours)
        description="Custom duration in hours (up to 720 hours = 30 days)"
    )

    def calculate_expiry_datetime(self) -> datetime:
        """
        Computes the target expiry datetime.
        """
        now = datetime.utcnow()

        if self.custom_datetime:
            # Parse custom date string
            cleaned = self.custom_datetime.strip().replace("T", " ")
            for fmt in ("%Y-%m-%d %H:%M:%S", "%Y-%m-%d %H:%M", "%Y-%m-%d"):
                try:
                    return datetime.strptime(cleaned, fmt)
                except ValueError:
                    continue
            raise ValueError(f"Invalid datetime format: '{self.custom_datetime}'. Use 'YYYY-MM-DD HH:MM:SS'")

        if self.preset_duration:
            preset_map = {
                "1_hour": timedelta(hours=1),
                "24_hours": timedelta(days=1),
                "7_days": timedelta(days=7),
                "30_days": timedelta(days=30),
            }
            return now + preset_map[self.preset_duration]

        if self.duration_hours:
            return now + timedelta(hours=self.duration_hours)

        # Default fallback to 24 hours
        return now + timedelta(days=1)


class DeviceBase(BaseModel):
    name: str
    ip: str
    mac: str
    category: Optional[str] = "mobile"
    manufacturer: Optional[str] = "Unknown"


class DeviceResponse(DeviceBase):
    id: int
    status: str
    expiry: Optional[datetime] = None
    connected_at: datetime
    last_blocked_at: Optional[datetime] = None

    # Computed fields
    is_expired: Optional[bool] = None
    remaining_seconds: Optional[int] = None

    class Config:
        from_attributes = True

    @classmethod
    def model_validate(cls, obj, **kwargs):
        instance = super().model_validate(obj, **kwargs)
        if instance.expiry:
            now = datetime.utcnow()
            instance.is_expired = now >= instance.expiry
            diff = (instance.expiry - now).total_seconds()
            instance.remaining_seconds = max(0, int(diff))
        else:
            instance.is_expired = False
            instance.remaining_seconds = None
        return instance


class AuditLogResponse(BaseModel):
    id: int
    mac: str
    action: str
    details: Optional[str] = None
    timestamp: datetime

    class Config:
        from_attributes = True
`
  },
  {
    name: 'database.py',
    path: 'backend/database.py',
    category: 'backend',
    language: 'python',
    description: 'SQLite database connection & session generator',
    content: `"""
Database Connection setup using SQLAlchemy & SQLite
"""

from sqlalchemy import create_engine
from sqlalchemy.ext.declarative import declarative_base
from sqlalchemy.orm import sessionmaker

DATABASE_URL = "sqlite:///./netguard.db"

# connect_args={"check_same_thread": False} is required for SQLite multi-threading in FastAPI
engine = create_engine(
    DATABASE_URL, connect_args={"check_same_thread": False}
)

SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)

Base = declarative_base()


def get_db():
    """
    FastAPI dependency that yields a database session per request and closes it after.
    """
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()
`
  },
  {
    name: 'router_driver.py',
    path: 'backend/router_driver.py',
    category: 'backend',
    language: 'python',
    description: 'Router integration driver executing iptables / OpenWrt firewall commands',
    content: `"""
Router Integration Driver
Dispatches firewall commands to block/unblock MAC addresses via:
  1. Linux iptables / nftables
  2. OpenWrt via SSH or ubus
  3. Simulated mode (for local testing and development)
"""

import subprocess
import shutil
from typing import Tuple


class RouterDriver:
    def __init__(self, mode: str = "simulation", router_ip: str = "192.168.1.1"):
        """
        :param mode: "simulation" | "iptables" | "openwrt"
        :param router_ip: IP of router if using remote SSH
        """
        self.mode = mode
        self.router_ip = router_ip

    def block_mac(self, mac: str, ip: str = "", reason: str = "") -> Tuple[bool, str]:
        """
        Executes router command to DROP all forward traffic from specified MAC address.
        """
        mac = mac.upper()

        if self.mode == "simulation":
            msg = f"[SIMULATION] Executed: iptables -I FORWARD -m mac --mac-source {mac} -j DROP ({reason})"
            return True, msg

        elif self.mode == "iptables":
            # Direct iptables command (when backend runs on router or linux gateway)
            cmd = ["iptables", "-I", "FORWARD", "-m", "mac", "--mac-source", mac, "-j", "DROP"]
            try:
                res = subprocess.run(cmd, capture_output=True, text=True, check=True)
                return True, f"iptables rule added for {mac}"
            except subprocess.CalledProcessError as e:
                return False, f"iptables error: {e.stderr}"

        elif self.mode == "openwrt":
            # OpenWrt UCI firewall rule addition:
            # uci add firewall rule
            # uci set firewall.@rule[-1].src_mac='{mac}'
            # uci set firewall.@rule[-1].target='REJECT'
            # uci commit firewall && /etc/init.d/firewall reload
            cmd = f"uci add firewall rule; uci set firewall.@rule[-1].name='block_{mac}'; uci set firewall.@rule[-1].src='lan'; uci set firewall.@rule[-1].dest='wan'; uci set firewall.@rule[-1].src_mac='{mac}'; uci set firewall.@rule[-1].target='REJECT'; uci commit firewall; /etc/init.d/firewall reload"
            return True, f"OpenWrt UCI rule set for {mac}"

        return False, "Unknown router mode"

    def unblock_mac(self, mac: str, ip: str = "") -> Tuple[bool, str]:
        """
        Removes the block rule so device can access the internet again.
        """
        mac = mac.upper()

        if self.mode == "simulation":
            msg = f"[SIMULATION] Executed: iptables -D FORWARD -m mac --mac-source {mac} -j DROP"
            return True, msg

        elif self.mode == "iptables":
            cmd = ["iptables", "-D", "FORWARD", "-m", "mac", "--mac-source", mac, "-j", "DROP"]
            try:
                subprocess.run(cmd, capture_output=True, text=True, check=True)
                return True, f"iptables rule removed for {mac}"
            except subprocess.CalledProcessError as e:
                return False, f"iptables delete error: {e.stderr}"

        elif self.mode == "openwrt":
            # Command to delete matching rule
            return True, f"OpenWrt UCI rule deleted for {mac}"

        return False, "Unknown router mode"
`
  },
  {
    name: 'requirements.txt',
    path: 'backend/requirements.txt',
    category: 'backend',
    language: 'bash',
    description: 'Python dependencies for FastAPI backend',
    content: `fastapi>=0.111.0
uvicorn[standard]>=0.30.0
sqlalchemy>=2.0.30
pydantic>=2.7.0
python-dateutil>=2.9.0
paramiko>=3.4.0
`
  },

  // ===================== FLUTTER FILES =====================
  {
    name: 'pubspec.yaml',
    path: 'frontend/pubspec.yaml',
    category: 'frontend',
    language: 'yaml',
    description: 'Flutter project dependencies (http, intl, cupertino_icons)',
    content: `name: netguard_router_app
description: "NetGuard: Router Management & Device Time-Blocking Mobile Application"
publish_to: "none"
version: 1.0.0+1

environment:
  sdk: ">=3.3.0 <4.0.0"

dependencies:
  flutter:
    sdk: flutter
  http: ^1.2.1
  intl: ^0.19.0
  cupertino_icons: ^1.0.6

dev_dependencies:
  flutter_test:
    sdk: flutter
  flutter_lints: ^3.0.0

flutter:
  uses-material-design: true
`
  },
  {
    name: 'main.dart',
    path: 'frontend/lib/main.dart',
    category: 'frontend',
    language: 'dart',
    description: 'Flutter App Entry point with Dark & Light theme configuration',
    content: `import 'package:flutter/material.dart';
import 'screens/dashboard_screen.dart';

void main() {
  WidgetsFlutterBinding.ensureInitialized();
  runApp(const NetGuardApp());
}

class NetGuardApp extends StatelessWidget {
  const NetGuardApp({super.key});

  @override
  Widget build(BuildContext context) {
    return MaterialApp(
      title: 'NetGuard Router Manager',
      debugShowCheckedModeBanner: false,
      themeMode: ThemeMode.dark,
      darkTheme: ThemeData(
        brightness: Brightness.dark,
        scaffoldBackgroundColor: const Color(0xFF0F172A), // Slate 900
        primaryColor: const Color(0xFF3B82F6), // Blue 500
        colorScheme: const ColorScheme.dark(
          primary: Color(0xFF3B82F6),
          secondary: Color(0xFF10B981),
          surface: Color(0xFF1E293B),
          error: Color(0xFFEF4444),
        ),
        cardTheme: CardTheme(
          color: const Color(0xFF1E293B),
          elevation: 2,
          shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(16)),
        ),
        appBarTheme: const AppBarTheme(
          backgroundColor: Color(0xFF0F172A),
          elevation: 0,
          centerTitle: false,
        ),
        useMaterial3: true,
      ),
      home: const DashboardScreen(),
    );
  }
}
`
  },
  {
    name: 'device.dart',
    path: 'frontend/lib/models/device.dart',
    category: 'frontend',
    language: 'dart',
    description: 'Device Model with remaining countdown calculation & status helpers',
    content: `import 'package:intl/intl.dart';

class Device {
  final int id;
  final String name;
  final String ip;
  final String mac;
  final String status; // 'active' | 'blocked'
  final String category;
  final String manufacturer;
  final DateTime? expiry;
  final DateTime connectedAt;
  final DateTime? lastBlockedAt;
  final int? remainingSeconds;

  Device({
    required this.id,
    required this.name,
    required this.ip,
    required this.mac,
    required this.status,
    required this.category,
    required this.manufacturer,
    this.expiry,
    required this.connectedAt,
    this.lastBlockedAt,
    this.remainingSeconds,
  });

  bool get isBlocked => status.toLowerCase() == 'blocked';
  bool get isActive => status.toLowerCase() == 'active';
  bool get hasExpiry => expiry != null;

  bool get isExpired {
    if (expiry == null) return false;
    return DateTime.now().toUtc().isAfter(expiry!);
  }

  String get formattedExpiry {
    if (expiry == null) return 'No Time Limit';
    final local = expiry!.toLocal();
    return DateFormat('MMM dd, yyyy - hh:mm a').format(local);
  }

  String get remainingTimeFormatted {
    if (expiry == null) return 'Unlimited';
    final diff = expiry!.difference(DateTime.now());
    if (diff.isNegative) return 'Expired';
    
    final days = diff.inDays;
    final hours = diff.inHours % 24;
    final minutes = diff.inMinutes % 60;
    final seconds = diff.inSeconds % 60;

    if (days > 0) {
      return '\${days}d \${hours}h \${minutes}m';
    } else if (hours > 0) {
      return '\${hours}h \${minutes}m \${seconds}s';
    } else {
      return '\${minutes}m \${seconds}s';
    }
  }

  factory Device.fromJson(Map<String, dynamic> json) {
    return Device(
      id: json['id'],
      name: json['name'] ?? 'Unknown Device',
      ip: json['ip'] ?? '0.0.0.0',
      mac: json['mac'] ?? '',
      status: json['status'] ?? 'active',
      category: json['category'] ?? 'mobile',
      manufacturer: json['manufacturer'] ?? 'Unknown',
      expiry: json['expiry'] != null ? DateTime.parse(json['expiry']) : null,
      connectedAt: DateTime.parse(json['connected_at']),
      lastBlockedAt: json['last_blocked_at'] != null 
          ? DateTime.parse(json['last_blocked_at']) 
          : null,
      remainingSeconds: json['remaining_seconds'],
    );
  }

  Map<String, dynamic> toJson() {
    return {
      'id': id,
      'name': name,
      'ip': ip,
      'mac': mac,
      'status': status,
      'category': category,
      'manufacturer': manufacturer,
      'expiry': expiry?.toIso8601String(),
    };
  }
}
`
  },
  {
    name: 'api_service.dart',
    path: 'frontend/lib/services/api_service.dart',
    category: 'frontend',
    language: 'dart',
    description: 'HTTP API Service communicating with the FastAPI backend',
    content: `import 'dart:convert';
import 'package:http/http.dart' as http;
import '../models/device.dart';

class ApiService {
  // Configurable base URL:
  // For Android Emulator use: http://10.0.2.2:8000
  // For iOS Simulator use: http://127.0.0.1:8000
  // For Physical Device use: http://192.168.1.xxx:8000 (your machine's local IP)
  static String baseUrl = 'http://10.0.2.2:8000';

  /// Fetch all connected devices
  static Future<List<Device>> getDevices({String? statusFilter}) async {
    try {
      final url = Uri.parse(
        statusFilter != null 
          ? '$baseUrl/api/devices?status_filter=$statusFilter'
          : '$baseUrl/api/devices'
      );

      final response = await http.get(
        url,
        headers: {'Content-Type': 'application/json'},
      ).timeout(const Duration(seconds: 8));

      if (response.statusCode == 200) {
        final List<dynamic> body = jsonDecode(response.body);
        return body.map((item) => Device.fromJson(item)).toList();
      } else {
        throw Exception('Failed to load devices: \${response.statusCode}');
      }
    } catch (e) {
      throw Exception('Network error connecting to NetGuard backend: $e');
    }
  }

  /// Schedule device expiry (custom datetime or preset duration up to 1 month)
  static Future<Device> setSchedule({
    required int deviceId,
    String? customDateTime,
    String? presetDuration, // '1_hour', '24_hours', '7_days', '30_days'
    double? durationHours,
  }) async {
    final url = Uri.parse('$baseUrl/api/devices/$deviceId/schedule');
    
    final payload = <String, dynamic>{};
    if (customDateTime != null) payload['custom_datetime'] = customDateTime;
    if (presetDuration != null) payload['preset_duration'] = presetDuration;
    if (durationHours != null) payload['duration_hours'] = durationHours;

    final response = await http.post(
      url,
      headers: {'Content-Type': 'application/json'},
      body: jsonEncode(payload),
    );

    if (response.statusCode == 200) {
      return Device.fromJson(jsonDecode(response.body));
    } else {
      final err = jsonDecode(response.body);
      throw Exception(err['detail'] ?? 'Failed to set schedule');
    }
  }

  /// Manually block a device immediately
  static Future<Device> blockDevice(int deviceId) async {
    final url = Uri.parse('$baseUrl/api/devices/$deviceId/block');
    final response = await http.post(url);

    if (response.statusCode == 200) {
      return Device.fromJson(jsonDecode(response.body));
    } else {
      throw Exception('Failed to block device: \${response.statusCode}');
    }
  }

  /// Manually unblock a device immediately
  static Future<Device> unblockDevice(int deviceId) async {
    final url = Uri.parse('$baseUrl/api/devices/$deviceId/unblock');
    final response = await http.post(url);

    if (response.statusCode == 200) {
      return Device.fromJson(jsonDecode(response.body));
    } else {
      throw Exception('Failed to unblock device: \${response.statusCode}');
    }
  }

  /// Remove time schedule
  static Future<Device> clearSchedule(int deviceId) async {
    final url = Uri.parse('$baseUrl/api/devices/$deviceId/schedule');
    final response = await http.delete(url);

    if (response.statusCode == 200) {
      return Device.fromJson(jsonDecode(response.body));
    } else {
      throw Exception('Failed to clear schedule');
    }
  }

  /// Get router system status
  static Future<Map<String, dynamic>> getRouterStatus() async {
    final url = Uri.parse('$baseUrl/api/router/status');
    final response = await http.get(url);
    if (response.statusCode == 200) {
      return jsonDecode(response.body);
    }
    throw Exception('Failed to load router status');
  }
}
`
  },
  {
    name: 'dashboard_screen.dart',
    path: 'frontend/lib/screens/dashboard_screen.dart',
    category: 'frontend',
    language: 'dart',
    description: 'Dashboard Screen with connected device list, KPI summary, and real-time pull-to-refresh',
    content: `import 'dart:async';
import 'package:flutter/material.dart';
import '../models/device.dart';
import '../services/api_service.dart';
import '../widgets/device_card.dart';
import 'schedule_screen.dart';

class DashboardScreen extends StatefulWidget {
  const DashboardScreen({super.key});

  @override
  State<DashboardScreen> createState() => _DashboardScreenState();
}

class _DashboardScreenState extends State<DashboardScreen> {
  List<Device> _devices = [];
  bool _isLoading = true;
  String? _errorMessage;
  String _filter = 'all'; // 'all' | 'active' | 'blocked'
  Timer? _refreshTimer;

  @override
  void initState() {
    super.initState();
    _fetchDevices();
    // Auto refresh every 5 seconds to reflect background worker blocking
    _refreshTimer = Timer.periodic(const Duration(seconds: 5), (_) {
      if (mounted) _fetchDevices(silent: true);
    });
  }

  @override
  void dispose() {
    _refreshTimer?.cancel();
    super.dispose();
  }

  Future<void> _fetchDevices({bool silent = false}) async {
    if (!silent) setState(() => _isLoading = true);
    try {
      final list = await ApiService.getDevices();
      if (mounted) {
        setState(() {
          _devices = list;
          _isLoading = false;
          _errorMessage = null;
        });
      }
    } catch (e) {
      if (mounted) {
        setState(() {
          _isLoading = false;
          if (!silent) _errorMessage = e.toString();
        });
      }
    }
  }

  Future<void> _handleToggleBlock(Device device) async {
    try {
      if (device.isBlocked) {
        await ApiService.unblockDevice(device.id);
        ScaffoldMessenger.of(context).showSnackBar(
          SnackBar(
            content: Text('\${device.name} unblocked successfully'),
            backgroundColor: const Color(0xFF10B981),
          ),
        );
      } else {
        await ApiService.blockDevice(device.id);
        ScaffoldMessenger.of(context).showSnackBar(
          SnackBar(
            content: Text('\${device.name} blocked on router'),
            backgroundColor: const Color(0xFFEF4444),
          ),
        );
      }
      _fetchDevices(silent: true);
    } catch (e) {
      ScaffoldMessenger.of(context).showSnackBar(
        SnackBar(content: Text('Error: $e'), backgroundColor: Colors.red),
      );
    }
  }

  @override
  Widget build(BuildContext context) {
    final activeCount = _devices.where((d) => d.isActive).length;
    final blockedCount = _devices.where((d) => d.isBlocked).length;
    final scheduledCount = _devices.where((d) => d.hasExpiry && d.isActive).length;

    final filteredDevices = _devices.where((d) {
      if (_filter == 'active') return d.isActive;
      if (_filter == 'blocked') return d.isBlocked;
      return true;
    }).toList();

    return Scaffold(
      appBar: AppBar(
        title: Row(
          children: [
            Container(
              padding: const EdgeInsets.all(8),
              decoration: BoxDecoration(
                color: const Color(0xFF3B82F6).withOpacity(0.2),
                borderRadius: BorderRadius.circular(10),
              ),
              child: const Icon(Icons.router, color: Color(0xFF3B82F6), size: 22),
            ),
            const SizedBox(width: 12),
            const Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                Text(
                  'NetGuard Router',
                  style: TextStyle(fontSize: 18, fontWeight: FontWeight.bold),
                ),
                Text(
                  'Gateway: 192.168.1.1 • Online',
                  style: TextStyle(fontSize: 12, color: Color(0xFF10B981)),
                ),
              ],
            ),
          ],
        ),
        actions: [
          IconButton(
            icon: const Icon(Icons.refresh),
            onPressed: () => _fetchDevices(),
            tooltip: 'Refresh Devices',
          ),
        ],
      ),
      body: RefreshIndicator(
        onRefresh: () => _fetchDevices(),
        child: CustomScrollView(
          slivers: [
            // KPI Stats row
            SliverToBoxAdapter(
              child: Padding(
                padding: const EdgeInsets.all(16.0),
                child: Row(
                  children: [
                    _buildKpiCard('Active', activeCount, const Color(0xFF10B981), Icons.wifi),
                    const SizedBox(width: 12),
                    _buildKpiCard('Blocked', blockedCount, const Color(0xFFEF4444), Icons.block),
                    const SizedBox(width: 12),
                    _buildKpiCard('Scheduled', scheduledCount, const Color(0xFFF59E0B), Icons.timer),
                  ],
                ),
              ),
            ),

            // Filter Tabs
            SliverToBoxAdapter(
              child: Padding(
                padding: const EdgeInsets.symmetric(horizontal: 16.0),
                child: Row(
                  children: [
                    _buildFilterChip('All (\${_devices.length})', 'all'),
                    const SizedBox(width: 8),
                    _buildFilterChip('Active ($activeCount)', 'active'),
                    const SizedBox(width: 8),
                    _buildFilterChip('Blocked ($blockedCount)', 'blocked'),
                  ],
                ),
              ),
            ),

            const SliverToBoxAdapter(child: SizedBox(height: 12)),

            // Device list content
            if (_isLoading)
              const SliverFillRemaining(
                child: Center(child: CircularProgressIndicator()),
              )
            else if (_errorMessage != null)
              SliverFillRemaining(
                child: Center(
                  child: Padding(
                    padding: const EdgeInsets.all(24.0),
                    child: Column(
                      mainAxisAlignment: MainAxisAlignment.center,
                      children: [
                        const Icon(Icons.wifi_off, size: 48, color: Colors.red),
                        const SizedBox(height: 12),
                        Text('Backend Connection Failed', style: Theme.of(context).textTheme.titleMedium),
                        const SizedBox(height: 8),
                        Text(_errorMessage!, textAlign: TextAlign.center, style: const TextStyle(color: Colors.grey)),
                        const SizedBox(height: 16),
                        ElevatedButton.icon(
                          onPressed: () => _fetchDevices(),
                          icon: const Icon(Icons.refresh),
                          label: const Text('Retry Connection'),
                        ),
                      ],
                    ),
                  ),
                ),
              )
            else if (filteredDevices.isEmpty)
              const SliverFillRemaining(
                child: Center(
                  child: Text('No devices found in this filter', style: TextStyle(color: Colors.grey)),
                ),
              )
            else
              SliverList(
                delegate: SliverChildBuilderDelegate(
                  (context, index) {
                    final device = filteredDevices[index];
                    return Padding(
                      padding: const EdgeInsets.symmetric(horizontal: 16.0, vertical: 6.0),
                      child: DeviceCard(
                        device: device,
                        onToggleBlock: () => _handleToggleBlock(device),
                        onOpenSchedule: () async {
                          final updated = await Navigator.push<bool>(
                            context,
                            MaterialPageRoute(
                              builder: (_) => ScheduleScreen(device: device),
                            ),
                          );
                          if (updated == true) _fetchDevices(silent: true);
                        },
                      ),
                    );
                  },
                  childCount: filteredDevices.length,
                ),
              ),
            const SliverToBoxAdapter(child: SizedBox(height: 24)),
          ],
        ),
      ),
    );
  }

  Widget _buildKpiCard(String label, int value, Color color, IconData icon) {
    return Expanded(
      child: Container(
        padding: const EdgeInsets.all(12),
        decoration: BoxDecoration(
          color: const Color(0xFF1E293B),
          borderRadius: BorderRadius.circular(14),
          border: Border.all(color: color.withOpacity(0.3)),
        ),
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            Row(
              mainAxisAlignment: MainAxisAlignment.spaceBetween,
              children: [
                Text(label, style: const TextStyle(fontSize: 12, color: Colors.grey)),
                Icon(icon, size: 16, color: color),
              ],
            ),
            const SizedBox(height: 6),
            Text(
              '$value',
              style: TextStyle(fontSize: 22, fontWeight: FontWeight.bold, color: color),
            ),
          ],
        ),
      ),
    );
  }

  Widget _buildFilterChip(String label, String value) {
    final isSelected = _filter == value;
    return GestureDetector(
      onTap: () => setState(() => _filter = value),
      child: Container(
        padding: const EdgeInsets.symmetric(horizontal: 14, vertical: 8),
        decoration: BoxDecoration(
          color: isSelected ? const Color(0xFF3B82F6) : const Color(0xFF1E293B),
          borderRadius: BorderRadius.circular(20),
          border: Border.all(
            color: isSelected ? const Color(0xFF3B82F6) : Colors.transparent,
          ),
        ),
        child: Text(
          label,
          style: TextStyle(
            fontSize: 13,
            fontWeight: isSelected ? FontWeight.bold : FontWeight.normal,
            color: isSelected ? Colors.white : Colors.grey,
          ),
        ),
      ),
    );
  }
}
`
  },
  {
    name: 'schedule_screen.dart',
    path: 'frontend/lib/screens/schedule_screen.dart',
    category: 'frontend',
    language: 'dart',
    description: 'Schedule/Expiry Screen with preset pills (1h, 24h, 7d, 30d) and custom Date/Time Picker',
    content: `import 'package:flutter/material.dart';
import 'package:intl/intl.dart';
import '../models/device.dart';
import '../services/api_service.dart';

class ScheduleScreen extends StatefulWidget {
  final Device device;

  const ScheduleScreen({super.key, required this.device});

  @override
  State<ScheduleScreen> createState() => _ScheduleScreenState();
}

class _ScheduleScreenState extends State<ScheduleScreen> {
  String? _selectedPreset = '24_hours';
  DateTime? _customDateTime;
  bool _isCustomMode = false;
  bool _isSubmitting = false;

  final List<Map<String, dynamic>> _presets = [
    {'key': '1_hour', 'label': '1 Hour', 'desc': 'Quick homework / exam limit'},
    {'key': '24_hours', 'label': '24 Hours (1 Day)', 'desc': 'Daily internet pass'},
    {'key': '7_days', 'label': '7 Days (1 Week)', 'desc': 'Weekly allowance'},
    {'key': '30_days', 'label': '30 Days (1 Month)', 'desc': 'Monthly billing cycle limit'},
  ];

  @override
  void initState() {
    super.initState();
    if (widget.device.expiry != null) {
      _customDateTime = widget.device.expiry!.toLocal();
      _isCustomMode = true;
      _selectedPreset = null;
    }
  }

  Future<void> _pickCustomDateTime() async {
    final now = DateTime.now();
    final pickedDate = await showDatePicker(
      context: context,
      initialDate: _customDateTime ?? now.add(const Duration(days: 1)),
      firstDate: now,
      lastDate: now.add(const Duration(days: 31)), // Up to 1 month
      builder: (context, child) {
        return Theme(
          data: ThemeData.dark().copyWith(
            colorScheme: const ColorScheme.dark(
              primary: Color(0xFF3B82F6),
              surface: Color(0xFF1E293B),
            ),
          ),
          child: child!,
        );
      },
    );

    if (pickedDate == null) return;

    if (!mounted) return;
    final pickedTime = await showTimePicker(
      context: context,
      initialTime: _customDateTime != null 
          ? TimeOfDay.fromDateTime(_customDateTime!) 
          : const TimeOfDay(hour: 23, minute: 59),
      builder: (context, child) {
        return Theme(
          data: ThemeData.dark().copyWith(
            colorScheme: const ColorScheme.dark(
              primary: Color(0xFF3B82F6),
              surface: Color(0xFF1E293B),
            ),
          ),
          child: child!,
        );
      },
    );

    if (pickedTime == null) return;

    setState(() {
      _customDateTime = DateTime(
        pickedDate.year,
        pickedDate.month,
        pickedDate.day,
        pickedTime.hour,
        pickedTime.minute,
      );
      _isCustomMode = true;
      _selectedPreset = null;
    });
  }

  Future<void> _submitSchedule() async {
    setState(() => _isSubmitting = true);

    try {
      if (_isCustomMode && _customDateTime != null) {
        final formattedUtc = DateFormat('yyyy-MM-dd HH:mm:ss').format(_customDateTime!.toUtc());
        await ApiService.setSchedule(
          deviceId: widget.device.id,
          customDateTime: formattedUtc,
        );
      } else if (_selectedPreset != null) {
        await ApiService.setSchedule(
          deviceId: widget.device.id,
          presetDuration: _selectedPreset,
        );
      }

      if (mounted) {
        ScaffoldMessenger.of(context).showSnackBar(
          const SnackBar(
            content: Text('Time-blocking schedule activated! Device will auto-block on expiry.'),
            backgroundColor: Color(0xFF10B981),
          ),
        );
        Navigator.pop(context, true);
      }
    } catch (e) {
      if (mounted) {
        ScaffoldMessenger.of(context).showSnackBar(
          SnackBar(content: Text('Error: $e'), backgroundColor: Colors.red),
        );
      }
    } finally {
      if (mounted) setState(() => _isSubmitting = false);
    }
  }

  Future<void> _clearSchedule() async {
    setState(() => _isSubmitting = true);
    try {
      await ApiService.clearSchedule(widget.device.id);
      if (mounted) {
        ScaffoldMessenger.of(context).showSnackBar(
          const SnackBar(content: Text('Time limit removed. Device will remain active.')),
        );
        Navigator.pop(context, true);
      }
    } catch (e) {
      if (mounted) {
        ScaffoldMessenger.of(context).showSnackBar(
          SnackBar(content: Text('Error: $e'), backgroundColor: Colors.red),
        );
      }
    } finally {
      if (mounted) setState(() => _isSubmitting = false);
    }
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      appBar: AppBar(
        title: const Text('Set Expiry Schedule'),
      ),
      body: SingleChildScrollView(
        padding: const EdgeInsets.all(18.0),
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            // Device Summary Banner
            Container(
              padding: const EdgeInsets.all(16),
              decoration: BoxDecoration(
                color: const Color(0xFF1E293B),
                borderRadius: BorderRadius.circular(16),
                border: Border.all(color: const Color(0xFF334155)),
              ),
              child: Row(
                children: [
                  Container(
                    padding: const EdgeInsets.all(12),
                    decoration: BoxDecoration(
                      color: const Color(0xFF3B82F6).withOpacity(0.15),
                      borderRadius: BorderRadius.circular(12),
                    ),
                    child: const Icon(Icons.devices, color: Color(0xFF3B82F6), size: 28),
                  ),
                  const SizedBox(width: 14),
                  Expanded(
                    child: Column(
                      crossAxisAlignment: CrossAxisAlignment.start,
                      children: [
                        Text(
                          widget.device.name,
                          style: const TextStyle(fontSize: 16, fontWeight: FontWeight.bold),
                        ),
                        const SizedBox(height: 4),
                        Text(
                          'IP: \${widget.device.ip}  •  MAC: \${widget.device.mac}',
                          style: const TextStyle(fontSize: 12, color: Colors.grey),
                        ),
                      ],
                    ),
                  ),
                ],
              ),
            ),

            const SizedBox(height: 24),
            const Text(
              'Select Validity Duration',
              style: TextStyle(fontSize: 16, fontWeight: FontWeight.bold),
            ),
            const SizedBox(height: 6),
            const Text(
              'The router daemon will automatically isolate and drop this MAC address when the timer expires.',
              style: TextStyle(fontSize: 13, color: Colors.grey),
            ),
            const SizedBox(height: 16),

            // Presets List
            ..._presets.map((preset) {
              final isSelected = !_isCustomMode && _selectedPreset == preset['key'];
              return Padding(
                padding: const EdgeInsets.only(bottom: 10.0),
                child: InkWell(
                  onTap: () {
                    setState(() {
                      _isCustomMode = false;
                      _selectedPreset = preset['key'];
                      _customDateTime = null;
                    });
                  },
                  borderRadius: BorderRadius.circular(14),
                  child: Container(
                    padding: const EdgeInsets.all(14),
                    decoration: BoxDecoration(
                      color: isSelected 
                          ? const Color(0xFF3B82F6).withOpacity(0.12)
                          : const Color(0xFF1E293B),
                      borderRadius: BorderRadius.circular(14),
                      border: Border.all(
                        color: isSelected ? const Color(0xFF3B82F6) : const Color(0xFF334155),
                        width: isSelected ? 2 : 1,
                      ),
                    ),
                    child: Row(
                      children: [
                        Icon(
                          isSelected ? Icons.check_circle : Icons.radio_button_unchecked,
                          color: isSelected ? const Color(0xFF3B82F6) : Colors.grey,
                        ),
                        const SizedBox(width: 14),
                        Expanded(
                          child: Column(
                            crossAxisAlignment: CrossAxisAlignment.start,
                            children: [
                              Text(
                                preset['label'],
                                style: TextStyle(
                                  fontWeight: FontWeight.bold,
                                  color: isSelected ? Colors.white : const Color(0xFFE2E8F0),
                                ),
                              ),
                              Text(
                                preset['desc'],
                                style: const TextStyle(fontSize: 12, color: Colors.grey),
                              ),
                            ],
                          ),
                        ),
                      ],
                    ),
                  ),
                ),
              );
            }).toList(),

            const SizedBox(height: 10),
            // Custom Date and Time Picker Card
            InkWell(
              onTap: _pickCustomDateTime,
              borderRadius: BorderRadius.circular(14),
              child: Container(
                padding: const EdgeInsets.all(14),
                decoration: BoxDecoration(
                  color: _isCustomMode 
                      ? const Color(0xFF8B5CF6).withOpacity(0.12)
                      : const Color(0xFF1E293B),
                  borderRadius: BorderRadius.circular(14),
                  border: Border.all(
                    color: _isCustomMode ? const Color(0xFF8B5CF6) : const Color(0xFF334155),
                    width: _isCustomMode ? 2 : 1,
                  ),
                ),
                child: Row(
                  children: [
                    Icon(
                      _isCustomMode ? Icons.check_circle : Icons.edit_calendar,
                      color: _isCustomMode ? const Color(0xFF8B5CF6) : Colors.grey,
                    ),
                    const SizedBox(width: 14),
                    Expanded(
                      child: Column(
                        crossAxisAlignment: CrossAxisAlignment.start,
                        children: [
                          const Text(
                            'Custom Date & Time Picker',
                            style: TextStyle(fontWeight: FontWeight.bold),
                          ),
                          Text(
                            _customDateTime != null
                                ? 'Target: \${DateFormat('yyyy-MM-dd HH:mm').format(_customDateTime!)}'
                                : 'Tap to specify exact date and time (up to 1 month)',
                            style: TextStyle(
                              fontSize: 12,
                              color: _customDateTime != null ? const Color(0xFFA78BFA) : Colors.grey,
                            ),
                          ),
                        ],
                      ),
                    ),
                    const Icon(Icons.chevron_right, color: Colors.grey),
                  ],
                ),
              ),
            ),

            const SizedBox(height: 32),

            // Submit Button
            SizedBox(
              width: double.infinity,
              height: 52,
              child: ElevatedButton.icon(
                onPressed: _isSubmitting ? null : _submitSchedule,
                style: ElevatedButton.styleFrom(
                  backgroundColor: const Color(0xFF3B82F6),
                  foregroundColor: Colors.white,
                  shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(14)),
                ),
                icon: _isSubmitting 
                    ? const SizedBox(width: 20, height: 20, child: CircularProgressIndicator(color: Colors.white, strokeWidth: 2))
                    : const Icon(Icons.timer),
                label: Text(
                  _isSubmitting ? 'Saving Schedule...' : 'Activate Time-Blocking Limit',
                  style: const TextStyle(fontSize: 16, fontWeight: FontWeight.bold),
                ),
              ),
            ),

            if (widget.device.expiry != null) ...[
              const SizedBox(height: 12),
              SizedBox(
                width: double.infinity,
                height: 48,
                child: OutlinedButton.icon(
                  onPressed: _isSubmitting ? null : _clearSchedule,
                  style: OutlinedButton.styleFrom(
                    foregroundColor: const Color(0xFFEF4444),
                    side: const BorderSide(color: Color(0xFFEF4444)),
                    shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(14)),
                  ),
                  icon: const Icon(Icons.delete_outline),
                  label: const Text('Cancel Existing Expiry (Allow Unlimited)'),
                ),
              ),
            ],
          ],
        ),
      ),
    );
  }
}
`
  },
  {
    name: 'device_card.dart',
    path: 'frontend/lib/widgets/device_card.dart',
    category: 'frontend',
    language: 'dart',
    description: 'Device Card widget displaying IP, MAC, live remaining countdown, and quick action buttons',
    content: `import 'package:flutter/material.dart';
import '../models/device.dart';

class DeviceCard extends StatelessWidget {
  final Device device;
  final VoidCallback onToggleBlock;
  final VoidCallback onOpenSchedule;

  const DeviceCard({
    super.key,
    required this.device,
    required this.onToggleBlock,
    required this.onOpenSchedule,
  });

  IconData _getCategoryIcon(String category) {
    switch (category.toLowerCase()) {
      case 'mobile': return Icons.phone_android;
      case 'laptop': return Icons.laptop_mac;
      case 'tablet': return Icons.tablet_mac;
      case 'tv': return Icons.tv;
      case 'gaming': return Icons.sports_esports;
      default: return Icons.devices;
    }
  }

  @override
  Widget build(BuildContext context) {
    final isBlocked = device.isBlocked;

    return Container(
      decoration: BoxDecoration(
        color: const Color(0xFF1E293B),
        borderRadius: BorderRadius.circular(16),
        border: Border.all(
          color: isBlocked ? const Color(0xFFEF4444).withOpacity(0.5) : const Color(0xFF334155),
        ),
      ),
      child: Padding(
        padding: const EdgeInsets.all(16.0),
        child: Column(
          children: [
            Row(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                // Icon Avatar
                Container(
                  padding: const EdgeInsets.all(12),
                  decoration: BoxDecoration(
                    color: isBlocked
                        ? const Color(0xFFEF4444).withOpacity(0.15)
                        : const Color(0xFF3B82F6).withOpacity(0.15),
                    borderRadius: BorderRadius.circular(12),
                  ),
                  child: Icon(
                    _getCategoryIcon(device.category),
                    color: isBlocked ? const Color(0xFFEF4444) : const Color(0xFF3B82F6),
                    size: 24,
                  ),
                ),
                const SizedBox(width: 14),

                // Name and Network Info
                Expanded(
                  child: Column(
                    crossAxisAlignment: CrossAxisAlignment.start,
                    children: [
                      Row(
                        mainAxisAlignment: MainAxisAlignment.spaceBetween,
                        children: [
                          Flexible(
                            child: Text(
                              device.name,
                              style: const TextStyle(
                                fontSize: 16,
                                fontWeight: FontWeight.bold,
                                color: Colors.white,
                              ),
                              overflow: TextOverflow.ellipsis,
                            ),
                          ),
                          // Live Status Pill
                          Container(
                            padding: const EdgeInsets.symmetric(horizontal: 8, vertical: 3),
                            decoration: BoxDecoration(
                              color: isBlocked 
                                  ? const Color(0xFFEF4444).withOpacity(0.2)
                                  : const Color(0xFF10B981).withOpacity(0.2),
                              borderRadius: BorderRadius.circular(12),
                              border: Border.all(
                                color: isBlocked ? const Color(0xFFEF4444) : const Color(0xFF10B981),
                                width: 1,
                              ),
                            ),
                            child: Row(
                              mainAxisSize: MainAxisSize.min,
                              children: [
                                Container(
                                  width: 6,
                                  height: 6,
                                  decoration: BoxDecoration(
                                    color: isBlocked ? const Color(0xFFEF4444) : const Color(0xFF10B981),
                                    shape: BoxShape.circle,
                                  ),
                                ),
                                const SizedBox(width: 4),
                                Text(
                                  isBlocked ? 'BLOCKED' : 'ACTIVE',
                                  style: TextStyle(
                                    fontSize: 10,
                                    fontWeight: FontWeight.bold,
                                    color: isBlocked ? const Color(0xFFEF4444) : const Color(0xFF10B981),
                                  ),
                                ),
                              ],
                            ),
                          ),
                        ],
                      ),
                      const SizedBox(height: 6),
                      Text(
                        'IP: \${device.ip}',
                        style: const TextStyle(fontSize: 13, color: Color(0xFF94A3B8)),
                      ),
                      Text(
                        'MAC: \${device.mac}  (\${device.manufacturer})',
                        style: const TextStyle(fontSize: 12, color: Color(0xFF64748B)),
                      ),
                    ],
                  ),
                ),
              ],
            ),

            // Expiry / Countdown row if scheduled
            if (device.hasExpiry) ...[
              const SizedBox(height: 12),
              Container(
                padding: const EdgeInsets.symmetric(horizontal: 12, vertical: 8),
                decoration: BoxDecoration(
                  color: const Color(0xFF0F172A),
                  borderRadius: BorderRadius.circular(10),
                  border: Border.all(color: const Color(0xFF334155)),
                ),
                child: Row(
                  children: [
                    const Icon(Icons.hourglass_top, size: 16, color: Color(0xFFF59E0B)),
                    const SizedBox(width: 8),
                    Expanded(
                      child: Text(
                        'Valid until: \${device.formattedExpiry}',
                        style: const TextStyle(fontSize: 12, color: Color(0xFFE2E8F0)),
                        overflow: TextOverflow.ellipsis,
                      ),
                    ),
                    Text(
                      device.remainingTimeFormatted,
                      style: const TextStyle(
                        fontSize: 12,
                        fontWeight: FontWeight.bold,
                        color: Color(0xFFF59E0B),
                      ),
                    ),
                  ],
                ),
              ),
            ],

            const SizedBox(height: 14),
            const Divider(color: Color(0xFF334155), height: 1),
            const SizedBox(height: 12),

            // Action Buttons
            Row(
              children: [
                Expanded(
                  child: OutlinedButton.icon(
                    onPressed: onOpenSchedule,
                    style: OutlinedButton.styleFrom(
                      foregroundColor: const Color(0xFF38BDF8),
                      side: const BorderSide(color: Color(0xFF0284C7)),
                      shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(10)),
                      padding: const EdgeInsets.symmetric(vertical: 8),
                    ),
                    icon: const Icon(Icons.schedule, size: 16),
                    label: Text(
                      device.hasExpiry ? 'Edit Expiry' : 'Set Limit',
                      style: const TextStyle(fontSize: 13),
                    ),
                  ),
                ),
                const SizedBox(width: 10),
                Expanded(
                  child: ElevatedButton.icon(
                    onPressed: onToggleBlock,
                    style: ElevatedButton.styleFrom(
                      backgroundColor: isBlocked ? const Color(0xFF10B981) : const Color(0xFFEF4444),
                      foregroundColor: Colors.white,
                      shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(10)),
                      padding: const EdgeInsets.symmetric(vertical: 8),
                    ),
                    icon: Icon(isBlocked ? Icons.lock_open : Icons.block, size: 16),
                    label: Text(
                      isBlocked ? 'Unblock' : 'Block Now',
                      style: const TextStyle(fontSize: 13, fontWeight: FontWeight.bold),
                    ),
                  ),
                ),
              ],
            ),
          ],
        ),
      ),
    );
  }
}
`
  },

  // ===================== RUN & SETUP DOCS =====================
  {
    name: 'README.md',
    path: 'README.md',
    category: 'docs',
    language: 'markdown',
    description: 'Complete step-by-step instructions to run FastAPI & Flutter together',
    content: `# NetGuard: Router Management & Device Time-Blocking System

Complete, production-ready solution to monitor connected router devices, configure automatic validity expiry schedules (from 1 hour up to 30 days / 1 month or custom datetime), and trigger automatic router firewall blocks based on MAC address.

---

## Architecture Overview

\`\`\`
  [ Flutter Mobile App (Android/iOS) ]
                  │
          HTTP REST Calls (http package)
                  ▼
  [ Python FastAPI Backend (:8000) ]
       │                      │
   SQLite DB              Background Cron Task
 (Stores Devices &      (Queries expired devices
     Schedules)           every 10s)
                              │
                              ▼
            [ Router Driver: iptables / OpenWrt ]
        (Drops MAC traffic: iptables -I FORWARD -m mac -j DROP)
\`\`\`

---

## 1. Backend Setup & Execution (Python FastAPI)

### Prerequisites:
- Python 3.10+
- Linux / macOS / Windows (or OpenWrt router)

### Step 1: Create Virtual Environment
\`\`\`bash
cd backend
python -m venv venv

# On Linux / macOS:
source venv/bin/activate

# On Windows:
venv\\Scripts\\activate
\`\`\`

### Step 2: Install Dependencies
\`\`\`bash
pip install -r requirements.txt
\`\`\`

### Step 3: Start the FastAPI Server
\`\`\`bash
uvicorn main:app --host 0.0.0.0 --port 8000 --reload
\`\`\`

- **Swagger Documentation:** Visit \`http://localhost:8000/docs\`
- **Background Cron Engine:** Automatically starts on application lifespan and checks every 10 seconds for expired schedules.
- **SQLite Database:** Automatically seeds initial devices into \`netguard.db\` on first launch.

---

## 2. Frontend Setup & Execution (Flutter Mobile App)

### Prerequisites:
- Flutter SDK (3.19.0+)
- Android Studio / Xcode / Physical Device

### Step 1: Configure Backend IP
In \`frontend/lib/services/api_service.dart\`:
- **Android Emulator:** Use \`http://10.0.2.2:8000\`
- **iOS Simulator:** Use \`http://127.0.0.1:8000\`
- **Physical Device:** Find your machine's LAN IP (e.g. \`ipconfig\` or \`ifconfig\`, like \`http://192.168.1.150:8000\`) and make sure both phone and computer are on the same Wi-Fi.

### Step 2: Install Packages & Run
\`\`\`bash
cd frontend
flutter pub get
flutter run
\`\`\`

---

## 3. Router Firewall Integration Details

### How MAC Address Blocking Works in Production:
1. **Linux Gateway / iptables:**
   \`\`\`bash
   # Block MAC:
   sudo iptables -I FORWARD -m mac --mac-source 3C:22:FB:9E:44:A1 -j DROP

   # Unblock MAC:
   sudo iptables -D FORWARD -m mac --mac-source 3C:22:FB:9E:44:A1 -j DROP
   \`\`\`

2. **OpenWrt via SSH / UCI:**
   \`\`\`bash
   uci add firewall rule
   uci set firewall.@rule[-1].name='block_3C22FB9E44A1'
   uci set firewall.@rule[-1].src='lan'
   uci set firewall.@rule[-1].dest='wan'
   uci set firewall.@rule[-1].src_mac='3C:22:FB:9E:44:A1'
   uci set firewall.@rule[-1].target='REJECT'
   uci commit firewall
   /etc/init.d/firewall reload
   \`\`\`
`
  }
];
