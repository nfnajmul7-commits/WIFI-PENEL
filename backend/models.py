"""
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
