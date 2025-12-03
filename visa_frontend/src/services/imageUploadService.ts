import axios from "axios";

const API_BASE_URL = import.meta.env.VITE_API_URL;
const ADMIN_MEDIA_UPLOAD_URL = `${API_BASE_URL}/admin/media/upload`;

// ----------------------------------------------
// Helpers
// ----------------------------------------------
const getAuthHeaders = (token: string) => ({
    headers: { Authorization: `Bearer ${token}` },
});

/**
 * Upload a single product image to Cloudinary via backend
 * Returns: { url: string }
 */
export async function uploadProductImage(token: string, file: File): Promise<string> {
    const formData = new FormData();
    formData.append("image", file);

    const response = await axios.post(
        `${ADMIN_MEDIA_UPLOAD_URL}`,
        formData,
        {
            headers: {
                ...(getAuthHeaders(token).headers),
                "Content-Type": "multipart/form-data",
            },
        }
    );

    return response.data.url; // Cloudinary URL
}

/**
 * Upload multiple files at once
 * Returns an array of URLs
 */
export async function uploadMultipleProductImages(token: string, files: File[]): Promise<string[]> {
    const uploads = files.map((file) => uploadProductImage(token, file));
    return Promise.all(uploads);
}
