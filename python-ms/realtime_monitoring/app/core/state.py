from app.config import settings

class SessionState:
    """
    Stores per-session controls (frequency, pause, metric, buffer).
    Used by SSE to adapt to each client.
    """
    def __init__(self):
        # key: session_key -> control dict
        self.controls = {}

    def set_control(self, session_key: str, control):
        """Store user control settings for a session."""
        self.controls[session_key] = control.dict()

    def get_frequency(self, session_key: str) -> int:
        """Return update frequency, or default."""
        ctrl = self.controls.get(session_key, {})
        return ctrl.get('frequency') or settings.default_sse_frequency

    def is_paused(self, session_key: str) -> bool:
        """Return True if the user has paused the stream."""
        return self.controls.get(session_key, {}).get('pause', False)