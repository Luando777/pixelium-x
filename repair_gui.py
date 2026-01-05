import tkinter as tk
from tkinter import filedialog, messagebox, ttk
import requests
import json
import os
import mimetypes
import threading

# --- CONFIG ---
API_KEY = "AIzaSyCANk2vWDYkiZXnpwkufTgRrbSqGJhAHNI"
PROJECT_ID = "pixelium-7f62b"
STORAGE_BUCKET = "pixelium-7f62b.firebasestorage.app"

AUTH_URL = f"https://identitytoolkit.googleapis.com/v1/accounts:signInWithPassword?key={API_KEY}"
FIRESTORE_URL = f"https://firestore.googleapis.com/v1/projects/{PROJECT_ID}/databases/(default)/documents"
STORAGE_UPLOAD_URL = f"https://firebasestorage.googleapis.com/v0/b/{STORAGE_BUCKET}/o"

class RepairApp:
    def __init__(self, root):
        self.root = root
        self.root.title("Pixelium Repair Tool v1.0")
        self.root.geometry("400x550")
        self.root.configure(bg="#222")
        
        self.token = None
        self.broken_products = []
        
        # Styles
        style = ttk.Style()
        style.theme_use('clam')
        style.configure("TLabel", background="#222", foreground="white", font=("Arial", 10))
        style.configure("TButton", background="#00f3ff", foreground="black", font=("Arial", 10, "bold"))
        
        # --- LOGIN SECTION ---
        tk.Label(root, text="1. INICIO DE SESIÓN", bg="#222", fg="#00f3ff", font=("Arial", 12, "bold")).pack(pady=10)
        
        tk.Label(root, text="Correo:", bg="#222", fg="white").pack()
        self.email_entry = tk.Entry(root, width=40)
        self.email_entry.pack(pady=2)
        
        tk.Label(root, text="Contraseña:", bg="#222", fg="white").pack()
        self.pass_entry = tk.Entry(root, width=40, show="*")
        self.pass_entry.pack(pady=2)
        
        self.login_btn = tk.Button(root, text="Conectar", command=self.do_login, bg="#4CAF50", fg="white")
        self.login_btn.pack(pady=10)
        
        # --- SELECTION SECTION ---
        tk.Label(root, text="2. SELECCIONAR PRODUCTO ROTO", bg="#222", fg="#00f3ff", font=("Arial", 12, "bold")).pack(pady=(20, 5))
        
        self.combo = ttk.Combobox(root, width=37)
        self.combo.pack(pady=5)
        self.combo['state'] = 'disabled'
        
        # --- FILE SECTION ---
        tk.Label(root, text="3. IMAGEN NUEVA", bg="#222", fg="#00f3ff", font=("Arial", 12, "bold")).pack(pady=(20, 5))
        
        self.file_path = tk.StringVar()
        # Pre-set if exists on desktop
        local_img = "IMAGEN_PARA_REPARAR.png"
        if os.path.exists(local_img):
            self.file_path.set(os.path.abspath(local_img))
            
        self.file_entry = tk.Entry(root, textvariable=self.file_path, width=30)
        self.file_entry.pack(pady=5)
        
        tk.Button(root, text="Buscar...", command=self.browse_file).pack()
        
        # --- CONFIG (Manual Override) ---
        tk.Label(root, text="Bucket Name (Opcional - Déjalo vacío si no sabes):", bg="#222", fg="#888", font=("Arial", 8)).pack(pady=(10, 0))
        self.bucket_entry = tk.Entry(root, width=30)
        self.bucket_entry.pack(pady=2)

        # --- ACTION ---
        self.status_label = tk.Label(root, text="Esperando login...", bg="#222", fg="#888")
        self.status_label.pack(pady=10)
        
        self.repair_btn = tk.Button(root, text="🔥 REPARAR AHORA 🔥", command=self.start_repair, bg="#ff4444", fg="white", font=("Arial", 12, "bold"), state="disabled")
        self.repair_btn.pack(pady=10, fill="x", padx=20)

    # ... (Login / Fetch skipped) ...

    def do_login(self):
        # ... (Same as before) ...
        email = self.email_entry.get().strip()
        password = self.pass_entry.get().strip()
        
        if not email or not password:
            messagebox.showerror("Error", "Ingresa correo y contraseña")
            return
            
        self.status_label.config(text="Conectando...", fg="yellow")
        
        def run():
            try:
                payload = {"email": email, "password": password, "returnSecureToken": True}
                res = requests.post(AUTH_URL, json=payload)
                
                if res.status_code == 200:
                    self.token = res.json()['idToken']
                    self.status_label.config(text="¡Conectado! Escaneando nube...", fg="#00ff00")
                    messagebox.showinfo("Éxito", "Login correcto. Iniciando escaneo de imágenes perdidas...")
                    
                    # TRIGGER AUTO-SCAN
                    threading.Thread(target=self.scan_storage_for_recovery).start()
                    
                    self.fetch_broken_products()
                else:
                    msg = res.json().get('error', {}).get('message', 'Error desconocido')
                    self.root.after(0, lambda: messagebox.showerror("Login Falló", msg))
                    self.root.after(0, lambda: self.status_label.config(text="Login fallido", fg="red"))
            except Exception as e:
                self.root.after(0, lambda: messagebox.showerror("Error", str(e)))

        threading.Thread(target=run).start()

    def on_login_success(self):
        self.status_label.config(text="✅ Conectado. Buscando rotos...", fg="#00f3ff")
        self.login_btn.config(state="disabled")
        self.fetch_broken()

    def fetch_broken(self):
        def run():
            try:
                res = requests.get(f"{FIRESTORE_URL}/products", params={'pageSize': 100})
                data = res.json().get('documents', [])
                
                options = []
                self.broken_products = []
                
                for doc in data:
                    fields = doc.get('fields', {})
                    image = fields.get('image', {}).get('stringValue', '')
                    title = fields.get('title', {}).get('stringValue', 'Sin titulo')
                    doc_id = doc['name'].split('/')[-1]
                    
                    if 'ibb.co' in image or 'imgbb.com' in image:
                        self.broken_products.append({'id': doc_id, 'title': title})
                        options.append(f"{title}")
                
                self.root.after(0, lambda: self.update_combo(options))
            except Exception as e:
                print(e)
                self.root.after(0, lambda: self.status_label.config(text="Error leyendo base de datos", fg="red"))

        threading.Thread(target=run).start()

    def update_combo(self, options):
        if not options:
            self.combo['values'] = ["¡No hay productos rotos!"]
            self.combo.current(0)
            self.status_label.config(text="🎉 Todo limpio.", fg="#00ff00")
        else:
            self.combo['values'] = options
            self.combo.current(0)
            self.combo['state'] = 'readonly'
            self.repair_btn.config(state="normal")
            self.status_label.config(text=f"⚠️ {len(options)} productos rotos encontrados.", fg="orange")

    def browse_file(self):
        f = filedialog.askopenfilename(filetypes=[("Imágenes", "*.png;*.jpg;*.jpeg")])
        if f: self.file_path.set(f)

    def start_repair(self):
        idx = self.combo.current()
        if idx < 0: return
        
        target = self.broken_products[idx]
        local_path = self.file_path.get()
        
        if not os.path.exists(local_path):
            messagebox.showerror("Error", "Archivo de imagen no existe.")
            return

        self.repair_btn.config(state="disabled", text="⏳ Guardando en Base de Datos...")
        
        def run():
            try:
                # 1. Prepare Data (Resize & Base64)
                # Strategy: Embed image directly in Firestore to bypass Storage Billing
                from PIL import Image
                import io
                import base64

                max_size = (600, 600) # Limit resolution to keep string size low
                
                with Image.open(local_path) as img:
                    # Convert to RGB to handle PNGs with transparency if needed (though JPEG is smaller)
                    if img.mode in ("RGBA", "P"):
                        img = img.convert("RGB")
                    
                    img.thumbnail(max_size)
                    
                    # Save to BytesIO
                    buffer = io.BytesIO()
                    img.save(buffer, format="JPEG", quality=70) # Compress to ~50-100kb
                    img_bytes = buffer.getvalue()
                    
                    # Check size (Max Firestore doc is 1MB, let's stay under 400KB to be safe)
                    if len(img_bytes) > 800000:
                         raise Exception("La imagen es muy compleja incluso reducida. Intenta con otra.")

                    base64_str = base64.b64encode(img_bytes).decode('utf-8')
                    data_url = f"data:image/jpeg;base64,{base64_str}"
                    
                print(f"Imagen procesada: {len(img_bytes)/1024:.1f} KB")

                # 2. Update Firestore DIRECTLY (No Storage needed)
                patch_url = f"{FIRESTORE_URL}/products/{target['id']}?updateMask.fieldPaths=image"
                payload = {"fields": {"image": {"stringValue": data_url}}}
                
                res2 = requests.patch(patch_url, headers={"Authorization": f"Bearer {self.token}"}, json=payload)
                
                if res2.status_code != 200:
                    raise Exception(f"Error Firestore: {res2.text}")
                
                self.root.after(0, lambda: self.on_repair_success(target['title']))
                
            except Exception as e:
                print(e)
                # Show full error in msg box
                self.root.after(0, lambda: messagebox.showerror("Error", str(e)))
                self.root.after(0, lambda: self.repair_btn.config(state="normal", text="🔥 REPARAR AHORA 🔥"))

        threading.Thread(target=run).start()
        
    def on_repair_success(self, title):
        messagebox.showinfo("Éxito", f"¡{title} reparado correctamente!")
        self.repair_btn.config(state="normal", text="🔥 REPARAR AHORA 🔥")
        self.fetch_broken_products() # Refresh list

    def scan_storage_for_recovery(self):
        try:
            print("Scanning storage...")
            url = f"https://firebasestorage.googleapis.com/v0/b/{STORAGE_BUCKET}/o"
            headers = {"Authorization": f"Bearer {self.token}"}
            
            all_files = []
            next_page = None
            
            while True:
                req_url = url + ("?pageToken=" + next_page if next_page else "")
                r = requests.get(req_url, headers=headers)
                if r.status_code != 200: 
                    print("Error scanning:", r.text)
                    break
                
                data = r.json()
                items = data.get('items', [])
                all_files.extend(items)
                
                next_page = data.get('nextPageToken')
                if not next_page: break
            
            # Filter and Save
            found = []
            for item in all_files:
                name = item['name']
                # NO FILTER - DUMP EVERYTHING TO DEBUG
                # Construct Link
                import urllib.parse
                encoded = urllib.parse.quote(name, safe='')
                token = item.get('downloadTokens', '').split(',')[0]
                link = f"https://firebasestorage.googleapis.com/v0/b/{STORAGE_BUCKET}/o/{encoded}?alt=media&token={token}"
                found.append(f"{name}|{link}")
            
            with open("found_images.txt", "w", encoding="utf-8") as f:
                f.write("\n".join(found))
                
            print(f"Saved {len(found)} images to found_images.txt")
            self.root.after(0, lambda: messagebox.showinfo("Escaneo Completo", f"Se encontraron {len(found)} archivos (TOTAL) en la nube. \nRevisa found_images.txt"))
            
        except Exception as e:
            print("Error scanning:", e)


if __name__ == "__main__":
    root = tk.Tk()
    app = RepairApp(root)
    root.mainloop()
