# main.py
from historical_processing import app
from export_endpoint import router as export_router  # Import router from separate file

# Include the export endpoint routes
app.include_router(export_router)

# Optional: Keep original startup logic if needed
if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=5000)