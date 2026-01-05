
# import firebase_admin
# from firebase_admin import credentials, storage

# Use a service account or try to list publically if possible.
# Since we don't have a service account JSON, we can't use admin SDK easily locally without auth.
# HOWEVER, we have 'repair_app.py' which uses requests and an API Key + Email/Pass.
# Let's adapt that to LIST storage.

import requests
import json

API_KEY = "AIzaSyCANk2vWDYkiZXnpwkufTgRrbSqGJhAHNI"
STORAGE_BUCKET = "pixelium-7f62b.firebasestorage.app"
AUTH_URL = f"https://identitytoolkit.googleapis.com/v1/accounts:signInWithPassword?key={API_KEY}"
STORAGE_LIST_URL = f"https://firebasestorage.googleapis.com/v0/b/{STORAGE_BUCKET}/o"

def login():
    # Helper to clean user input if they copy-paste blindly
    print("--- LOGIN REQUIRED TO LIST STORAGE ---")
    email = input("Email (caproprimero@gmail.com): ").strip()
    if not email: email = "caproprimero@gmail.com"
    password = input("Password: ").strip()
    
    payload = {"email": email, "password": password, "returnSecureToken": True}
    res = requests.post(AUTH_URL, json=payload)
    if res.status_code == 200:
        return res.json()['idToken']
    print("Login Failed:", res.text)
    return None

def list_files(token):
    print("\n--- LISTING STORAGE FILES ---")
    headers = {"Authorization": f"Bearer {token}"}
    next_page_token = None
    
    all_items = []
    
    while True:
        url = STORAGE_LIST_URL
        if next_page_token:
            url += f"?pageToken={next_page_token}"
            
        res = requests.get(url, headers=headers)
        if res.status_code != 200:
            print("Error listing:", res.text)
            break
            
        data = res.json()
        items = data.get('items', [])
        all_items.extend(items)
        
        print(f"Found {len(items)} files...")
        
        next_page_token = data.get('nextPageToken')
        if not next_page_token:
            break
            
    # Filter for interesting ones
    print("\n--- POSIBLE PRODUCT IMAGES (Non-Standard) ---")
    
    # We look for files that are NOT the standard 'logo.png', 'hero.png', etc.
    # We look for timestamped uploads or specific names.
    interesting = []
    for item in all_items:
        name = item['name']
        if 'products/' in name or 'Disney' in name or 'Amazon' in name or 'Paramount' in name:
             interesting.append(item)
             
    for item in interesting:
        print(f"FILE: {item['name']}  (Created: {item['timeCreated']})")
        # Construct public URL
        # URL format: https://firebasestorage.googleapis.com/v0/b/<bucket>/o/<name>?alt=media&token=<token>
        # Note: 'name' must be URL encoded.
        
        import urllib.parse
        encoded_name = urllib.parse.quote(item['name'], safe='')
        tokens = item.get('downloadTokens', '')
        link = f"https://firebasestorage.googleapis.com/v0/b/{STORAGE_BUCKET}/o/{encoded_name}?alt=media&token={tokens.split(',')[0]}"
        print(f"LINK: {link}")
        print("-" * 20)

if __name__ == "__main__":
    token = login()
    if token:
        list_files(token)
