import uuid
import os
from pathlib import Path
from fastapi import UploadFile, HTTPException, status
from app.core.config import settings

ALLOWED_TYPES = {"image/jpeg", "image/png", "image/webp"}
MAX_SIZE_MB = 5
MAX_SIZE_BYTES = MAX_SIZE_MB * 1024 * 1024


def get_upload_dir() -> Path:
    path = Path(settings.UPLOAD_DIR) / "products"
    path.mkdir(parents=True, exist_ok=True)
    return path


async def save_upload_file(file: UploadFile) -> tuple[str, str, str]:
    """
    Validates and saves an uploaded image file.
    Returns (file_name, file_type, url)
    """
    # Validate file type
    if file.content_type not in ALLOWED_TYPES:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f"File type not allowed. Allowed types: jpeg, png, webp",
        )

    # Read and validate file size
    contents = await file.read()
    if len(contents) > MAX_SIZE_BYTES:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f"File too large. Maximum size is {MAX_SIZE_MB}MB",
        )

    # Generate unique filename
    ext = file.content_type.split("/")[-1]
    if ext == "jpeg":
        ext = "jpg"
    unique_name = f"{uuid.uuid4().hex}.{ext}"

    # Save to disk
    upload_dir = get_upload_dir()
    file_path = upload_dir / unique_name
    with open(file_path, "wb") as f:
        f.write(contents)

    url = f"{settings.BASE_URL}/uploads/products/{unique_name}"
    return unique_name, file.content_type, url


def delete_upload_file(file_name: str) -> None:
    """Deletes a file from the upload directory."""
    file_path = Path(settings.UPLOAD_DIR) / "products" / file_name
    if file_path.exists():
        os.remove(file_path)