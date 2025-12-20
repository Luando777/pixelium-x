from PIL import Image
import os

source_path = "logo.png"
if not os.path.exists(source_path):
    print(f"Error: {source_path} not found.")
    exit(1)

try:
    img = Image.open(source_path)
    
    # Resize to 500x500 (Good for WhatsApp/Telegram previews, usually requiring >300x300)
    # Maintain aspect ratio if possible, but for icon usage, forcing square is often standard 
    # if the source is square-ish. If not, we fit it.
    
    # Assuming logo.png is square or close to it. If not, this might stretch.
    # A safer bet for a logo is to thumbnail it.
    img.thumbnail((600, 600), Image.Resampling.LANCZOS)
    
    # Save as PNG but optimize
    # If it's still large, we might need JPEG. Let's try PNG first.
    output_path = "social_preview.png"
    img.save(output_path, optimize=True)
    
    size = os.path.getsize(output_path)
    print(f"Generated {output_path}: {size} bytes")
    
    if size > 300000:
        print("Warning: File > 300KB. Attempting JPEG conversion...")
        output_path_jpg = "social_preview.jpg"
        # Convert to RGB for JPEG
        bg = Image.new("RGB", img.size, (255, 255, 255))
        if img.mode == 'RGBA':
            bg.paste(img, mask=img.split()[3]) # 3 is the alpha channel
        else:
            bg.paste(img)
            
        bg.save(output_path_jpg, quality=85)
        print(f"Generated {output_path_jpg}: {os.path.getsize(output_path_jpg)} bytes")

except Exception as e:
    print(f"Error processing image: {e}")
