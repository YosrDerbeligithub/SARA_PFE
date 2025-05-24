
from pydantic_settings import BaseSettings
from typing import ClassVar  # 👈 Add this import

from pydantic import Field, SecretStr
from pytz import timezone

class Settings(BaseSettings):
    # External Data API

    data_api_url: str = "https://teamapps.u-aizu.ac.jp/sense"
    facility: str = "uoa"

    #for time zone awareness
    FACILITY_TIMEZONES: ClassVar[dict] = {
        "uoa": timezone("Asia/Tokyo"), 
        "istic": timezone("Africa/Tunis"),
        "museum": timezone("Asia/Tokyo") 
    }

    # Intervals (in seconds)
    token_refresh_interval: int = 270   # 4 minutes 30 seconds
    fetch_interval: int = 60            # 1 minute

    # Default SSE update frequency
    default_sse_frequency: int = 60

    # Security
    api_username: str = "hajlawimelik@gmail.com"
    api_password: str = "melik1234"

    class Config:
        env_file = ".env"
        env_file_encoding = 'utf-8'

settings = Settings()