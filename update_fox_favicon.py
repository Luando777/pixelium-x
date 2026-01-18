from PIL import Image
import os

# Source Image (The Fox)
source_path = r"C:/Users/luisq/.gemini/antigravity/brain/fec41daa-3bfe-4b54-ada1-162f956ad11f/new_fox_favicon_1768695083912.png"
dest_dir = r"c:/Users/luisq/Desktop/APP_1 Antigravity/pixelium-x"

img = Image.open(source_path)

# Resize and Save
sizes = {
    "icon-48.png": (48, 48),
    "icon-96.png": (96, 96),
    "icon-192.png": (192, 192),
    "favicon.png": (192, 192), # Main high-res
    "social_preview.jpg": (600, 600) # Update social preview too for consistency
}

for filename, size in sizes.items():
    resized = img.resize(size, Image.Resampling.LANCZOS)
    # Convert to RGB if saving as JPG
    if filename.endswith(".jpg"):
        rgb_img = resized.convert('RGB')
        rgb_img.save(os.path.join(dest_dir, filename), quality=90)
    else:
        resized.save(os.path.join(dest_dir, filename))
    print(f"Update: {filename}")

# Create favicon.ico (multi-size)
img.save(os.path.join(dest_dir, "favicon.ico"), format='ICO', sizes=[(32,32), (48,48), (16,16)])
print("Update: favicon.ico")
