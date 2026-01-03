import http.server
import socketserver
import webbrowser
import os
import sys

PORT = 8000
Handler = http.server.SimpleHTTPRequestHandler

# Allow reusing the port immediately after stop
socketserver.TCPServer.allow_reuse_address = True

try:
    with socketserver.TCPServer(("", PORT), Handler) as httpd:
        print(f"✅ SERVIDOR INICIADO EN: http://localhost:{PORT}")
        print("🌍 Abriendo tu navegador automáticamente...")
        print("⚠️ NO CIERRES ESTA VENTANA NEGRA mientras uses la web.")
        
        # Open browser to the correct page
        url = f"http://localhost:{PORT}/index.html"
        webbrowser.open(url)
        
        httpd.serve_forever()
except OSError as e:
    if e.errno == 98 or e.errno == 10048: # Address already in use
        print(f"❌ El puerto {PORT} está ocupado. Intenta cerrar otras ventanas de Python/Node.")
    else:
        print(f"❌ Error: {e}")
except KeyboardInterrupt:
    print("\n🛑 Servidor detenido.")
    sys.exit(0)
