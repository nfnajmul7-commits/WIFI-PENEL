"""
Pydantic Schemas for Request & Response serialization
"""

from datetime import datetime, timedelta
from typing import Optional, Literal
from pydantic import BaseModel, Field


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


class QuickAddRequest(BaseModel):
    """
    Allows adding a device with ONLY the MAC address.
    Name and IP will be automatically derived or fetched from ARP/DHCP lease table.
    """
    mac: str = Field(..., description="Device MAC address e.g. 'AA:BB:CC:DD:EE:FF'")
    name: Optional[str] = Field(None, description="Optional custom device name")
    ip: Optional[str] = Field(None, description="Optional IP address")
    duration: Optional[str] = Field("7_days", description="'1_day' | '7_days' | '15_days' | '30_days' | 'custom' | 'unlimited'")
    custom_expiry: Optional[str] = Field(None, description="Optional custom expiry datetime string")


class ConnectionHistoryResponse(BaseModel):
    id: int
    mac: str
    ip: str
    name: str
    category: str
    manufacturer: str
    first_seen: datetime
    last_seen: datetime
    connection_count: int
    current_status: str
    is_currently_managed: bool
    expiry: Optional[datetime] = None

    class Config:
        from_attributes = True


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
