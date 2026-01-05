import requests
import json
import os
import mimetypes
import time
from urllib.parse import quote

# --- CONFIGURATION (From your index.html) ---
API_KEY = "AIzaSyCANk2vWDYkiZXnpwkufTgRrbSqGJhAHNI"
PROJECT_ID = "pixelium-7f62b"
STORAGE_BUCKET = "pixelium-7f62b.firebasestorage.app"

# --- ENDPOINTS ---
AUTH_URL = f"https://identitytoolkit.googleapis.com/v1/accounts:signInWithPassword?key={API_KEY}"
FIRESTORE_URL = f"https://firestore.googleapis.com/v1/projects/{PROJECT_ID}/databases/(default)/documents"
STORAGE_UPLOAD_URL = f"https://firebasestorage.googleapis.com/v0/b/{STORAGE_BUCKET}/o"

def login():
    print("\n🔐 INICIO DE SESIÓN (Requerido para subir archivos)")
    email = input("Tu correo de administrador: ").strip()
    password = input("Tu contraseña: ").strip()
    
    payload = {"email": email, "password": password, "returnSecureToken": True}
    res = requests.post(AUTH_URL, json=payload)
    
    if res.status_code == 200:
        print("✅ ¡Login exitoso!")
        return res.json()['idToken']
    else:
        print("❌ Error de login:", res.json().get('error', {}).get('message'))
        return None

def get_broken_products(token):
    print("\n🔍 Buscando productos rotos en Firestore...")
    # List all products
    res = requests.get(f"{FIRESTORE_URL}/products", params={'pageSize': 100})
    if res.status_code != 200:
        print("❌ Error leyendo base de datos.")
        return []

    products = []
    data = res.json().get('documents', [])
    
    for doc in data:
        fields = doc.get('fields', {})
        image_val = fields.get('image', {}).get('stringValue', '')
        title_val = fields.get('title', {}).get('stringValue', 'Sin titulo')
        doc_id = doc['name'].split('/')[-1]
        
        # Check if broken (ImgBB)
        if 'ibb.co' in image_val or 'imgbb.com' in image_val:
            products.append({'id': doc_id, 'title': title_val, 'image': image_val})
            
    return products

def upload_image(token, file_path):
    if not os.path.exists(file_path):
        print("❌ Archivo no encontrado.")
        return None
    
    file_name = os.path.basename(file_path)
    clean_name = f"repair_py_{int(time.time())}_{file_name}"
    allowed_chars = "abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789._-"
    clean_name = "".join(c for c in clean_name if c in allowed_chars)
    
    mime_type = mimetypes.guess_type(file_path)[0] or "application/octet-stream"
    
    # Check size
    size = os.path.getsize(file_path)
    print(f"   ⏳ Subiendo '{file_name}' ({size/1024:.1f} KB)...")
    
    with open(file_path, 'rb') as f:
        data = f.read()
        
    # Upload to Firebase Storage
    headers = {
        "Authorization": f"Bearer {token}",
        "Content-Type": mime_type
    }
    
    # URL Encode the object name
    upload_url = f"{STORAGE_UPLOAD_URL}?name=products%2F{clean_name}"
    
    res = requests.post(upload_url, headers=headers, data=data)
    
    if res.status_code == 200:
        print("   ✅ Subida completada.")
        # Get Download URL
        # The response is the object metadata. We can construct the download URL manually for public access
        # OR use the 'mediaLink' but that requires Auth token to view? 
        # Usually Firebase Storage public URLs are: 
        # https://firebasestorage.googleapis.com/v0/b/[BUCKET]/o/[NAME]?alt=media&token=[DOWNLOAD_TOKEN]
        
        meta = res.json()
        download_tokens = meta.get('downloadTokens', '')
        
        # Construct public URL
        public_url = f"https://firebasestorage.googleapis.com/v0/b/{STORAGE_BUCKET}/o/products%2F{clean_name}?alt=media&token={download_tokens}"
        return public_url
    else:
        print("❌ Error subiendo a Storage:", res.text)
        return None

def update_product(token, doc_id, new_url):
    print(f"   📝 Actualizando base de datos para ID: {doc_id}...")
    url = f"{FIRESTORE_URL}/products/{doc_id}?updateMask.fieldPaths=image"
    
    payload = {
        "fields": {
            "image": {"stringValue": new_url}
        }
    }
    
    res = requests.patch(url, headers={"Authorization": f"Bearer {token}"}, json=payload)
    if res.status_code == 200:
        print("   ✨ ¡Producto reparado con éxito!")
        return True
    else:
        print("❌ Error actualizando Firestore:", res.text)
        return False

def main():
    print("=========================================")
    print("      REPARADOR DE IMÁGENES PIXELIUM     ")
    print("       (Modo Python - Anti-Bloqueo)      ")
    print("=========================================")
    
    token = login()
    if not token: return
    
    while True:
        broken = get_broken_products(token)
        if not broken:
            print("\n🎉 ¡No se encontraron más productos rotos! Todo está perfecto.")
            break
            
        print(f"\n⚠️ Se encontraron {len(broken)} productos con imágenes rotas (ImgBB).")
        print("-" * 40)
        
        for i, prod in enumerate(broken):
            print(f"{i+1}. {prod['title']} (ID: {prod['id']})")
            
        print("-" * 40)
        print("Escribe el NÚMERO del producto a reparar (o '0' para salir).")
        choice = input("Opción: ").strip()
        
        if choice == '0': break
        
        try:
            idx = int(choice) - 1
            if 0 <= idx < len(broken):
                target = broken[idx]
                print(f"\n🔧 Reparando: {target['title']}")
                print("Arrastra la imagen aquí o escribe la ruta y pulsa Enter:")
                path = input("Ruta de imagen: ").strip().strip('"').strip("'")
                
                new_url = upload_image(token, path)
                if new_url:
                    update_product(token, target['id'], new_url)
                    
                input("\nPresiona Enter para continuar...")
            else:
                print("Opción inválida.")
        except ValueError:
            print("Por favor ingresa un número.")

if __name__ == "__main__":
    main()
