from fastapi import APIRouter, Depends, UploadFile, File
from app.core.deps import require_staff
from app.services.media_service import MediaService
from app.models.user import User

router = APIRouter()


@router.post("/upload", summary="Upload product image")
async def upload_image(
        image: UploadFile = File(...),
        current_user: User = Depends(require_staff)
):
    url = await MediaService.upload_product_image(image)
    return {"url": url}
