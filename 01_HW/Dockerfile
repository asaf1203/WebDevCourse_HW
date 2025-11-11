# Use Python 3 image
FROM python:3.11-slim

# Set working directory
WORKDIR /app

# Copy requirement files if you have any (optional)
# COPY requirements.txt .

# Install dependencies (optional)
# RUN pip install -r requirements.txt

# Expose port 8000
EXPOSE 8000

# Command to serve files in /app directory
CMD ["python", "-m", "http.server", "8000", "--bind", "0.0.0.0"]