# Use the official Python image from Docker Hub
FROM python:3.9-slim

# Set the working directory inside the container
WORKDIR /app

# Copy the requirements file to the container
COPY ./requirements.txt /app/requirements.txt

# Install the Python dependencies
RUN pip install --no-cache-dir -r requirements.txt

# Copy the rest of your application code into the container
COPY *.py /app

# Expose the port your FastAPI app will run on
EXPOSE 5000

# Set the environment variable to allow uvicorn to be executed
ENV PYTHONPATH=/app

# Run the FastAPI app with Uvicorn on port 5000, listening on all interfaces
CMD ["uvicorn", "main:app", "--host", "0.0.0.0", "--port", "5000", "--reload"]
