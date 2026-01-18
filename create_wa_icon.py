from PIL import Image
import os

# Source Image (The User's WhatsApp Icon)
source_path = r"C:/Users/luisq/.gemini/antigravity/brain/fec41daa-3bfe-4b54-ada1-162f956ad11f/uploaded_image_1_1768699042494.png"
dest_path = r"c:/Users/luisq/Desktop/APP_1 Antigravity/pixelium-x/whatsapp-float.png"

img = Image.open(source_path)
# Resize to a reasonable bubble size (e.g. 128x128 for high DPI)
img = img.resize((128, 128), Image.Resampling.LANCZOS)
img.save(dest_path)
print(f"Saved: {dest_path}")
