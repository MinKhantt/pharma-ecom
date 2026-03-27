import uuid
import os
from pathlib import Path
from fastapi import UploadFile, HTTPException, status
from app.core.config import settings

# ── Allowed types per upload category ─────────────────────────────────────────
PRODUCT_IMAGE_TYPES = {"image/jpeg", "image/png", "image/webp"}
PRESCRIPTION_TYPES  = {"image/jpeg", "image/png", "image/webp", "application/pdf"}

MAX_SIZE_MB    = 5
MAX_SIZE_BYTES = MAX_SIZE_MB * 1024 * 1024


# ── Directory helpers ──────────────────────────────────────────────────────────

def get_products_dir() -> Path:
    path = Path(settings.UPLOAD_DIR) / "products"
    path.mkdir(parents=True, exist_ok=True)
    return path


def get_prescriptions_dir() -> Path:
    path = Path(settings.UPLOAD_DIR) / "prescriptions"
    path.mkdir(parents=True, exist_ok=True)
    return path


# ── Core save logic ────────────────────────────────────────────────────────────

async def _save_file(
    file: UploadFile,
    allowed_types: set[str],
    upload_dir: Path,
    url_path: str,
) -> tuple[str, str, str]:
    """
    Validates content type and size, saves the file, returns (file_name, file_type, url).
    """
    if file.content_type not in allowed_types:
        friendly = ", ".join(t.split("/")[-1] for t in sorted(allowed_types))
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f"File type not allowed. Allowed: {friendly}",
        )

    contents = await file.read()
    if len(contents) > MAX_SIZE_BYTES:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f"File too large. Maximum size is {MAX_SIZE_MB}MB",
        )

    # Build extension
    ext = file.content_type.split("/")[-1]
    if ext == "jpeg":
        ext = "jpg"

    unique_name = f"{uuid.uuid4().hex}.{ext}"
    file_path   = upload_dir / unique_name

    with open(file_path, "wb") as f:
        f.write(contents)

    url = f"{settings.BASE_URL}/uploads/{url_path}/{unique_name}"
    return unique_name, file.content_type, url


# ── Public helpers ─────────────────────────────────────────────────────────────

async def save_product_image(file: UploadFile) -> tuple[str, str, str]:
    """Save a product image. Allowed: jpeg, png, webp."""
    return await _save_file(
        file,
        allowed_types=PRODUCT_IMAGE_TYPES,
        upload_dir=get_products_dir(),
        url_path="products",
    )


async def save_prescription(file: UploadFile) -> tuple[str, str, str]:
    """Save a prescription file. Allowed: jpeg, png, webp, pdf."""
    return await _save_file(
        file,
        allowed_types=PRESCRIPTION_TYPES,
        upload_dir=get_prescriptions_dir(),
        url_path="prescriptions",
    )


# ── Keep backwards-compatible alias ───────────────────────────────────────────
# Existing code that calls save_upload_file() still works without changes.
async def save_upload_file(file: UploadFile) -> tuple[str, str, str]:
    return await save_product_image(file)


# ── Delete helpers ─────────────────────────────────────────────────────────────

def delete_product_image(file_name: str) -> None:
    file_path = Path(settings.UPLOAD_DIR) / "products" / file_name
    if file_path.exists():
        os.remove(file_path)


def delete_prescription(file_name: str) -> None:
    file_path = Path(settings.UPLOAD_DIR) / "prescriptions" / file_name
    if file_path.exists():
        os.remove(file_path)


# Backwards-compatible alias
def delete_upload_file(file_name: str) -> None:
    delete_product_image(file_name)