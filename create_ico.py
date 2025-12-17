from PIL import Image
import os

source_path = "logo.png"
if not os.path.exists(source_path):
    print(f"Error: {source_path} not found.")
    exit(1)

try:
    img = Image.open(source_path)
    
    # Generate favicon.ico (multi-size container)
    # Google searches for this specifically at the root
    img.save("favicon.ico", format='ICO', sizes=[(32, 32), (16, 16), (48, 48), (64, 64)])
    print("Generated favicon.ico (Multiple sizes)")

except Exception as e:
    print(f"Error processing image: {e}")
