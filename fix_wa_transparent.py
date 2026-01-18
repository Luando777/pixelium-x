from PIL import Image, ImageOps, ImageDraw

# Source Image
source_path = r"C:/Users/luisq/.gemini/antigravity/brain/fec41daa-3bfe-4b54-ada1-162f956ad11f/uploaded_image_1_1768699042494.png"
dest_path = r"c:/Users/luisq/Desktop/APP_1 Antigravity/pixelium-x/whatsapp-float.png"

img = Image.open(source_path).convert("RGBA")

# Resize to high res square
size = (128, 128)
img = img.resize(size, Image.Resampling.LANCZOS)

# Create Circular Mask
mask = Image.new('L', size, 0)
draw = ImageDraw.Draw(mask)
draw.ellipse((0, 0) + size, fill=255)

# Apply Mask to Alpha Channel
output = ImageOps.fit(img, mask.size, centering=(0.5, 0.5))
output.putalpha(mask)

output.save(dest_path)
print(f"Saved Circular Icon: {dest_path}")
