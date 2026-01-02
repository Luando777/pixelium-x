from PIL import Image
import os

source_path = "logo.png"
if not os.path.exists(source_path):
    print(f"Error: {source_path} not found.")
    exit(1)

try:
    img = Image.open(source_path)
    # Generate standard favicon (32x32)
    img.resize((32, 32), Image.Resampling.LANCZOS).save("favicon.png")
    print("Generated favicon.png (32x32)")

    # Generate Google specific sizes (48x48, 96x96)
    img.resize((48, 48), Image.Resampling.LANCZOS).save("icon-48.png")
    print("Generated icon-48.png (48x48)")
    
    img.resize((96, 96), Image.Resampling.LANCZOS).save("icon-96.png")
    print("Generated icon-96.png (96x96)")
    
    # Generate standard icon (192x192) for Android/High Res
    img.resize((192, 192), Image.Resampling.LANCZOS).save("icon-192.png")
    print("Generated icon-192.png (192x192)")

    # Generate Apple Touch Icon (180x180)
    img.resize((180, 180), Image.Resampling.LANCZOS).save("apple-touch-icon.png")
    print("Generated apple-touch-icon.png (180x180)")
    
except Exception as e:
    print(f"Error processing image: {e}")
