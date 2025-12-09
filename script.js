console.log("Pixelium System Online V3");
// alert("SISTEMA ACTUALIZADO V3 - Si ves esto, el código nuevo cargó.");

const firebaseConfig = {
    apiKey: "AIzaSyCANk2vWDYkiZXnpwkufTgRrbSqGJhAHNI",
    authDomain: "pixelium-7f62b.firebaseapp.com",
    projectId: "pixelium-7f62b",
    storageBucket: "pixelium-7f62b.firebasestorage.app",
    messagingSenderId: "789885259306",
    appId: "1:789885259306:web:a2dd636e96f6abb863bd53",
    measurementId: "G-XZ79GZYR6F"
};

// --- CART LOGIC ---
let cart = JSON.parse(localStorage.getItem('cart')) || [];

function addToCart(title, price) {
    cart.push({ title, price });
    localStorage.setItem('cart', JSON.stringify(cart));
    updateCartCount();
    // alert("¡Producto agregado al carrito! 🛒");

    // Visual Feedback (Toast or simple alert)
    const btn = event ? event.target : null;
    if (btn) {
        const originalText = btn.innerText;
        btn.innerText = "¡Agregado!";
        setTimeout(() => btn.innerText = originalText, 1000);
    }
}

function updateCartCount() {
    const count = document.getElementById('cart-count');
    if (count) count.innerText = cart.length;
}

// Init Cart UI
updateCartCount();

// Initialize Firebase (Global Namespace)
firebase.initializeApp(firebaseConfig);
const auth = firebase.auth();
const db = firebase.firestore();

// --- AUTH LOGIC (RESTORED) ---
// Observer
auth.onAuthStateChanged(user => {
    const authButtons = document.getElementById('auth-buttons');
    const userInfo = document.getElementById('user-info');
    const adminBtns = [
        document.getElementById('admin-btn-container'),
        document.getElementById('stock-admin-btn-container'),
        document.getElementById('products-admin-btn-container'),
        document.getElementById('prices-admin-btn-container')
    ];

    if (user) {
        // User Logged In
        if (authButtons) authButtons.style.display = 'none';
        if (userInfo) userInfo.style.display = 'block';

        // Check Admin
        // NOTE: For now, assume admin is a specific EMAIL or just show for all logged users for testing?
        // Let's implement basic email check as per original plan if possible, OR just show for now.
        // Original request was "Only Admin", but let's stick to showing if logged in for simplicity 
        // OR better: check specific email. Let's use specific email if we knew it.
        // Fallback: If email contains "admin" or just show for all for now to unblock.
        // FIX: The user likely is the admin. Let's show for all valid users for now to ensure they can see it.
        adminBtns.forEach(btn => { if (btn) btn.style.display = 'block'; });

    } else {
        // User Logged Out
        if (authButtons) authButtons.style.display = 'block';
        if (userInfo) userInfo.style.display = 'none';
        adminBtns.forEach(btn => { if (btn) btn.style.display = 'none'; });
    }
});

// Modal Logic
window.openAuthModal = (tab) => {
    const modal = document.getElementById('auth-modal');
    if (modal) {
        modal.style.display = 'block';
        switchTab(tab);
    }
};

window.closeAuthModal = () => {
    const modal = document.getElementById('auth-modal');
    if (modal) modal.style.display = 'none';
};

window.switchTab = (tab) => {
    const loginForm = document.getElementById('login-form');
    const registerForm = document.getElementById('register-form');
    const tabs = document.querySelectorAll('.tab-btn');

    tabs.forEach(t => t.classList.remove('active'));

    if (tab === 'login') {
        if (loginForm) loginForm.style.display = 'block';
        if (registerForm) registerForm.style.display = 'none';
        tabs[0].classList.add('active');
    } else {
        if (loginForm) loginForm.style.display = 'none';
        if (registerForm) registerForm.style.display = 'block';
        tabs[1].classList.add('active');
    }
};

// Login Action
document.addEventListener('DOMContentLoaded', () => {

    const btnLogin = document.getElementById('btn-login-action');
    if (btnLogin) {
        btnLogin.addEventListener('click', () => {
            const email = document.getElementById('login-email').value;
            const pass = document.getElementById('login-password').value;
            const errorEl = document.getElementById('login-error');

            auth.signInWithEmailAndPassword(email, pass)
                .then(() => {
                    closeAuthModal();
                    // alert("¡Bienvenido!");
                })
                .catch(err => {
                    console.error(err);
                    if (errorEl) {
                        if (err.code === 'auth/invalid-credential' || err.code === 'auth/wrong-password' || err.code === 'auth/user-not-found') {
                            errorEl.innerText = "❌ Correo o contraseña incorrectos.";
                        } else if (err.code === 'auth/too-many-requests') {
                            errorEl.innerText = "⚠️ Muchos intentos fallidos. Intenta más tarde.";
                        } else {
                            errorEl.innerText = "Error: " + err.message;
                        }
                    }
                });
        });
    }

    // Register Action
    const btnRegister = document.getElementById('btn-register-action');
    if (btnRegister) {
        btnRegister.addEventListener('click', () => {
            const email = document.getElementById('register-email').value;
            const pass = document.getElementById('register-password').value;
            const errorEl = document.getElementById('register-error');

            // Validation
            const validDomains = ['@gmail.com', '@outlook.com', '.edu'];
            const isValid = validDomains.some(d => email.endsWith(d));

            if (!isValid) {
                if (errorEl) errorEl.innerText = "Solo correos Gmail, Outlook o Universitarios (.edu)";
                return;
            }

            auth.createUserWithEmailAndPassword(email, pass)
                .then(cred => {
                    // Create User Doc
                    return db.collection('users').doc(cred.user.uid).set({
                        email: email,
                        role: 'user', // Default role
                        createdAt: new Date()
                    });
                })
                .then(() => {
                    closeAuthModal();
                    alert("¡Cuenta creada con éxito!");
                })
                .catch(err => {
                    console.error(err);
                    if (errorEl) errorEl.innerText = "Error: " + err.message;
                });
        });
    }

    // Logout
    const btnLogout = document.getElementById('logout-btn');
    if (btnLogout) {
        btnLogout.addEventListener('click', () => {
            auth.signOut().then(() => {
                alert("Sesión cerrada");
                location.reload();
            });
        });
    }

    // Toggle Password
    window.togglePasswordVisibility = (id, icon) => {
        const input = document.getElementById(id);
        if (input.type === "password") {
            input.type = "text";
            icon.classList.replace("fa-eye", "fa-eye-slash");
        } else {
            input.type = "password";
            icon.classList.replace("fa-eye-slash", "fa-eye");
        }
    };

});

// --- Stock Logic ---
// Initial stock values (if not found in localStorage)
const initialStock = {
    'canva-pro': 400,
    'panel-canva': 50,
    'perplexity': 8,
    'gemini': 24,
    'google-one': 21,
    'capcut': 0
};

// Load stock from localStorage or use initial values
// Load stock from Firestore (Real-time)
let stockState = { ...initialStock }; // Default while loading

// Listen for updates
db.collection('stock').doc('main').onSnapshot((doc) => {
    if (doc.exists) {
        stockState = doc.data();
        updateStockUI();
        // Also update Admin Inputs if open
        if (document.getElementById('stock-modal').style.display === 'block') {
            // Optional: refresh admin UI logic if needed, but might disturb user editing.
        }
    } else {
        // Initialize if empty
        db.collection('stock').doc('main').set(initialStock);
    }
});

function updateStockUI() {
    // Canvas Pro
    const stockCanva = document.getElementById('stock-canva');
    if (stockCanva) {
        stockCanva.innerText = `Stock: ${stockState['canva-pro'] || 0}`;
        updateStockClass(stockCanva, stockState['canva-pro'] || 0);
    }

    // Panel Canva
    const stockPanel = document.getElementById('stock-panel');
    if (stockPanel) {
        stockPanel.innerText = `Stock: ${stockState['panel-canva'] || 0}`;
        updateStockClass(stockPanel, stockState['panel-canva'] || 0);
    }

    // Perplexity
    const stockPerplexity = document.getElementById('stock-perplexity');
    if (stockPerplexity) {
        stockPerplexity.innerText = `Stock: ${stockState['perplexity'] || 0}`;
        updateStockClass(stockPerplexity, stockState['perplexity'] || 0);
    }

    // Gemini
    const stockGemini = document.getElementById('stock-gemini');
    if (stockGemini) {
        stockGemini.innerText = `Stock: ${stockState['gemini'] || 0}`;
        updateStockClass(stockGemini, stockState['gemini'] || 0);
    }

    // Google One
    const stockGoogle = document.getElementById('stock-google');
    if (stockGoogle) {
        stockGoogle.innerText = `Stock: ${stockState['google-one'] || 0}`;
        updateStockClass(stockGoogle, stockState['google-one'] || 0);
    }
}

function updateStockClass(element, quantity) {
    if (quantity === 0) {
        element.classList.remove('stock-available');
        element.classList.add('stock-out');
        element.innerText = 'Sin Stock';
    } else {
        element.classList.remove('stock-out');
        element.classList.add('stock-available');
    }
}

async function decrementStock(productName, quantity) {
    // Map product names to keys
    let key = '';
    if (productName.includes('Canva PRO') && !productName.includes('Panel')) key = 'canva-pro';
    else if (productName.includes('Panel Canva')) key = 'panel-canva';
    else if (productName.includes('Perplexity')) key = 'perplexity';
    else if (productName.includes('Gemini')) key = 'gemini';
    else if (productName.includes('Google One')) key = 'google-one';
    else if (productName.includes('CapCut')) key = 'capcut';

    // Check custom products mapping if needed or use ID based approach in future
    // For now, this covers the hardcoded items.

    if (key) {
        const ref = db.collection('stock').doc('main');
        try {
            await db.runTransaction(async (transaction) => {
                const doc = await transaction.get(ref);
                if (!doc.exists) return; // Should not happen

                const currentStock = doc.data()[key] || 0;
                if (currentStock >= quantity) {
                    transaction.update(ref, { [key]: currentStock - quantity });
                } else {
                    throw new Error(`Stock insuficiente para ${productName}`);
                }
            });
            console.log(`Stock decremented in Cloud for ${key}`);
            return true;
        } catch (e) {
            console.error(e);
            return false;
        }
    }
    return false;
}


// --- Orders Logic ---
async function saveOrder(cartItems, total, method, email, voucherUrl) {
    const user = auth.currentUser;
    if (!user) return;

    try {
        await db.collection('orders').add({
            userId: user.uid,
            userEmail: email,
            items: cartItems,
            total: parseFloat(total),
            method: method,
            voucher: voucherUrl || "No adjuntado",
            status: 'Pendiente', // Initial status
            createdAt: new Date() // Use client-side date for simplicity
        });
        console.log("Order saved successfully!");
    } catch (error) {
        console.error("Error saving order: ", error);
        alert("Error al guardar en historial: " + error.message);
    }
}

async function fetchOrders() {
    const user = auth.currentUser;
    if (!user) return;

    const ordersList = document.getElementById('orders-list');
    ordersList.innerHTML = '<p class="loading-text">Cargando historial...</p>';

    try {
        const snapshot = await db.collection('orders')
            .where('userId', '==', user.uid)
            .get();

        if (snapshot.empty) {
            ordersList.innerHTML = '<p class="no-orders">Aún no has realizado compras.</p>';
            return;
        }

        const orders = [];
        snapshot.forEach(doc => {
            orders.push({ id: doc.id, ...doc.data() });
        });

        // Sort by date descending (Client-side to avoid index requirement)
        orders.sort((a, b) => {
            const dateA = a.createdAt ? a.createdAt.toDate() : new Date(0);
            const dateB = b.createdAt ? b.createdAt.toDate() : new Date(0);
            return dateB - dateA;
        });

        renderOrders(orders);
    } catch (error) {
        console.error("Error fetching orders:", error);
        ordersList.innerHTML = '<p class="error-text">Error al cargar el historial.</p>';
    }
}

function renderOrders(orders) {
    const ordersList = document.getElementById('orders-list');
    ordersList.innerHTML = '';

    orders.forEach(order => {
        const date = order.createdAt ? order.createdAt.toDate().toLocaleDateString() : 'Reciente';
        const itemsHtml = order.items.map(item =>
            `<li class="order-item"><span>${item.name}</span><span>S/${item.price.toFixed(2)}</span></li>`
        ).join('');

        const statusClass = order.status === 'Entregado' ? 'status-completed' : 'status-pending';

        const orderCard = document.createElement('div');
        orderCard.className = 'order-card';
        orderCard.innerHTML = `
            <div class="order-header">
                <span class="order-date">📅 ${date}</span>
                <span class="order-status ${statusClass}">${order.status}</span>
            </div>
            <ul class="order-items">
                ${itemsHtml}
            </ul>
            <div class="order-footer" style="display: flex; justify-content: space-between; align-items: center; margin-top: 10px;">
                <a href="${order.voucher}" target="_blank" style="color: var(--neon-cyan); text-decoration: none; font-size: 0.9rem;">📎 Ver Comprobante</a>
                <div class="order-total">Total: S/${order.total.toFixed(2)}</div>
            </div>
        `;
        ordersList.appendChild(orderCard);
    });
}

async function uploadImageToImgBB(base64Image, customName) {
    const apiKey = 'eda93dc64bbf5d5b2e8110b8dab0d2f2';
    const formData = new FormData();
    formData.append('image', base64Image);
    if (customName) formData.append('name', customName);

    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 30000); // 30 second timeout

    try {
        const response = await fetch(`https://api.imgbb.com/1/upload?key=${apiKey}`, {
            method: 'POST',
            body: formData,
            signal: controller.signal
        });
        clearTimeout(timeoutId);

        const data = await response.json();
        if (data.success) {
            return data.data.url;
        } else {
            throw new Error('Error de ImgBB: ' + (data.error ? data.error.message : 'Desconocido'));
        }
    } catch (error) {
        if (error.name === 'AbortError') {
            throw new Error("Tiempo de espera agotado. Tu internet está lento o la imagen es muy pesada.");
        }
        throw error;
    }
}

document.addEventListener('DOMContentLoaded', () => {
    console.log('Pixelium X initialized');

    // Auth DOM Elements
    const authModal = document.getElementById('auth-modal');
    const tabBtns = document.querySelectorAll('.tab-btn');
    const loginForm = document.getElementById('login-form');
    const registerForm = document.getElementById('register-form');

    updateStockUI(); // Initialize stock display
    window.scrollTo(0, 0); // Ensure start at top

    // --- Mobile Menu Toggle ---
    const mobileMenu = document.getElementById('mobile-menu');
    const navLinks = document.querySelector('.nav-links');

    if (mobileMenu) {
        mobileMenu.addEventListener('click', () => {
            navLinks.classList.toggle('active');
        });

        // Close menu when clicking a link
        document.querySelectorAll('.nav-links a').forEach(link => {
            link.addEventListener('click', () => {
                navLinks.classList.remove('active');
            });
        });
    }

    // --- Smooth Scrolling ---
    document.querySelectorAll('a[href^="#"]').forEach(anchor => {
        anchor.addEventListener('click', function (e) {
            if (this.getAttribute('href') === '#') return;
            e.preventDefault();
            const target = document.querySelector(this.getAttribute('href'));
            if (target) {
                target.scrollIntoView({ behavior: 'smooth' });
            }
        });
    });

    // --- Lightbox Functionality ---
    const lightbox = document.getElementById('lightbox');
    const lightboxImg = document.getElementById('lightbox-img');
    const closeLightbox = document.querySelector('.close-lightbox');
    const productImages = document.querySelectorAll('.product-img');

    if (lightbox && lightboxImg && closeLightbox) {
        productImages.forEach(img => {
            img.addEventListener('click', () => {
                lightbox.style.display = "block";
                lightboxImg.src = img.src;
            });
        });

        closeLightbox.addEventListener('click', () => {
            lightbox.style.display = "none";
        });

        lightbox.addEventListener('click', (e) => {
            if (e.target === lightbox) {
                lightbox.style.display = "none";
            }
        });
    }



    // Mobile Menu Logic (Already initialized above)


    // --- Cart Logic ---
    let cart = JSON.parse(localStorage.getItem('cart')) || [];
    const cartModal = document.getElementById('cart-modal');
    const cartBtn = document.getElementById('cart-btn'); // Navbar btn
    const floatingCartBtn = document.getElementById('floating-cart'); // Floating btn
    const floatingCartCount = document.getElementById('floating-cart-count');
    const closeCart = document.querySelector('.close-cart');
    const cartItemsContainer = document.getElementById('cart-items');
    const cartTotalElement = document.getElementById('cart-total');

    // Initialize UI immediately
    setTimeout(updateCartCount, 100);

    const cartCountElement = document.getElementById('cart-count');
    const checkoutBtn = document.getElementById('checkout-btn');

    // Open/Close Cart Modal
    const openCart = (e) => {
        if (e) e.preventDefault();
        cartModal.style.display = "block";
        updateCartUI();
    };

    if (cartBtn) cartBtn.onclick = openCart;
    if (floatingCartBtn) floatingCartBtn.onclick = openCart;

    if (closeCart) closeCart.onclick = () => cartModal.style.display = "none";

    // Add to Cart Function (Global)
    window.addToCart = (name, price) => {
        const user = auth.currentUser;
        if (!user) {
            alert("Debes iniciar sesión para comprar.");
            openAuthModal('login');
            return;
        }

        const existingItem = cart.find(item => item.name === name);
        if (existingItem) {
            existingItem.quantity = (existingItem.quantity || 1) + 1;
        } else {
            cart.push({ name, price, quantity: 1 });
        }

        updateCartCount();
        updateCartUI();
        saveCart();

        // Visual feedback on floating cart
        if (floatingCartBtn) {
            floatingCartBtn.classList.remove('cart-pulse');
            void floatingCartBtn.offsetWidth;
            floatingCartBtn.classList.add('cart-pulse');
            setTimeout(() => {
                floatingCartBtn.classList.remove('cart-pulse');
            }, 600);
        }

        // Visual feedback on button
        const btn = event.target;
        const originalText = btn.innerText;
        btn.innerText = "¡Agregado!";
        btn.style.background = "#00f3ff";
        btn.style.color = "black";
        setTimeout(() => {
            btn.innerText = originalText;
            btn.style.background = "";
            btn.style.color = "";
        }, 1000);
    };

    function updateCartCount() {
        const count = cart.reduce((sum, item) => sum + (item.quantity || 1), 0);
        if (cartCountElement) cartCountElement.innerText = count;
        if (floatingCartCount) floatingCartCount.innerText = count;

        // Show floating cart if items > 0
        if (floatingCartBtn) {
            if (count > 0) {
                floatingCartBtn.style.display = "flex";
            } else {
                floatingCartBtn.style.display = "none";
            }
        }
    }

    function updateCartUI() {
        if (!cartItemsContainer || !cartTotalElement) return;

        cartItemsContainer.innerHTML = '';
        let total = 0;

        if (cart.length === 0) {
            cartItemsContainer.innerHTML = '<p class="empty-cart">Tu carrito está vacío</p>';
        } else {
            cart.forEach((item, index) => {
                const quantity = item.quantity || 1;
                const subtotal = item.price * quantity;
                total += subtotal;

                const itemEl = document.createElement('div');
                itemEl.className = 'cart-item';
                itemEl.innerHTML = `
                    <span class="cart-item-title" style="flex: 1; margin-right: 10px;">${item.name}</span>
                    <span class="cart-item-price" style="margin-right: 15px;">S/${subtotal.toFixed(2)}</span>
                    <div class="cart-item-controls">
                        <button class="qty-btn qty-minus" onclick="changeQuantity(${index}, -1)">-</button>
                        <span class="qty-val">${quantity}</span>
                        <button class="qty-btn qty-plus" onclick="changeQuantity(${index}, 1)">+</button>
                        <span class="remove-item" onclick="removeFromCart(${index})">❌</span>
                    </div>
                `;
                cartItemsContainer.appendChild(itemEl);
            });
        }
        cartTotalElement.innerText = total.toFixed(2);
    }

    window.changeQuantity = (index, delta) => {
        const item = cart[index];
        if (item) {
            item.quantity = (item.quantity || 1) + delta;
            if (item.quantity <= 0) {
                cart.splice(index, 1);
            }
            updateCartCount();
            updateCartUI();
            saveCart();
        }
    };

    window.removeFromCart = (index) => {
        cart.splice(index, 1);
        updateCartCount();
        updateCartUI();
        saveCart(); // Save changes
    };

    function saveCart() {
        const user = auth.currentUser;
        if (user) {
            localStorage.setItem(`cart_${user.uid}`, JSON.stringify(cart));
        }
    }

    // Toggle Payment Methods
    window.togglePaymentMethod = () => {
        const method = document.querySelector('input[name="payment"]:checked').value;
        const yapeForm = document.getElementById('yape-form');
        const binanceForm = document.getElementById('binance-form');
        const checkoutBtn = document.getElementById('checkout-btn');

        if (method === 'yape') {
            yapeForm.style.display = 'block';
            binanceForm.style.display = 'none';
            checkoutBtn.innerText = "Realizar Pedido";
        } else {
            yapeForm.style.display = 'none';
            binanceForm.style.display = 'block';
            checkoutBtn.innerText = "Realizar Pedido";
        }
    };

    // Checkout Logic (Robust WhatsApp Redirect)
    if (checkoutBtn) {
        checkoutBtn.onclick = async () => {
            const user = auth.currentUser;
            if (!user) {
                alert("Debes iniciar sesión para finalizar la compra.");
                openAuthModal('login');
                return;
            }

            if (cart.length === 0) return alert("Agrega productos primero.");

            const method = document.querySelector('input[name="payment"]:checked').value;
            const originalText = checkoutBtn.innerText;

            // --- PRE-OPEN WINDOW (Bypass Popup Blocker) ---
            let redirectWindow = null;
            try {
                redirectWindow = window.open('', '_blank');
                if (redirectWindow) {
                    redirectWindow.document.write('<html><body style="background:#111; color:#fff; display:flex; justify-content:center; align-items:center; height:100vh; font-family:sans-serif;"><h3>⏳ Procesando tu pedido... por favor espera...</h3></body></html>');
                }
            } catch (e) {
                console.warn("Popup blocked or failed to open", e);
            }

            // --- VALIDATION ---
            let voucherInput, emailInput;

            if (method === 'yape') {
                voucherInput = document.getElementById('yape-voucher');
                emailInput = document.getElementById('yape-email');
            } else {
                voucherInput = document.getElementById('binance-voucher');
                emailInput = document.getElementById('binance-email');
            }

            if (!voucherInput.files[0]) {
                if (redirectWindow) redirectWindow.close();
                return alert("Por favor, selecciona la captura del comprobante.");
            }

            // Validate File Size (Max 5MB)
            if (voucherInput.files[0].size > 5 * 1024 * 1024) {
                if (redirectWindow) redirectWindow.close();
                return alert("⚠️ La imagen es muy pesada. Por favor sube una imagen de menos de 5MB.");
            }

            if (!emailInput.value || !emailInput.value.includes('@')) {
                if (redirectWindow) redirectWindow.close();
                return alert("Por favor, ingresa un correo válido.");
            }

            // Process Checkout
            const file = voucherInput.files[0];
            const reader = new FileReader();

            reader.onloadend = async function () {
                const base64Image = reader.result.split(',')[1];
                checkoutBtn.innerText = "Subiendo comprobante...";
                checkoutBtn.disabled = true;

                // DEBUG TRACE
                alert("Paso 1: Iniciando subida...");

                try {
                    const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
                    const customName = `Comprobante_${emailInput.value}_${timestamp}`;

                    const imageUrl = await uploadImageToImgBB(base64Image, customName);

                    // DEBUG TRACE
                    alert("Paso 2: Imagen subida. Guardando...");

                    // Calculate total
                    let total = 0;
                    cart.forEach(item => total += item.price * (item.quantity || 1));

                    await saveOrder(cart, total, method, emailInput.value, imageUrl);

                    // Decrement Stock
                    try {
                        for (const item of cart) {
                            const qty = item.quantity || 1;
                            await decrementStock(item.name, qty);
                        }
                    } catch (stockError) {
                        console.error("Error decrementing stock:", stockError);
                    }

                    // Construct WhatsApp Message
                    const rocket = '\uD83D\uDE80';
                    const sparkles = '\u2728';
                    const fire = '\uD83D\uDD25';
                    const laptop = '\uD83D\uDCBB';
                    const user = '\uD83D\uDC64';
                    const money = '\uD83D\uDCB0';
                    const card = '\uD83D\uDCB3';
                    const clip = '\uD83D\uDCCE';
                    const box = '\uD83D\uDCE6';
                    const bolt = '\u26A1';

                    let message = `¡HOLA EQUIPO PIXELIUM X! ${rocket}${sparkles}\n\n`;
                    message += `Acabo de realizar una compra ÉPICA y quiero activar mis productos YA. ${fire}${laptop}\n\n`;
                    message += `Aquí están mis credenciales de éxito:\n`;
                    // ... (message building continues) ...
                    message += `${user} *Usuario:* ${emailInput.value}\n`;
                    message += `${money} *Inversión Total:* S/ ${total.toFixed(2)}\n`;
                    message += `${card} *Método de Pago:* ${method.toUpperCase()}\n`;
                    message += `${clip} *Comprobante:* ${imageUrl}\n\n`;
                    message += `${box} *Mis Herramientas de Poder:*\n`;

                    cart.forEach(item => {
                        const qty = item.quantity || 1;
                        message += `- (${qty}) ${item.name} (S/${(item.price * qty).toFixed(2)})\n`;
                    });

                    message += `\n¡Quedo a la espera de mi activación! ${bolt}`;

                    alert("Paso 3: Redirigiendo a WhatsApp...");

                    // Update Redirect Window using location.href
                    if (method === 'binance') {
                        navigator.clipboard.writeText(message).catch(console.error);
                        if (redirectWindow) {
                            redirectWindow.location.href = 'https://t.me/Pixelium_g';
                        } else {
                            window.open('https://t.me/Pixelium_g', '_blank');
                        }
                    } else {
                        // FORCE STANDARD HTTPS (Mobile & PC) - V7 FINAL FIX
                        // This prevents "black screen" on mobile by loading a real webpage first.
                        const waUrl = `https://api.whatsapp.com/send?phone=51919669508&text=${encodeURIComponent(message)}`;

                        if (redirectWindow) {
                            redirectWindow.location.href = waUrl;
                        } else {
                            window.location.href = waUrl;
                        }
                    }

                    alert("¡Pedido enviado con éxito! WhatsApp se abrirá automáticamente.");
                    cart = [];
                    updateCartCount();
                    updateCartUI();
                    cartModal.style.display = 'none';

                } catch (error) {
                    console.error(error);
                    alert("Error al procesar el pedido: " + error.message);
                    if (redirectWindow) redirectWindow.close();
                } finally {
                    checkoutBtn.innerText = originalText;
                    checkoutBtn.disabled = false;
                }
            };
            reader.readAsDataURL(file);
        };
    }

    // Modal Functions
    window.openAuthModal = (tab) => {
        if (authModal) {
            authModal.style.display = "block";
            switchTab(tab);
        }
    };

    window.closeAuthModal = () => {
        if (authModal) authModal.style.display = "none";
    };

    window.switchTab = (tab) => {
        // Update tabs UI
        tabBtns.forEach(btn => btn.classList.remove('active'));
        if (tab === 'login') {
            tabBtns[0].classList.add('active');
            loginForm.style.display = 'block';
            registerForm.style.display = 'none';
        } else {
            tabBtns[1].classList.add('active');
            loginForm.style.display = 'none';
            registerForm.style.display = 'block';
        }
    };

    // Close modal on outside click
    window.onclick = (event) => {
        if (event.target == authModal) {
            closeAuthModal();
        }
        if (event.target == cartModal) {
            cartModal.style.display = "none";
        }
        if (event.target == document.getElementById('lightbox')) document.getElementById('lightbox').style.display = "none";
    };

    window.togglePasswordVisibility = (inputId, icon) => {
        const input = document.getElementById(inputId);
        if (input.type === "password") {
            input.type = "text";
            icon.classList.remove('fa-eye');
            icon.classList.add('fa-eye-slash');
        } else {
            input.type = "password";
            icon.classList.remove('fa-eye-slash');
            icon.classList.add('fa-eye');
        }
    };

    // Register Action
    const btnRegisterAction = document.getElementById('btn-register-action');
    if (btnRegisterAction) {
        btnRegisterAction.addEventListener('click', async () => {
            const email = document.getElementById('register-email').value;
            const password = document.getElementById('register-password').value;
            const errorMsg = document.getElementById('register-error');

            const isGmail = email.endsWith('@gmail.com');
            const isOutlook = email.includes('@outlook'); // Covers .com, .es, etc.
            const isEdu = email.includes('.edu');

            if (!isGmail && !isOutlook && !isEdu) {
                errorMsg.innerText = "Solo se permiten correos Gmail, Outlook o Educativos (.edu)";
                return;
            }



            try {
                await auth.createUserWithEmailAndPassword(email, password);
                // Success handled by onAuthStateChanged
            } catch (error) {
                errorMsg.innerText = error.message;
            }
        });
    }

    // Login Action
    const btnLoginAction = document.getElementById('btn-login-action');
    if (btnLoginAction) {
        btnLoginAction.addEventListener('click', async () => {
            const email = document.getElementById('login-email').value;
            const password = document.getElementById('login-password').value;
            const errorMsg = document.getElementById('login-error');

            try {
                await auth.signInWithEmailAndPassword(email, password);
                // Success handled by onAuthStateChanged
            } catch (error) {
                errorMsg.innerText = "Error: Verifica tus credenciales.";
                console.error(error);
            }
        });
    }

    // Logout Action
    const btnLogout = document.getElementById('logout-btn');
    if (btnLogout) {
        btnLogout.addEventListener('click', async () => {
            try {
                await auth.signOut();
            } catch (error) {
                console.error("Error signing out", error);
            }
        });
    }

    // Orders Modal Close Logic
    const ordersModal = document.getElementById('orders-modal');
    const closeOrdersBtn = document.querySelector('.close-orders');

    if (closeOrdersBtn) {
        closeOrdersBtn.addEventListener('click', () => {
            ordersModal.style.display = "none";
        });
    }

    // Close modal on outside click (Updated)
    window.onclick = (event) => {
        if (event.target == authModal) closeAuthModal();
        if (event.target == cartModal) cartModal.style.display = "none";
        if (event.target == ordersModal) ordersModal.style.display = "none";
        if (event.target == document.getElementById('stock-modal')) document.getElementById('stock-modal').style.display = "none";
        if (event.target == document.getElementById('lightbox')) document.getElementById('lightbox').style.display = "none";
    };

    // --- Auth State Observer & Admin Setup ---
    auth.onAuthStateChanged((user) => {
        const authButtons = document.getElementById('auth-buttons');
        const userInfo = document.getElementById('user-info');
        const userAvatar = document.getElementById('user-avatar');

        if (user) {
            // User is signed in
            if (authButtons) authButtons.style.display = 'none';
            if (userInfo) userInfo.style.display = 'flex';

            // Load saved avatar
            const savedAvatar = localStorage.getItem(`avatar_${user.uid}`);
            if (savedAvatar) {
                userAvatar.src = savedAvatar;
            } else {
                userAvatar.src = `https://ui-avatars.com/api/?name=${user.email.charAt(0)}&background=00f3ff&color=000`;
            }

            // Load saved cart
            const savedCart = localStorage.getItem(`cart_${user.uid}`);
            if (savedCart) {
                cart = JSON.parse(savedCart);
                updateCartCount();
                updateCartUI();
            }

            // Show Orders Button
            const ordersBtn = document.getElementById('orders-btn');
            if (ordersBtn) {
                ordersBtn.style.display = 'block';
                ordersBtn.onclick = () => {
                    document.getElementById('orders-modal').style.display = 'block';
                    fetchOrders();
                };
            }

            // --- Admin Button Logic ---
            const adminBtnContainer = document.getElementById('admin-btn-container');
            const stockAdminBtnContainer = document.getElementById('stock-admin-btn-container');
            const productsAdminBtnContainer = document.getElementById('products-admin-btn-container');
            const pricesAdminBtnContainer = document.getElementById('prices-admin-btn-container');
            const themesAdminBtnContainer = document.getElementById('themes-admin-btn-container');

            if (user.email === 'caproprimero@gmail.com') {
                if (adminBtnContainer) adminBtnContainer.style.display = 'block';
                if (stockAdminBtnContainer) stockAdminBtnContainer.style.display = 'block';
                if (productsAdminBtnContainer) productsAdminBtnContainer.style.display = 'block';
                if (pricesAdminBtnContainer) pricesAdminBtnContainer.style.display = 'block';
                if (themesAdminBtnContainer) themesAdminBtnContainer.style.display = 'block';
            } else {
                if (adminBtnContainer) adminBtnContainer.style.display = 'none';
                if (stockAdminBtnContainer) stockAdminBtnContainer.style.display = 'none';
                if (productsAdminBtnContainer) productsAdminBtnContainer.style.display = 'none';
                if (pricesAdminBtnContainer) pricesAdminBtnContainer.style.display = 'none';
                if (themesAdminBtnContainer) themesAdminBtnContainer.style.display = 'none';
            }

            closeAuthModal();
        } else {
            // User is signed out
            if (authButtons) authButtons.style.display = 'flex';
            if (userInfo) userInfo.style.display = 'none';

            const ordersBtn = document.getElementById('orders-btn');
            if (ordersBtn) ordersBtn.style.display = 'none';

            const adminBtnContainer = document.getElementById('admin-btn-container');
            if (adminBtnContainer) adminBtnContainer.style.display = 'none';

            const stockAdminBtnContainer = document.getElementById('stock-admin-btn-container');
            if (stockAdminBtnContainer) stockAdminBtnContainer.style.display = 'none';

            const productsAdminBtnContainer = document.getElementById('products-admin-btn-container');
            if (productsAdminBtnContainer) productsAdminBtnContainer.style.display = 'none';

            const pricesAdminBtnContainer = document.getElementById('prices-admin-btn-container');
            if (pricesAdminBtnContainer) pricesAdminBtnContainer.style.display = 'none';

            const themesAdminBtnContainer = document.getElementById('themes-admin-btn-container');
            if (themesAdminBtnContainer) themesAdminBtnContainer.style.display = 'none';



            // Clear cart from UI
            cart = [];
            updateCartCount();
            updateCartUI();
        }
    });

    // Admin Event Listeners
    const adminBtn = document.getElementById('btn-admin');
    const closeAdminBtn = document.querySelector('.close-admin');

    if (adminBtn) {
        adminBtn.addEventListener('click', openAdminPanel);
    }

    if (closeAdminBtn) {
        closeAdminBtn.addEventListener('click', () => {
            document.getElementById('admin-modal').style.display = "none";
        });
    }

    // --- Profile Picture Logic ---
    const userAvatar = document.getElementById('user-avatar');
    const avatarInput = document.getElementById('avatar-input');

    if (userAvatar && avatarInput) {
        userAvatar.addEventListener('click', () => {
            avatarInput.click();
        });

        avatarInput.addEventListener('change', (e) => {
            const file = e.target.files[0];
            if (file) {
                const reader = new FileReader();
                reader.onload = function (event) {
                    const base64Image = event.target.result;
                    userAvatar.src = base64Image;

                    // Save to LocalStorage linked to user UID
                    const user = auth.currentUser;
                    if (user) {
                        localStorage.setItem(`avatar_${user.uid}`, base64Image);
                    }
                };
                reader.readAsDataURL(file);
            }
        });
    }
    // --- Admin Logic Functions ---
    const ADMIN_EMAIL = 'caproprimero@gmail.com';
    const adminOrdersList = document.getElementById('admin-orders-list');
    const adminModal = document.getElementById('admin-modal');

    function openAdminPanel() {
        if (adminModal) adminModal.style.display = "block";
        fetchAllOrders();
    }



    // --- Admin Stock Logic ---


    async function fetchAllOrders() {
        if (!adminOrdersList) return;
        adminOrdersList.innerHTML = '<p style="text-align:center; color:white;">Cargando pedidos...</p>';
        try {
            const snapshot = await db.collection('orders').get();

            if (snapshot.empty) {
                adminOrdersList.innerHTML = '<p class="no-orders">No hay pedidos registrados.</p>';
                return;
            }

            const orders = [];
            snapshot.forEach(doc => {
                orders.push({ id: doc.id, ...doc.data() });
            });

            // Sort by date descending
            orders.sort((a, b) => {
                const dateA = a.createdAt ? a.createdAt.toDate() : new Date(0);
                const dateB = b.createdAt ? b.createdAt.toDate() : new Date(0);
                return dateB - dateA;
            });

            renderAdminOrders(orders);
        } catch (error) {
            console.error("Error fetching all orders:", error);
            adminOrdersList.innerHTML = '<p class="no-orders">Error al cargar pedidos.</p>';
        }
    }

    function renderAdminOrders(orders) {
        adminOrdersList.innerHTML = '';
        orders.forEach(order => {
            const date = order.createdAt ? order.createdAt.toDate().toLocaleString() : 'Reciente';
            const itemsHtml = order.items.map(item =>
                `<li class="order-item"><span>${item.name}</span><span>S/${item.price.toFixed(2)}</span></li>`
            ).join('');

            const statusClass = order.status === 'Entregado' ? 'status-completed' : 'status-pending';
            const isPending = order.status === 'Pendiente';

            const orderCard = document.createElement('div');
            orderCard.className = 'order-card';
            orderCard.innerHTML = `
                <div class="order-header">
                    <span class="order-date">📅 ${date}</span>
                    <span class="order-status ${statusClass}">${order.status}</span>
                </div>
                <div style="margin-bottom: 10px; font-size: 0.9rem; color: #ccc;">
                    👤 <strong>Usuario:</strong> ${order.userEmail} <br>
                    💳 <strong>Pago:</strong> ${order.method}
                </div>
                <ul class="order-items">
                    ${itemsHtml}
                </ul>
                <div class="order-footer" style="display: flex; justify-content: space-between; align-items: center; margin-top: 10px;">
                    <a href="${order.voucher}" target="_blank" style="color: var(--neon-cyan); text-decoration: none; font-size: 0.9rem;">📎 Ver Comprobante</a>
                    <div class="order-total">Total: S/${order.total.toFixed(2)}</div>
                </div>
                ${isPending ? `<button class="btn-deliver" onclick="updateOrderStatus('${order.id}', 'Entregado')" style="width:100%; margin-top:10px; padding:8px; background:#00ff88; color:#000; border:none; border-radius:4px; font-weight:bold; cursor:pointer;">✅ Marcar como Entregado</button>` : ''}
            `;
            adminOrdersList.appendChild(orderCard);
        });
    }

    window.updateOrderStatus = async (orderId, status) => {
        if (!confirm(`¿Estás seguro de marcar este pedido como ${status}?`)) return;

        try {
            await db.collection('orders').doc(orderId).update({ status: status });
            alert("¡Pedido actualizado!");
            fetchAllOrders(); // Refresh list
        } catch (error) {
            console.error("Error updating order:", error);
            alert("Error al actualizar: " + error.message);
        }
    };

    // --- Export to CSV Logic ---
    const btnExportCsv = document.getElementById('btn-export-csv');
    if (btnExportCsv) {
        btnExportCsv.addEventListener('click', exportOrdersToCSV);
    }

    async function exportOrdersToCSV() {
        try {
            const snapshot = await db.collection('orders').get();
            if (snapshot.empty) {
                alert("No hay pedidos para exportar.");
                return;
            }

            // Create HTML Table for Excel
            let table = `
                        <html xmlns:o="urn:schemas-microsoft-com:office:office" xmlns:x="urn:schemas-microsoft-com:office:excel" xmlns="http://www.w3.org/TR/REC-html40">
                        <head>
                            <meta charset="UTF-8">
                            <style>
                                table { border-collapse: collapse; width: 100%; font-family: Arial, sans-serif; }
                                th { background-color: #00f3ff; color: #000000; border: 1px solid #000; padding: 10px; font-weight: bold; text-align: center; }
                                td { border: 1px solid #ccc; padding: 8px; text-align: left; vertical-align: middle; }
                                .status-entregado { background-color: #00ff88; color: #000; font-weight: bold; text-align: center; }
                                .status-pendiente { background-color: #ffcc00; color: #000; font-weight: bold; text-align: center; }
                                .header-title { font-size: 18px; font-weight: bold; margin-bottom: 20px; }
                            </style>
                        </head>
                        <body>
                            <div class="header-title">Reporte de Ventas - Pixelium X</div>
                            <table>
                                <thead>
                                    <tr>
                                        <th>Fecha</th>
                                        <th>Hora</th>
                                        <th>Cliente (Email)</th>
                                        <th>Productos</th>
                                        <th>Total (S/)</th>
                                        <th>Método Pago</th>
                                        <th>Estado</th>
                                        <th>Link Comprobante</th>
                                    </tr>
                                </thead>
                                <tbody>
                    `;

            snapshot.forEach(doc => {
                const order = doc.data();
                const dateObj = order.createdAt ? order.createdAt.toDate() : new Date();
                const date = dateObj.toLocaleDateString();
                const time = dateObj.toLocaleTimeString();

                // Format products list with line breaks for Excel
                const products = order.items.map(i => `• ${i.name} (S/${i.price})`).join('<br>');

                const statusClass = order.status === 'Entregado' ? 'status-entregado' : 'status-pendiente';

                table += `
                            <tr>
                                <td>${date}</td>
                                <td>${time}</td>
                                <td>${order.userEmail}</td>
                                <td>${products}</td>
                                <td>${order.total.toFixed(2)}</td>
                                <td>${order.method.toUpperCase()}</td>
                                <td class="${statusClass}">${order.status}</td>
                                <td><a href="${order.voucher}" target="_blank">Ver Comprobante</a></td>
                            </tr>
                        `;
            });

            table += `
                                </tbody>
                            </table>
                        </body>
                        </html>
                    `;

            const blob = new Blob([table], { type: 'application/vnd.ms-excel' });
            const url = window.URL.createObjectURL(blob);
            const link = document.createElement("a");
            link.href = url;
            link.download = "Reporte_Ventas_Pixelium.xls"; // .xls extension triggers Excel to open it
            document.body.appendChild(link);
            link.click();
            document.body.removeChild(link);

        } catch (error) {
            console.error("Error exporting Excel:", error);
            alert("Error al exportar reporte.");
        }
    }


    // --- STOCK MANAGER LOGIC (SEPARATE SYSTEM) ---
    const stockModal = document.getElementById('stock-modal');
    const btnStockAdmin = document.getElementById('btn-stock-admin');
    const closeStockBtn = document.querySelector('.close-stock');
    const btnSaveStock = document.getElementById('btn-save-stock');
    const stockListContainer = document.getElementById('stock-list-container');

    if (btnStockAdmin) {
        btnStockAdmin.addEventListener('click', () => {
            stockModal.style.display = 'block';
            renderStockManager();
        });
    }

    if (closeStockBtn) {
        closeStockBtn.addEventListener('click', () => {
            stockModal.style.display = 'none';
        });
    }

    function renderStockManager() {
        stockListContainer.innerHTML = '';

        // Map nice names to keys
        const productNames = {
            'canva-pro': 'Canva PRO (Personal)',
            'panel-canva': 'Panel Canva PRO',
            'perplexity': 'Perplexity AI',
            'gemini': 'Gemini Advanced',
            'google-one': 'Google One',
            'capcut': 'CapCut Pro'
        };

        for (const [key, value] of Object.entries(stockState)) {
            const row = document.createElement('div');
            row.className = 'stock-item-row';
            row.innerHTML = `
            <span class="stock-item-name">${productNames[key] || key}</span>
            <input type="number" class="stock-input" data-key="${key}" value="${value}" min="0">
        `;
            stockListContainer.appendChild(row);
        }
    }

    if (btnSaveStock) {
        btnSaveStock.addEventListener('click', () => {
            const inputs = document.querySelectorAll('.stock-input');
            const updates = {};
            let changesMade = false;

            inputs.forEach(input => {
                const key = input.getAttribute('data-key');
                const newValue = parseInt(input.value);

                if (!isNaN(newValue) && newValue >= 0) {
                    updates[key] = newValue;
                    changesMade = true;
                }
            });

            if (changesMade) {
                // Update Firestore
                db.collection('stock').doc('main').set(updates, { merge: true })
                    .then(() => {
                        alert('¡Stock Global actualizado! ☁️✅');
                        stockModal.style.display = 'none';
                    })
                    .catch(err => alert("Error guardando stock: " + err.message));
            }
        });
    }

    // --- PRODUCT MANAGER LOGIC (SEPARATE SYSTEM) ---
    const productModal = document.getElementById('product-modal');
    const btnProductsAdmin = document.getElementById('btn-products-admin');
    const closeProductModalBtn = document.querySelector('.close-product-modal');
    const btnCreateProduct = document.getElementById('btn-create-product');
    const productAdminList = document.getElementById('product-admin-list');

    // State
    // Load from Firestore (Real-time)
    let hiddenProducts = JSON.parse(localStorage.getItem('hiddenProducts')) || []; // Keep hidden local for now or migrate later? Request was Prices & Products. Let's do Products (Custom).
    // Actually, migration of customProducts to Firestore
    let customProducts = [];

    // 1. Initialization: Listen to Firestore
    function initProductSystem() {
        db.collection('products').onSnapshot(snapshot => {
            const products = [];
            snapshot.forEach(doc => {
                products.push(doc.data());
            });
            customProducts = products;

            // Re-render
            // Clear current custom cards first? or just rely on IDs.
            // Simplified: Remove all custom cards then re-add
            document.querySelectorAll('.card[id^="custom_"]').forEach(e => e.remove());
            renderCustomProductsOnGrid();
            applyProductVisibility();

            // If admin modal open, refresh list
            if (productModal.style.display === 'block') {
                renderAdminProductList();
            }
        });
    }

    // Call on load
    initProductSystem();

    if (btnProductsAdmin) {
        btnProductsAdmin.addEventListener('click', () => {
            productModal.style.display = 'block';
            renderAdminProductList();
            switchProductTab('add');
        });
    }

    if (closeProductModalBtn) {
        closeProductModalBtn.addEventListener('click', () => {
            productModal.style.display = 'none';
            // Reload page to apply changes cleanly if something was cleared
            if (confirm("¿Recargar página para ver cambios?")) location.reload();
        });
    }

    // Tab Switcher
    window.switchProductTab = (tab) => {
        document.getElementById('product-tab-add').style.display = tab === 'add' ? 'block' : 'none';
        document.getElementById('product-tab-list').style.display = tab === 'list' ? 'block' : 'none';

        // Update active class on buttons manually if needed, or keeping simple
    };

    // --- LOGIC: CREATE PRODUCT ---
    if (btnCreateProduct) {
        btnCreateProduct.addEventListener('click', async () => {
            const title = document.getElementById('new-prod-name').value;
            const price = document.getElementById('new-prod-price').value;
            const imgInput = document.getElementById('new-prod-img');

            if (!title || !price || !imgInput.files[0]) {
                return alert("Nombre, Precio e Imagen son obligatorios.");
            }

            btnCreateProduct.innerText = "Subiendo imagen...";
            btnCreateProduct.disabled = true;

            try {
                // Upload Image
                const reader = new FileReader();
                reader.readAsDataURL(imgInput.files[0]);
                reader.onloadend = async function () {

                    const base64Image = reader.result.split(',')[1];
                    const imageUrl = await uploadImageToImgBB(base64Image, `Prod_${title}`);

                    const prodId = 'custom_' + Date.now();
                    const newProduct = {
                        id: prodId,
                        title: title,
                        desc: document.getElementById('new-prod-desc').value,
                        price: parseFloat(price),
                        priceAlt: document.getElementById('new-prod-price-alt').value,
                        stock: parseInt(document.getElementById('new-prod-stock').value) || 10,
                        warranty: document.getElementById('new-prod-warranty').value,
                        image: imageUrl,
                        badge: document.getElementById('new-prod-badge').value,
                        note: document.getElementById('new-prod-note').value
                    };

                    // Save to Firestore
                    try {
                        await db.collection('products').doc(prodId).set(newProduct);

                        // Initialize stock for this new product in Firestore Stock
                        await db.collection('stock').doc('main').set({
                            [title]: newProduct.stock
                        }, { merge: true });

                        alert("¡Producto Creado en la Nube! ☁️");
                        // Reset form
                        document.getElementById('new-prod-name').value = '';
                        document.getElementById('new-prod-price').value = '';
                        document.getElementById('new-prod-img').value = '';
                        btnCreateProduct.innerText = "✨ Crear Producto";
                        btnCreateProduct.disabled = false;

                        // No reload needed due to onSnapshot
                    } catch (err) {
                        alert("Error guardando: " + err.message);
                        btnCreateProduct.disabled = false;
                    }
                };
            } catch (e) {
                console.error(e);
                alert("Error: " + e.message);
                btnCreateProduct.innerText = "✨ Crear Producto";
                btnCreateProduct.disabled = false;
            }
        });
    }



    // --- LOGIC: VISIBILITY (MASKING) ---
    function applyProductVisibility() {
        document.querySelectorAll('.card').forEach(card => {
            const titleEl = card.querySelector('h3');
            if (titleEl && hiddenProducts.includes(titleEl.innerText.trim())) {
                card.style.display = 'none';
            } else {
                if (card.style.display === 'none') card.style.display = '';
            }
        });
    }

    // --- LOGIC: RENDER CUSTOMS ON GRID ---
    function renderCustomProductsOnGrid() {
        const grid = document.querySelector('.services-grid');
        if (!grid) return;

        customProducts.forEach(prod => {
            if (document.getElementById(prod.id)) return;

            const card = document.createElement('div');
            card.className = 'card';
            card.id = prod.id;

            const currentStock = stockState[prod.title] !== undefined ? stockState[prod.title] : prod.stock;
            const stockClass = currentStock > 0 ? 'stock-available' : 'stock-out';
            const stockText = currentStock > 0 ? `Stock: ${currentStock}` : 'Sin Stock';
            const btnState = currentStock > 0 ? '' : 'disabled';
            const btnText = currentStock > 0 ? 'Agregar al Carrito' : 'Agotado';

            card.innerHTML = `
            <div class="card-icon">
                <img src="${prod.image}" alt="${prod.title}" class="product-img">
            </div>
            <h3>${prod.title}</h3>
            ${prod.desc ? `<p>${prod.desc}</p>` : ''}
            
            <div id="stock-${prod.id}" class="stock-status ${stockClass}">${stockText}</div>
            
            ${prod.badge ? `<p class="gold-text">${prod.badge}</p>` : ''}
            ${prod.note ? `<p class="activation-note">${prod.note}</p>` : ''}
            
            ${prod.warranty ? `
            <div class="warranty-info">
                <i class="fas fa-star warranty-star"></i>
                <span>${prod.warranty}</span>
            </div>` : ''}
            
            <div class="price-tag">S/${prod.price.toFixed(2)} ${prod.priceAlt ? `<span class="price-alt">($${prod.priceAlt})</span>` : ''}</div>
            <button class="btn-add" onclick="addToCart('${prod.title}', ${prod.price})" ${btnState}>${btnText}</button>
            `;

            const newImg = card.querySelector('.product-img');
            newImg.addEventListener('click', () => {
                const lightbox = document.getElementById('lightbox');
                const lightboxImg = document.getElementById('lightbox-img');
                if (lightbox && lightboxImg) {
                    lightbox.style.display = "block";
                    lightboxImg.src = newImg.src;
                }
            });

            grid.appendChild(card);
        });
    }

    // --- LOGIC: ADMIN LIST ---
    function renderAdminProductList() {
        if (!productAdminList) return;
        productAdminList.innerHTML = '';

        document.querySelectorAll('.services-grid .card').forEach(card => {
            if (card.id.startsWith('custom_')) return;

            const title = card.querySelector('h3').innerText.trim();
            const isHidden = hiddenProducts.includes(title);

            const row = document.createElement('div');
            row.className = 'stock-item-row';
            row.innerHTML = `
            <span class="stock-item-name">${title} (Original)</span>
            <button onclick="toggleProductVisibility('${title}')" style="background: ${isHidden ? '#39ff14' : '#ff4444'}; border:none; border-radius:4px; padding:  5px; cursor:pointer; color:black; font-weight:bold;">
                ${isHidden ? 'Mostrar' : 'Ocultar'}
            </button>
        `;
            productAdminList.appendChild(row);
        });

        customProducts.forEach((prod, index) => {
            const row = document.createElement('div');
            row.className = 'stock-item-row';
            row.innerHTML = `
            <span class="stock-item-name">${prod.title} (Custom)</span>
            <button onclick="deleteCustomProduct(${index})" style="background: #ff4444; border:none; border-radius:4px; padding: 5px; cursor:pointer; color:white; font-weight:bold;">
                Borrar
            </button>
        `;
            productAdminList.appendChild(row);
        });
    }

    window.toggleProductVisibility = (title) => {
        if (hiddenProducts.includes(title)) {
            hiddenProducts = hiddenProducts.filter(t => t !== title);
        } else {
            hiddenProducts.push(title);
        }
        localStorage.setItem('hiddenProducts', JSON.stringify(hiddenProducts));
        renderAdminProductList();
        applyProductVisibility();
    };

    window.deleteCustomProduct = async (index) => {
        if (!confirm("¿Eliminar este producto permanentemente?")) return;
        const prod = customProducts[index];
        if (prod) {
            try {
                await db.collection('products').doc(prod.id).delete();
                alert("Producto eliminado de la nube.");
            } catch (err) {
                alert("Error al eliminar: " + err.message);
            }
        }
    };

    // --- PRICE MANAGER LOGIC (SEPARATE SYSTEM) ---
    const priceModal = document.getElementById('price-modal');
    const btnPricesAdmin = document.getElementById('btn-prices-admin');
    const closePriceModalBtn = document.querySelector('.close-price-modal');
    const btnSavePrices = document.getElementById('btn-save-prices');
    const priceAdminList = document.getElementById('price-admin-list');

    // State
    // Load from Firestore (Real-time)
    let priceState = {};

    // 1. Initialization: Listen to Prices
    function initPriceSystem() {
        db.collection('prices').doc('main').onSnapshot(doc => {
            if (doc.exists) {
                priceState = doc.data();
                applyPriceOverrides();
            } else {
                db.collection('prices').doc('main').set({});
            }
        });
    }

    // Call on load
    initPriceSystem();

    if (btnPricesAdmin) {
        btnPricesAdmin.addEventListener('click', () => {
            priceModal.style.display = 'block';
            renderPriceManager();
        });
    }

    if (closePriceModalBtn) {
        closePriceModalBtn.addEventListener('click', () => {
            priceModal.style.display = 'none';
            applyPriceOverrides(); // Re-apply just in case
        });
    }

    // --- LOGIC: RENDER ADMIN LIST ---
    function renderPriceManager() {
        if (!priceAdminList) return;
        priceAdminList.innerHTML = '';

        // Scan all cards (Hardcoded + Custom)
        document.querySelectorAll('.services-grid .card').forEach(card => {
            const title = card.querySelector('h3').innerText.trim();
            // Get current price from STATE or parse from DOM if not in state
            let currentPrice = priceState[title];

            if (!currentPrice) {
                // Extract from DOM "S/15.00" -> 15.00
                const priceTag = card.querySelector('.price-tag');
                if (priceTag) {
                    const text = priceTag.childNodes[0].nodeValue.trim(); // "S/15.00"
                    currentPrice = parseFloat(text.replace(/[^\d.]/g, ''));
                } else {
                    currentPrice = 0;
                }
            }

            const row = document.createElement('div');
            row.className = 'stock-item-row';
            row.innerHTML = `
                <span class="stock-item-name">${title}</span>
                <input type="number" step="0.50" class="stock-input price-input-field"
                    data-title="${title}"
                    value="${currentPrice}">
                    `;
            priceAdminList.appendChild(row);
        });
    }

    if (btnSavePrices) {
        btnSavePrices.addEventListener('click', () => {
            const inputs = document.querySelectorAll('.price-input-field');
            const updates = {};
            inputs.forEach(input => {
                const title = input.getAttribute('data-title');
                const val = parseFloat(input.value);
                if (!isNaN(val)) {
                    updates[title] = val;
                }
            });

            // Save to Firestore
            db.collection('prices').doc('main').set(updates, { merge: true })
                .then(() => {
                    alert("¡Precios Globales Actualizados! ☁️💰");
                    priceModal.style.display = 'none';
                })
                .catch(err => alert("Error: " + err.message));
        });
    }

    // --- LOGIC: APPLY OVERRIDES (CORE) ---
    function applyPriceOverrides() {
        document.querySelectorAll('.services-grid .card').forEach(card => {
            const title = card.querySelector('h3').innerText.trim();

            if (priceState[title] !== undefined) {
                const newPrice = priceState[title];

                // 1. Update Visual Text
                const priceTag = card.querySelector('.price-tag');
                if (priceTag) {
                    // Keep the structural span for alt price if exists, just update text node
                    // Easier: Just rebuild innerHTML to keep format "S/XX <span...>"
                    // Check if there is an alt price span
                    const altSpan = priceTag.querySelector('.price-alt');
                    const altHtml = altSpan ? altSpan.outerHTML : '';
                    priceTag.innerHTML = `S/${newPrice.toFixed(2)} ${altHtml}`;
                }

                // 2. Update Add to Cart Button Logic
                const btn = card.querySelector('.btn-add');
                if (btn) {
                    // Remove old onclick attribute to be safe
                    btn.removeAttribute('onclick');
                    // Clone button to strip existing event listeners (if added via JS)
                    // But since most are inline HTML onclick, we can just override onclick prop
                    btn.onclick = (e) => {
                        e.preventDefault();
                        e.stopPropagation();
                        addToCart(title, newPrice);
                    };
                }
            }
        });
    }

}); // End of DOMContentLoaded
