FROM python:3.10-slim

RUN apt-get update -qq && \
    apt-get install -y -qq tesseract-ocr \
    build-essential \
    default-libmysqlclient-dev \
    pkg-config

WORKDIR /backend

COPY . .

RUN pip install --no-cache-dir -r requirements.txt

ENV PYTHONUNBUFFERED=1
ENV DJANGO_SETTINGS_MODULE=JobEdgeApi.settings


CMD ["gunicorn", "JobEdgeApi.wsgi:application", "--bind", "0.0.0.0:$PORT"]
