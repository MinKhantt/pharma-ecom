from pydantic import BaseModel
from uuid import UUID
from typing import Optional


class ProductImageResponse(BaseModel):
    id: UUID
    file_name: str
    file_type: Optional[str]
    url: str
    is_primary: bool

    model_config = {"from_attributes": True}
