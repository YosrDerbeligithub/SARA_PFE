from pydantic import BaseModel, Field, EmailStr
from typing import Literal, Optional

class StreamRequest(BaseModel):
    facility: Literal["museum", "istic", "uoa"] = Field(..., description="Facility code (e.g., museum, istic, uoa)")
    sensor_box_id: str = Field(..., description="Unique sensor box identifier")
    sensor_type: Literal[
        'device','humidity','luminance','microphone',
        'motion','presence','radio','temperature',
        'thermalmap','thermography'
    ] = Field(..., description="Type of sensor"),
    email: EmailStr = Field(..., description="Authenticated user’s email")


class RealTimeControl(BaseModel):
    frequency: Optional[int] = Field(
        None, description="Update frequency in seconds (default 60)"
    )
    aggregation_metric: Optional[str] = Field(
        None, description="Statistical metric (average, sum, etc.)"
    )
    buffer_time: Optional[int] = Field(
        None, description="Buffer time in seconds for real-time aggregation"
    )
    pause: Optional[bool] = Field(False, description="Pause the live stream")