from pathlib import Path
import logging
import os
from typing import Optional

import boto3

logger = logging.getLogger(__name__)

BASE_DIR = Path(__file__).resolve().parent
MODEL_DIR = BASE_DIR
S3_BUCKET = os.environ.get("S3_MODEL_BUCKET")
S3_PREFIX = os.environ.get("S3_MODEL_PREFIX", "ml_models/")


def download_if_missing(filename: str, *, bucket: Optional[str] = None, prefix: Optional[str] = None) -> Path:
    """Ensure a model file exists locally, downloading it from S3 if needed."""
    target_path = MODEL_DIR / filename

    if target_path.exists():
        return target_path

    bucket_name = bucket or S3_BUCKET
    s3_prefix = prefix or S3_PREFIX

    if not bucket_name:
        raise RuntimeError("S3_MODEL_BUCKET is not configured")

    try:
        client = boto3.client("s3", region_name=os.environ.get("AWS_REGION", "us-east-1"))
        object_key = f"{s3_prefix.rstrip('/')}/{filename}".replace("//", "/")
        logger.info("Downloading model %s from s3://%s/%s", filename, bucket_name, object_key)
        client.download_file(bucket_name, object_key, str(target_path))
        if target_path.exists():
            return target_path
        raise FileNotFoundError(f"Downloaded file was not created: {target_path}")
    except Exception as exc:
        logger.exception("Failed to download model %s from S3", filename)
        raise RuntimeError(f"Unable to download model file '{filename}' from S3") from exc
