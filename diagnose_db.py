
import requests
import json

# CONFIG (From pixelium code)
API_KEY = "AIzaSyCANk2vWDYkiZXnpwkufTgRrbSqGJhAHNI"
PROJECT_ID = "pixelium-7f62b"
AUTH_URL = f"https://identitytoolkit.googleapis.com/v1/accounts:signInWithPassword?key={API_KEY}"
FIRESTORE_ROOT = f"https://firestore.googleapis.com/v1/projects/{PROJECT_ID}/databases/(default)/documents"

def diagnose():
    print("--- DIAGNOSTICO DE BASE DE DATOS ---")
    
    # 1. LOGIN
    email = input("Email (Admin): ").strip() or "caproprimero@gmail.com"
    password = input("Password: ").strip()
    
    print("Conectando...")
    try:
        res = requests.post(AUTH_URL, json={"email": email, "password": password, "returnSecureToken": True})
        if res.status_code != 200:
            print("ERROR LOGIN:", res.text)
            return
        token = res.json()['idToken']
        print("Login OK.")
    except Exception as e:
        print("Error connecting:", e)
        return

    headers = {"Authorization": f"Bearer {token}"}

    # 2. LIST ROOT COLLECTIONS
    # Note: Firestore REST API doesn't have a direct "listCollections" endpoint for root easily without knowing names or using :listCollectionIds (which requires specific permissions/mode).
    # We will try the standard paths known.
    
    known_collections = ['orders', 'pedidos', 'products', 'custom_products', 'stock', 'users', 'config', 'backups']
    
    print("\n--- VERIFICANDO COLECCIONES ---")
    for col in known_collections:
        url = f"{FIRESTORE_ROOT}/{col}?pageSize=1" # Get just 1 to check existence/count
        r = requests.get(url, headers=headers)
        
        if r.status_code == 200:
            data = r.json()
            # If 'documents' key exists, it has data? Or it might just return structure.
            # Empty collection returns {} or no 'documents' array.
            docs = data.get('documents', [])
            if len(docs) > 0:
                print(f"[FOUND] Collection '{col}' EXISTS and has data. (First ID: {docs[0]['name'].split('/')[-1]})")
            else:
                # Just because it returns empty list doesn't mean collection doesn't exist, but it implies empty.
                print(f"[EMPTY] Collection '{col}' appears empty.")
        else:
             print(f"[ERROR] Checking '{col}': {r.status_code}")

    # 3. DEEP CHECK ORDERS
    print("\n--- DETALLE DE PEDIDOS (ORDERS) ---")
    url = f"{FIRESTORE_ROOT}/orders?pageSize=300"
    r = requests.get(url, headers=headers)
    if r.status_code == 200:
        orders = r.json().get('documents', [])
        print(f"Total Pedidos Encontrados: {len(orders)}")
        if len(orders) > 0:
            print("Ejemplos:")
            for o in orders[:5]:
                fields = o.get('fields', {})
                email_val = fields.get('userEmail', {}).get('stringValue', 'N/A')
                total_val = fields.get('total', {}).get('doubleValue', fields.get('total', {}).get('integerValue', '0'))
                print(f" - {email_val} (Total: {total_val})")
    else:
        print("Error leyendo orders:", r.text)

if __name__ == "__main__":
    diagnose()
