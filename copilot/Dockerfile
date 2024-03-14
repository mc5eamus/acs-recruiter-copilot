# Use an official Python runtime as a parent image
FROM python:3.11-slim-buster as stage

# Set the working directory in the container to /app
WORKDIR /app

ADD ./requirements.txt /app

# Install any needed packages specified in requirements.txt
RUN pip install --no-cache-dir -r requirements.txt

FROM stage as app

WORKDIR /app

ADD ./*.py /app

EXPOSE 5000

# Run the command to start uWSGI
CMD ["python", "copilot.py"]