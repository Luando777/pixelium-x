from PIL import Image
import os

# Source Image (Re-using the one uploaded earlier)
source_path = r"C:/Users/luisq/.gemini/antigravity/brain/fec41daa-3bfe-4b54-ada1-162f956ad11f/uploaded_image_1_1768699042494.png"
dest_path = r"c:/Users/luisq/Desktop/APP_1 Antigravity/pixelium-x/whatsapp-float.png"

img = Image.open(source_path).convert("RGBA")
datas = img.getdata()

newData = []
# Heuristic: Make white (or near white) pixels transparent
for item in datas:
    # Check if pixel is white'ish (R>240, G>240, B>240)
    if item[0] > 240 and item[1] > 240 and item[2] > 240:
        newData.append((255, 255, 255, 0)) # Transparent
    else:
        newData.append(item)

img.putdata(newData)
# Resize to match the logic
img = img.resize((128, 128), Image.Resampling.LANCZOS)
img.save(dest_path)
print(f"Saved Transparent Icon: {dest_path}")
