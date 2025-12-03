from cloudinary.uploader import upload
from fastapi import UploadFile

# Ensure Cloudinary is configured from environment before any upload calls.
# This import executes cloudinary.config(...) defined in app.core.cloudinary
# as a side-effect so that api_key/secret are available to the SDK.
import app.core.cloudinary  # noqa: F401


class MediaService:
    @staticmethod
    async def upload_product_image(file: UploadFile, folder: str = "products") -> str:
        """
        Uploads image to Cloudinary and returns secure URL.
        """
        result = upload(
            file.file,
            folder=folder,
            resource_type="image",
            overwrite=True,
            unique_filename=True,
            use_filename=False,
        )
        return result["secure_url"]
