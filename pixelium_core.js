console.log("Pixelium System Online V11 FORCE REFRESH");

const firebaseConfig = {
    apiKey: "AIzaSyCANk2vWDYkiZXnpwkufTgRrbSqGJhAHNI",
    authDomain: "pixelium-7f62b.firebaseapp.com",
    projectId: "pixelium-7f62b",
    storageBucket: "pixelium-7f62b.firebasestorage.app",
    messagingSenderId: "789885259306",
    appId: "1:789885259306:web:a2dd636e96f6abb863bd53",
    measurementId: "G-XZ79GZYR6F"
};

// --- GLOBAL STATE ---
let hiddenProducts = [];
let customProducts = [];

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

// --- AUTH LOGIC ---
// --- SPA NAVIGATION LOGIC ---
// --- SPA NAVIGATION LOGIC ---
window.navigateTo = function (viewName, pushHistory = true) {
    // 1. Hide all views
    const views = document.querySelectorAll('.spa-view');
    views.forEach(el => el.style.display = 'none');

    // 2. Show target view
    const target = document.getElementById(`view-${viewName}`);
    if (target) {
        target.style.display = 'block';
        window.scrollTo(0, 0); // Scroll to top of the NEW view

        // 3. Update History (Browser Back Button Support)
        if (pushHistory) {
            history.pushState({ view: viewName }, '', `#${viewName}`);
        }
    } else {
        console.error(`View not found: view-${viewName}`);
        // Fallback: Show Home
        const home = document.getElementById('view-home');
        if (home) home.style.display = 'block';
    }

    // 4. Close Mobile Menu if open
    const navLinks = document.querySelector('.nav-links');
    if (navLinks && navLinks.classList.contains('active')) {
        navLinks.classList.remove('active');
    }

    return false; // Prevent default link behavior
};

window.scrollToSection = function(sectionId) {
    console.log("Scrolling to section:", sectionId);
    // 1. If we are NOT in the home view, go there first
    const homeView = document.getElementById('view-home');
    if (!homeView || homeView.style.display === 'none') {
        window.navigateTo('home');
        // Wait a bit longer for the view to be fully visible
        setTimeout(() => performScroll(sectionId), 300);
    } else {
        performScroll(sectionId);
    }

    function performScroll(id) {
        const element = document.getElementById(id);
        if (element) {
            console.log("Element found, performing scroll...");
            element.scrollIntoView({ behavior: 'smooth', block: 'start' });
        } else {
            console.warn("Element not found:", id);
        }
    }
};

// Handle Browser Back Button
window.addEventListener('popstate', (event) => {
    if (event.state && event.state.view) {
        window.navigateTo(event.state.view, false);
    } else {
        // If no state (e.g., initial load popped), go home
        window.navigateTo('home', false);
    }
});

// INITIALIZATION: Show Home by default and SET BASE HISTORY
document.addEventListener('DOMContentLoaded', () => {
    const hash = window.location.hash.replace('#', '');

    if (hash) {
        // If user loads with #products, we render products
        // AND we replace the current history entry to match.
        history.replaceState({ view: hash }, '', `#${hash}`);
        window.navigateTo(hash, false);
    } else {
        // If user loads root /, we render home
        // AND we replace the current history entry so "Back" works later.
        history.replaceState({ view: 'home' }, '', '#home');
        window.navigateTo('home', false);
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

// --- SOCIAL LOGIN LOGIC ---
window.signInWithGoogle = () => {
    const provider = new firebase.auth.GoogleAuthProvider();
    auth.signInWithPopup(provider)
        .then(result => {
            handleSocialUser(result.user);
            closeAuthModal();
        })
        .catch(err => {
            console.error(err);
            alert("Error con Google: " + err.message);
        });
};

window.signInWithFacebook = () => {
    const provider = new firebase.auth.FacebookAuthProvider();
    auth.signInWithPopup(provider)
        .then(result => {
            handleSocialUser(result.user);
            closeAuthModal();
        })
        .catch(err => {
            console.error(err);
            alert("Error con Facebook: " + err.message);
        });
};

async function handleSocialUser(user) {
    // Check if user doc exists, if not create it
    const userRef = db.collection('users').doc(user.uid);
    const doc = await userRef.get();
    
    if (!doc.exists) {
        await userRef.set({
            email: user.email,
            role: 'user',
            createdAt: new Date(),
            photoURL: user.photoURL || ''
        });
        console.log("Nuevo usuario social registrado.");
    }
}

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
            const email = document.getElementById('login-email').value.trim().toLowerCase();
            const pass = document.getElementById('login-password').value;
            const errorEl = document.getElementById('login-error');

            // OPTIMIZATION: Set persistence to LOCAL to avoid repeated logins (Fix Quota Error)
            auth.setPersistence(firebase.auth.Auth.Persistence.LOCAL)
                .then(() => {
                    return auth.signInWithEmailAndPassword(email, pass);
                })
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
                            errorEl.innerText = "⚠️ Muchos intentos. Espera un momento.";
                        } else {
                            errorEl.innerText = `Error (${err.code}): ` + err.message;
                        }
                    }
                });
        });
    }

    // Register Action
    const btnRegister = document.getElementById('btn-register-action');
    if (btnRegister) {
        btnRegister.addEventListener('click', () => {
            const email = document.getElementById('register-email').value.trim().toLowerCase();
            const pass = document.getElementById('register-password').value;
            const errorEl = document.getElementById('register-error');

            // Validation (Expanded & Case Insensitive)
            const validDomains = ['@gmail.com', '@outlook.com', '@hotmail.com', '@yahoo.com', '.edu', '@icloud.com'];
            const isValid = validDomains.some(d => email.endsWith(d));

            if (!isValid) {
                if (errorEl) errorEl.innerText = "Solo correos Gmail, Outlook, Hotmail, Yahoo, iCloud o .edu";
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
                    if (errorEl) {
                        if (err.code === 'auth/email-already-in-use') {
                            errorEl.innerText = "⚠️ Este correo ya está registrado via Web o Google.";
                        } else if (err.code === 'auth/weak-password') {
                            errorEl.innerText = "⚠️ La contraseña es muy débil (mínimo 6 caracteres).";
                        } else {
                            errorEl.innerText = `Error (${err.code}): ` + err.message;
                        }
                    }
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
        // Doc removed or not found - Do NOT auto-reset to avoid overwriting existing data if connection flakes
        console.warn("Stock document 'main' not found or permission denied.");
    }
});

// AUTO-REPAIR SYSTEM: Ensures all products have a stock entry
async function repairStockSystem() {
    console.log("Diagnosing stock consistency...");
    try {
        const productsSnap = await db.collection('products').get();
        const stockRef = db.collection('stock').doc('main');
        const stockDoc = await stockRef.get();

        if (!stockDoc.exists) return;
        const stockData = stockDoc.data();
        const updates = {};
        let needsUpdate = false;

        productsSnap.forEach(doc => {
            const p = doc.data();
            const title = p.title;

            // Check if ANY valid key exists (exact, trimmed, or fuzzy)
            let exists = stockData[title] !== undefined || stockData[title.trim()] !== undefined;
            if (!exists) {
                // Try fuzzy check
                const cleanKey = title.replace(/\s+/g, '').toLowerCase();
                if (Object.keys(stockData).some(k => k.replace(/\s+/g, '').toLowerCase() === cleanKey)) {
                    exists = true;
                }
            }

            if (!exists) {
                console.warn(`Reparing missing stock for: ${title}`);
                updates[title] = p.stock || 10; // Default to 10 if unknown
                needsUpdate = true;
            }
        });

        if (needsUpdate) {
            await stockRef.update(updates);
            console.log("Stock system repaired automatically.");
        } else {
            console.log("Stock system is healthy.");
        }
    } catch (e) {
        console.error("Auto-repair failed:", e);
    }
}
// Run repair on boot
setTimeout(repairStockSystem, 3000); // Delay slightly to let auth/init settle

function updateStockUI() {
    // Collect all elements with class 'stock-status'
    const stockElements = document.querySelectorAll('.stock-status');

    stockElements.forEach(el => {
        const key = el.getAttribute('data-stock-key');
        if (!key) return;

        // --- ROBUST STOCK LOOKUP ---
        let stockVal = stockState[key];

        // Fallback 1: Trim (Espacios accidentales)
        if (stockVal === undefined) {
            stockVal = stockState[key.trim()];
        }

        // Fallback 2: Fuzzy Match (Minúsculas y sin espacios)
        if (stockVal === undefined) {
            const cleanKey = key.replace(/\s+/g, '').toLowerCase();
            const foundKey = Object.keys(stockState).find(k => k.replace(/\s+/g, '').toLowerCase() === cleanKey);
            if (foundKey) stockVal = stockState[foundKey];
        }

        if (stockVal !== undefined && stockVal !== null) {
            // Update Text
            el.innerText = stockVal > 0 ? `Stock: ${stockVal}` : 'Sin Stock';

            // Update Classes
            if (stockVal === 0) {
                el.classList.remove('stock-available');
                el.classList.add('stock-out');
            } else {
                el.classList.remove('stock-out');
                el.classList.add('stock-available');
            }

            // Update associated button if ID follows pattern 'btn-[key]' or via closest card
            const card = el.closest('.card');
            if (card) {
                const btn = card.querySelector('button.btn-primary, button.btn-add');
                if (btn) {
                    btn.disabled = stockVal === 0;
                    btn.innerText = stockVal > 0 ? 'Agregar al Carrito' : 'Agotado';
                }
            }
        }
    });
}

async function decrementStock(productName, quantity) {
    // Map product names to keys
    let key = '';
    switch (productName) {
        case 'Canva PRO (Personal)': key = 'canva-pro'; break;
        case 'Panel Canva PRO': key = 'panel-canva'; break;
        case 'Perplexity AI - GPT5': key = 'perplexity'; break;
        case 'Gemini Advanced': key = 'gemini'; break;
        case 'Google One': key = 'google-one'; break;
        case 'CapCut Pro': key = 'capcut'; break;
        default: key = productName; // Use exact name passed from UI (matches database keys)
    }
    console.log(`Intentando decrementar stock de: ${productName} (Clave: ${key})`);

    // Check custom products mapping if needed or use ID based approach in future
    // For now, this covers the hardcoded items.

    if (key) {
        const ref = db.collection('stock').doc('main');
        try {
            await db.runTransaction(async (transaction) => {
                const doc = await transaction.get(ref);
                if (!doc.exists) return; // Should not happen

                const data = doc.data();
                let currentStock = data[key];
                let foundKey = key;

                // 1. First Fallback: Trim
                if (currentStock === undefined && key !== key.trim()) {
                    if (data[key.trim()] !== undefined) {
                        currentStock = data[key.trim()];
                        foundKey = key.trim();
                        key = foundKey;
                    }
                }

                // 2. Strong Fallback: Fuzzy Match (Ignore spaces/case)
                if (currentStock === undefined) {
                    const cleanKey = key.replace(/\s+/g, '').toLowerCase(); // "adobed"
                    const dbKeys = Object.keys(data);
                    for (const k of dbKeys) {
                        if (k.replace(/\s+/g, '').toLowerCase() === cleanKey) {
                            currentStock = data[k];
                            foundKey = k;
                            key = k; // Update to the real DB key
                            break;
                        }
                    }
                }

                if (currentStock === undefined) currentStock = 0;

                if (currentStock >= quantity) {
                    transaction.update(ref, { [key]: currentStock - quantity });
                } else {
                    throw new Error(`Stock insuficiente para ${productName}. Disponible: ${currentStock}`);
                }
            });
            console.log(`Stock decremented in Cloud for ${key}`);
            return true;
        } catch (e) {
            console.error(e);
            // DEBUG DIAGNOSTIC: Show exactly what keys exist in DB vs what we looked for
            let dbKeys = "Uknown";
            try {
                await db.collection('stock').doc('main').get().then(s => {
                    if (s.exists) dbKeys = JSON.stringify(Object.keys(s.data()));
                });
            } catch (err) { }

            alert(`Error de stock: ${e.message}\n\n[DEBUG INFO]\nBuscando Clave: "${key}"\nClaves en Base de Datos: ${dbKeys}`);
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

// --- HELPER: COMPRESS IMAGE TO BASE64 (Database Friendly) ---
function compressImage(file) {
    return new Promise((resolve, reject) => {
        const reader = new FileReader();
        reader.readAsDataURL(file);
        reader.onload = (event) => {
            const img = new Image();
            img.src = event.target.result;
            img.onload = () => {
                const canvas = document.createElement('canvas');
                const MAX_WIDTH = 600; // Small enough for Firestore (1MB limit)
                const scaleSize = MAX_WIDTH / img.width;
                canvas.width = MAX_WIDTH;
                canvas.height = img.height * scaleSize;

                const ctx = canvas.getContext('2d');
                ctx.drawImage(img, 0, 0, canvas.width, canvas.height);

                // Compress to JPEG at 70% quality
                const dataUrl = canvas.toDataURL('image/jpeg', 0.7);
                resolve(dataUrl);
            };
            img.onerror = (err) => reject(err);
        };
        reader.onerror = (err) => reject(err);
    });
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
            floatingCartBtn.style.display = "flex"; // Always show
            /*
            if (count > 0) {
                floatingCartBtn.style.display = "flex";
            } else {
                floatingCartBtn.style.display = "none";
            } 
            */
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

            // --- PRE-OPEN WINDOW REMOVED (V11) ---
            let redirectWindow = null;
            // Popup removed to prevent black screen. Direct redirect will start at the end.

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
                // alert("Paso 1: Iniciando subida...");

                try {
                    const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
                    const customName = `Comprobante_${emailInput.value}_${timestamp}`;

                    const imageUrl = await uploadImageToImgBB(base64Image, customName);

                    // DEBUG TRACE
                    // alert("Paso 2: Imagen subida. Guardando...");

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
                    message += `${card} *Método de Pago:* ${method.toUpperCase()}\n`;
                    // Fix: Check if image is Base64 (starts with data:) DO NOT put in WhatsApp URL
                    if (imageUrl.startsWith('data:')) {
                        message += `${clip} *Comprobante:* (Adjunto en Web/App)\n\n`;
                    } else {
                        message += `${clip} *Comprobante:* ${imageUrl}\n\n`;
                    }
                    message += `${box} *Mis Herramientas de Poder:*\n`;

                    cart.forEach(item => {
                        const qty = item.quantity || 1;
                        message += `- (${qty}) ${item.name} (S/${(item.price * qty).toFixed(2)})\n`;
                    });

                    message += `\n¡Quedo a la espera de mi activación! ${bolt}`;

                    // alert("Paso 3: Redirigiendo a WhatsApp...");

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
                    alert("⚠️ ERROR DE PAGO: " + error.message);
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
            const bannerAdminBtnContainer = document.getElementById('banner-admin-btn-container');

            if (user.email === 'caproprimero@gmail.com') {
                if (adminBtnContainer) adminBtnContainer.style.display = 'block';
                if (stockAdminBtnContainer) stockAdminBtnContainer.style.display = 'block';
                if (productsAdminBtnContainer) productsAdminBtnContainer.style.display = 'block';
                if (pricesAdminBtnContainer) pricesAdminBtnContainer.style.display = 'block';
                if (themesAdminBtnContainer) themesAdminBtnContainer.style.display = 'block';
                if (bannerAdminBtnContainer) bannerAdminBtnContainer.style.display = 'block';
            } else {
                if (adminBtnContainer) adminBtnContainer.style.display = 'none';
                if (stockAdminBtnContainer) stockAdminBtnContainer.style.display = 'none';
                if (productsAdminBtnContainer) productsAdminBtnContainer.style.display = 'none';
                if (pricesAdminBtnContainer) pricesAdminBtnContainer.style.display = 'none';
                if (themesAdminBtnContainer) themesAdminBtnContainer.style.display = 'none';
                if (bannerAdminBtnContainer) bannerAdminBtnContainer.style.display = 'none';
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

            // CACHE ORDERS GLOBALLY FOR VOUCHER LOOKUP
            window.adminOrdersCache = orders;

            renderAdminOrders(orders);
        } catch (error) {
            console.error("Error fetching all orders:", error);
            adminOrdersList.innerHTML = `<p class="no-orders" style="color:red;">Error: ${error.message}<br><small>Verifica permisos en Firebase Console</small></p>`;
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
                    <a href="#" onclick="viewVoucher('${order.id}'); return false;" style="color: var(--neon-cyan); text-decoration: none; font-size: 0.9rem;">📎 Ver Comprobante</a>
                    <div class="order-total">Total: S/${order.total.toFixed(2)}</div>
                </div>
                ${isPending ? `<button class="btn-deliver" onclick="updateOrderStatus('${order.id}', 'Entregado')" style="width:100%; margin-top:10px; padding:8px; background:#00ff88; color:#000; border:none; border-radius:4px; font-weight:bold; cursor:pointer;">✅ Marcar como Entregado</button>` : ''}
            `;
            adminOrdersList.appendChild(orderCard);
        });
    }

    // --- FIX: LIGHTBOX FOR VOUCHERS (Prevents about:blank) ---
    window.viewVoucher = (orderId) => {
        const order = window.adminOrdersCache ? window.adminOrdersCache.find(o => o.id === orderId) : null;
        const base64 = order ? order.voucher : null;

        if (!base64) return alert("No hay comprobante disponible o error de carga.");

        const lightbox = document.getElementById('lightbox');
        const lightboxImg = document.getElementById('lightbox-img');

        if (lightbox && lightboxImg) {
            lightboxImg.src = base64;
            lightbox.style.display = 'flex';
        } else {
            alert("Error crítico: Elemento visor no encontrado. Recarga la página.");
        }
    };

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

        // FILTER 1: Exclude HIDDEN products (User considers them "not in catalog")
        // FILTER 2: Exclude GHOSTS (Items with "(Original)" suffix created by old sync)

        const visibleProducts = customProducts.filter(p => {
            const isHidden = hiddenProducts.includes(p.title);
            const isGhost = p.title.includes('(Original)');
            return !isHidden && !isGhost;
        });

        // Sort products alphabetically
        const sortedProducts = [...visibleProducts].sort((a, b) => a.title.localeCompare(b.title));

        if (sortedProducts.length === 0) {
            stockListContainer.innerHTML = '<p style="color:#888;">No hay productos visibles.</p>';
            return;
        }

        sortedProducts.forEach(prod => {
            const title = prod.title;
            const val = stockState[title] !== undefined ? stockState[title] : (prod.stock || 0);

            const row = document.createElement('div');
            row.style.cssText = "display: flex; justify-content: space-between; align-items: center; margin-bottom: 15px; padding-bottom: 15px; border-bottom: 1px solid rgba(255,255,255,0.1);";
            row.innerHTML = `
            <span class="stock-item-name" style="font-weight: bold; color: white;">${title}</span>
            <input type="number" class="stock-input" data-key="${title}" value="${val}" min="0" style="width: 80px; padding: 8px; border-radius: 6px; border: 1px solid #39ff14; background: rgba(0,0,0,0.5); color: white; font-size: 1rem; text-align: center;">
            `;
            stockListContainer.appendChild(row);
        });
    }

    // --- PRODUCT ASSASSIN (DELETE GHOST DOCUMENTS) ---
    // Deletes actual product documents that are known garbage/duplicates
    (async function () {
        // Wait for customProducts to load
        setTimeout(async () => {
            if (!customProducts || customProducts.length === 0) return;

            const batch = db.batch();
            let count = 0;

            customProducts.forEach(p => {
                const titleLower = p.title.toLowerCase();
                let shouldDelete = false;

                // 1. Delete "Original" duplicates (e.g. "Perplexity... (Original)")
                if (p.title.includes('(Original)')) shouldDelete = true;

                // 2. Specific Trash List (Observed in screenshot)
                // "Netflix" (if lowercase or generic "netflix" vs "Netflix") -> Be careful.
                // "Perplexity AI - GPT5" -> If "Perplexity AI - GPT5 (Original)" exists, delete the Original.
                // If "Perplexity AI - GPT5" is also unwanted? User said "not in catalog".
                // We trust the "Original" tag is the main culprit.

                if (shouldDelete) {
                    console.log(`💀 PRODUCT ASSASSIN: Marking '${p.title}' (ID: ${p.id}) for deletion.`);
                    const ref = db.collection('products').doc(p.id);
                    batch.delete(ref);
                    count++;
                }
            });

            if (count > 0) {
                console.log(`💀 COMMITTING PRODUCT GENOCIDE: ${count} items.`);
                await batch.commit();
                console.log("💀 DONE.");
                // Reload to reflect changes
                setTimeout(() => window.location.reload(), 2000);
            }
        }, 3000); // 3s delay to ensure load
    })();

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
    // Actually, migration of customProducts to Firestore

    // 1. Initialization: Listen to Firestore
    // 1. Initialization: Listen to Firestore
    // 1. Initialization: Listen to Firestore
    let hasSynced = false; // PREVENT INFINITE LOOP
    function initProductSystem() {
        db.collection('products').onSnapshot(snapshot => {
            const products = [];
            snapshot.forEach(doc => {
                products.push({ id: doc.id, ...doc.data() });
            });
            customProducts = products;

            // Hide Loading Indicator
            const loader = document.getElementById('loading-catalog');
            if (loader) loader.remove();

            // Populate Carousel
            renderCarousel(customProducts);

            // Routing Check: Auto-open product if URL has ?view=ID
            const urlParams = new URLSearchParams(window.location.search);
            const viewId = urlParams.get('view');
            if (viewId) {
                setTimeout(() => filterGridByProduct(viewId), 500); // Small delay to ensure DOM is ready
            }

            // --- REAL AUTO-RECOVERY FROM STOCK (REQUESTED BY USER) ---
            // PURGE MODE: Run once on load to clean up specific ghosts
            if (!hasSynced) {
                setTimeout(purgeGhostsOnce, 3000); // Wait for stock to load
                hasSynced = true;
            }

            async function purgeGhostsOnce() {
                console.log("🧹 STARTING GHOST PURGE SCANN...");

                const deletePromises = [];
                customProducts.forEach(p => {
                    // ROBUST CLEANUP: Delete by Image or Description Signature
                    // This catches ALL auto-generated copies regardless of name
                    // Added .includes checks for safety
                    if ((p.image && p.image === 'IMAGEN_PARA_REPARAR.png') ||
                        (p.desc && p.desc.includes('Producto Recuperado')) ||
                        (p.note && p.note === 'Recuperado de Stock') ||
                        p.title.includes('(Original)')) {

                        console.log("🔥 PURGING GHOST/COPY: ", p.title);
                        deletePromises.push(db.collection('products').doc(p.id).delete());
                    }
                });

                if (deletePromises.length > 0) {
                    await Promise.all(deletePromises);
                    console.log("✅ PURGE COMPLETE. DELETED " + deletePromises.length + " GHOSTS.");
                } else {
                    console.log("✨ SYSTEM CLEAN. NO GHOSTS FOUND.");
                }

                // --- NO CREATION LOGIC HERE ---
                // The Auto-Recovery loop is completely removed to prevent regeneration.
            }
            // -------------------------------------

            // Re-render
            document.querySelectorAll('.card[id^="custom_"]').forEach(e => e.remove());
            renderCustomProductsOnGrid();
            applyProductVisibility();

            // If admin modal open, refresh list
            if (productModal.style.display === 'block') {
                renderAdminProductList();
            }
        }, (error) => {
            console.error("Error products listener:", error);
        });
    }

    // Call on load
    initProductSystem();

    function initVisibilitySystem() {
        db.collection('settings').doc('visibility').onSnapshot(doc => {
            if (doc.exists) {
                hiddenProducts = doc.data().hidden || [];
            } else {
                db.collection('settings').doc('visibility').set({ hidden: [] });
            }
            if (typeof applyProductVisibility === 'function') applyProductVisibility();
            const modal = document.getElementById('product-modal');
            if (typeof renderAdminProductList === 'function' && modal && modal.style.display === 'block') {
                renderAdminProductList();
            }
        });
    }
    initVisibilitySystem();

    if (btnProductsAdmin) {
        btnProductsAdmin.addEventListener('click', () => {
            productModal.style.display = 'block';
            renderAdminProductList();
            switchProductTabV2('add');
        });
    }

    if (closeProductModalBtn) {
        closeProductModalBtn.addEventListener('click', () => {
            productModal.style.display = 'none';
        });
    }

    // Tab Switcher
    // Tab Switcher V2
    // Tab Switcher V2
    window.switchProductTabV2 = (tab) => {
        const btns = document.querySelectorAll('.auth-tabs .tab-btn');
        btns.forEach(btn => {
            btn.classList.remove('active');
            btn.style.background = ''; // Reset inline background
            btn.style.color = '';
        });

        const tabAdd = document.getElementById('product-tab-add');
        const tabList = document.getElementById('product-tab-list');
        const tabEdit = document.getElementById('product-tab-edit');

        // Hide all
        if (tabAdd) tabAdd.style.display = 'none';
        if (tabList) tabList.style.display = 'none';
        if (tabEdit) tabEdit.style.display = 'none';

        if (tab === 'add') {
            btns[0].classList.add('active');
            if (tabAdd) tabAdd.style.display = 'block';
        } else if (tab === 'list') {
            btns[1].classList.add('active');
            if (tabList) tabList.style.display = 'block';
            renderAdminProductList();
        } else if (tab === 'edit') {
            btns[2].classList.add('active');
            // Explicitly style the active Edit button for visibility
            btns[2].style.background = '#00e5ff';
            btns[2].style.color = 'black';

            if (tabEdit) tabEdit.style.display = 'block';
            loadProductsToEditSelector();
        }
    };

    function loadProductsToEditSelector() {
        const selector = document.getElementById('edit-prod-selector');
        selector.innerHTML = '<option value="">-- Selecciona --</option>';
        customProducts.forEach(p => {
            const opt = document.createElement('option');
            opt.value = p.id;
            opt.innerText = p.title;
            selector.appendChild(opt);
        });
    }

    // --- CHANGE LISTENER FOR EDIT SELECTOR ---
    const editSelector = document.getElementById('edit-prod-selector');
    if (editSelector) {
        editSelector.addEventListener('change', (e) => {
            const prodId = e.target.value;
            const container = document.getElementById('edit-form-container');

            if (!prodId) {
                container.style.display = 'none';
                return;
            }

            const prod = customProducts.find(p => p.id === prodId);
            if (prod) {
                container.style.display = 'block';
                document.getElementById('edit-prod-name').value = prod.title || '';
                document.getElementById('edit-prod-desc').value = prod.desc || '';
                document.getElementById('edit-prod-warranty').value = prod.warranty || '';
                document.getElementById('edit-prod-badge').value = prod.badge || '';
                document.getElementById('edit-prod-note').value = prod.note || '';
                
                // Reset image input and preview
                const imgInput = document.getElementById('edit-prod-img');
                if (imgInput) imgInput.value = '';
                const previewCont = document.getElementById('edit-img-preview-container');
                if (previewCont) previewCont.style.display = 'none';
            }
        });
    }

    // --- SAVE EDIT BTN ---
    const btnSaveEdit = document.getElementById('btn-save-edit');
    if (btnSaveEdit) {
        btnSaveEdit.addEventListener('click', async () => {
            const prodId = document.getElementById('edit-prod-selector').value;
            if (!prodId) return;

            btnSaveEdit.innerText = "Guardando...";
            btnSaveEdit.disabled = true;

            const updates = {
                title: document.getElementById('edit-prod-name').value,
                desc: document.getElementById('edit-prod-desc').value,
                warranty: document.getElementById('edit-prod-warranty').value,
                badge: document.getElementById('edit-prod-badge').value,
                note: document.getElementById('edit-prod-note').value
            };

            const imgInput = document.getElementById('edit-prod-img');

            try {
                // If a NEW image is selected, process it
                if (imgInput && imgInput.files[0]) {
                    btnSaveEdit.innerText = "Procesando imagen...";
                    const base64Image = await compressImage(imgInput.files[0]);
                    
                    if (base64Image.length > 900000) {
                        throw new Error("Imagen muy pesada. Intenta con otra.");
                    }
                    updates.image = base64Image;
                }

                await db.collection('products').doc(prodId).update(updates);

                alert("¡Información Actualizada! ✅");
                btnSaveEdit.innerText = "💾 Guardar Cambios de Info";
                btnSaveEdit.disabled = false;

                // Refresh list if user goes back to list tab
                renderCustomProductsOnGrid();

            } catch (err) {
                alert("Error: " + err.message);
                btnSaveEdit.innerText = "💾 Guardar Cambios de Info";
                btnSaveEdit.disabled = false;
            }
        });
    }

    // --- LOGIC: CREATE PRODUCT ---
    if (btnCreateProduct) {
        btnCreateProduct.addEventListener('click', async () => {
            const title = document.getElementById('new-prod-name').value;
            const price = document.getElementById('new-prod-price').value;
            const imgInput = document.getElementById('new-prod-img');

            if (!title || !price || !imgInput.files[0]) {
                return alert("Nombre, Precio e Imagen son obligatorios.");
            }

            try {
                btnCreateProduct.innerText = "Procesando imagen (Modo Base64)...";
                btnCreateProduct.disabled = true;

                const imgFile = imgInput.files[0];

                // COMPRESS IMAGE TO BASE64 (No Server Required)
                const base64Image = await compressImage(imgFile);

                // Check size safety (approx)
                if (base64Image.length > 900000) { // ~900KB
                    throw new Error("Imagen muy compleja incluso comprimida. Usa una más simple.");
                }

                const prodId = 'custom_' + Date.now();
                const trimmedTitle = title.trim();
                const newProduct = {
                    id: prodId,
                    title: trimmedTitle,
                    desc: document.getElementById('new-prod-desc').value,
                    price: parseFloat(price),
                    priceAlt: document.getElementById('new-prod-price-alt').value,
                    stock: parseInt(document.getElementById('new-prod-stock').value) || 10,
                    warranty: document.getElementById('new-prod-warranty').value,
                    image: base64Image, // SAVED DIRECTLY IN DB
                    badge: document.getElementById('new-prod-badge').value,
                    note: document.getElementById('new-prod-note').value
                };

                // Save to Firestore
                await db.collection('products').doc(prodId).set(newProduct);

                // Initialize stock
                await db.collection('stock').doc('main').set({
                    [trimmedTitle]: newProduct.stock
                }, { merge: true });

                alert("¡Producto Creado! (Guardado en Base de Datos) 💾✨");

                // Reset form
                document.getElementById('new-prod-name').value = '';
                document.getElementById('new-prod-desc').value = '';
                document.getElementById('new-prod-price').value = '';
                document.getElementById('new-prod-img').value = '';
                btnCreateProduct.innerText = "✨ Crear Producto";
                btnCreateProduct.disabled = false;

            } catch (error) {
                console.error("Save failed:", error);
                alert("Error: " + error.message);
                btnCreateProduct.innerText = "✨ Crear Producto";
                btnCreateProduct.disabled = false;
            }
        });
    }



    // --- LOGIC: VISIBILITY (MASKING) REVERTED ---
    function applyProductVisibility() {
        document.querySelectorAll('.card').forEach(card => {
            const titleEl = card.querySelector('h3');
            if (!titleEl) return;

            const title = titleEl.innerText.trim();
            // const isCustom = card.id.startsWith('custom_'); // REMOVED

            // 1. Hide ONLY if explicitly hidden by Admin
            if (hiddenProducts.includes(title)) {
                card.style.display = 'none';
                const customExists = customProducts.some(p => p.title === title);
                if (customExists) {
                    card.style.display = 'none'; // Hide static, show custom instead
                    return;
                }
            }

            // Otherwise show
            if (card.style.display === 'none') card.style.display = '';
        });
    }

    // --- LOGIC: RENDER CUSTOMS ON GRID ---
    function renderCustomProductsOnGrid() {
        const grid = document.querySelector('.services-grid');
        if (!grid) return;

        // CRITICAL: Clear grid to remove Loader and prevent duplicates
        grid.innerHTML = "";


        customProducts.forEach(prod => {
            // Deduplication Logic REMOVED (Static HTML deleted, so DB is source of truth)

            if (document.getElementById(prod.id)) return;

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
                <img src="${prod.image}" alt="${prod.title}" class="product-img" onerror="this.onerror=null; this.src='logo.png';">
            </div>
            <h3>${prod.title}</h3>
            ${prod.desc ? `<p>${prod.desc}</p>` : ''}
            
            <div id="stock-${prod.id}" class="stock-status ${stockClass}" data-stock-key="${prod.title}">${stockText}</div>
            
            ${prod.badge ? `<p class="gold-text">${prod.badge}</p>` : ''}
            ${prod.note ? `<p class="activation-note">${prod.note}</p>` : ''}
            
            ${prod.warranty ? `
            <div class="warranty-info">
                <i class="fas fa-star warranty-star"></i>
                <span>${prod.warranty}</span>
            </div>` : ''}
            
            <div class="price-tag">S/${prod.price.toFixed(2)}</div>
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

        // Apply price overrides after rendering to prevent reversion
        if (typeof applyPriceOverrides === 'function') {
            applyPriceOverrides();
        }
    }

    // --- CAROUSEL RENDER LOGIC ---
    // --- CAROUSEL RENDER LOGIC ---
    // --- BRAND MAP (Global for reuse) ---
    // --- BRAND MAP (Global for reuse) ---
    const brandMap = {
        "adobe": "adobe",
        "canva": "canva",
        "chatgpt": "chatgpt",
        "crunchyroll": "crunchyroll",
        "gemini": "gemini",
        "google": "gogleone",
        "one": "gogleone",
        "hbo": "hbo",
        "netflix": "netflix",
        "paramount": "paramount",
        "perplexity": "perplexity",
        "spotify": "spotify",
        "youtube": "youtube",
        "capcut": "capcutpro",
        "disney": "disney",
        "prime": "primevideo",
        "amazon": "primevideo"
    };

    // --- CAROUSEL RENDER LOGIC ---
    function renderCarousel(products) {
        // Target ALL carousel tracks (Home and Products view)
        const tracks = document.querySelectorAll('.brand-carousel');
        if (tracks.length === 0) return;

        // Clear all tracks
        tracks.forEach(t => t.innerHTML = '');

        // Deduplication Logic: Show only ONE item per Brand
        const renderedBrands = new Set();
        const uniqueItems = [];

        products.forEach(p => {
            const titleLower = p.title.toLowerCase();
            // Find brand key
            const brandKey = Object.keys(brandMap).find(k => titleLower.includes(k));

            if (brandKey) {
                if (!renderedBrands.has(brandMap[brandKey])) { // Check against TARGET VALUE to avoid Prime/Amazon dupes
                    renderedBrands.add(brandMap[brandKey]);
                    // Store the brand key on the product object loosely for rendering
                    p._brandKey = brandMap[brandKey];
                    p._rawBrandKey = brandKey;
                    uniqueItems.push(p);
                }
            } else {
                // If no brand match, keep it
                uniqueItems.push(p);
            }
        });

        // Flatten logic: Double the list
        const allItems = [...uniqueItems, ...uniqueItems];
        if (uniqueItems.length < 10) allItems.push(...uniqueItems);

        allItems.forEach(p => {
            const item = document.createElement('div');
            item.className = 'carousel-item';

            // ROUTING LOGIC: Filter Grid by BRAND
            const brandKey = p._rawBrandKey;

            item.onclick = () => {
                // FORCE NAVIGATION TO PRODUCTS VIEW
                window.navigateTo('products');

                if (brandKey) {
                    // Update URL for "deep linking" feel (Optional but good)
                    // window.history.pushState({ view: 'products' }, '', `#products?brand=${brandKey}`);

                    filterGridByBrand(brandKey); // Pass the raw key for filtering
                } else {
                    // Fallback for non-branded items
                    filterGridByProduct(p.id);
                }
            };

            const img = document.createElement('img');
            let carouselImgSrc = p.image || 'logo.png';

            // Use Brand Image
            if (p._brandKey) {
                carouselImgSrc = `carrusel/carrucel-${p._brandKey}.png`;
            }

            img.src = carouselImgSrc;
            img.onerror = () => {
                img.src = p.image || 'logo.png';
                img.onerror = () => img.src = 'logo.png';
            };

            item.appendChild(img);

            // Append clone to EACH track
            tracks.forEach(track => {
                // We must clone the item for each track because a node can only exist in one place
                const clone = item.cloneNode(true);
                clone.onclick = item.onclick; // Cloning doesn't copy event listeners, so re-attach? 
                // Wait, cloneNode doesn't copy listeners. We need to attach listener to clone.

                clone.onclick = () => {
                    // FORCE NAVIGATION TO PRODUCTS VIEW
                    window.navigateTo('products');

                    if (brandKey) {
                        filterGridByBrand(brandKey);
                    } else {
                        filterGridByProduct(p.id);
                    }
                };

                track.appendChild(clone);
            });
        });
    }

    // --- FILTER GRID BY BRAND (SHOW VARIATIONS) ---
    window.filterGridByBrand = (brandKey) => {
        const grid = document.querySelector('.services-grid');
        if (!grid) return;

        // 1. Clear Grid
        grid.innerHTML = '';

        // 2. Find ALL matched products
        const matches = customProducts.filter(p => p.title.toLowerCase().includes(brandKey.toLowerCase()));



        if (matches.length === 0) {
            grid.innerHTML = '<p style="grid-column: 1/-1; text-align: center;">No hay productos disponibles para esta marca.</p>';
            return;
        }

        // 3. Update Header
        const sectionTitle = document.querySelector('.section-title');
        const brandName = brandKey.charAt(0).toUpperCase() + brandKey.slice(1);
        if (sectionTitle) sectionTitle.innerHTML = `Explorando: <span style="color:var(--neon-cyan)">${brandName}</span>`;

        // 4. Render Standard Cards for matches
        matches.forEach(prod => {
            const card = document.createElement('div');
            card.className = 'card';
            card.id = prod.id;

            // Stock Logic
            const currentStock = stockState[prod.title] !== undefined ? stockState[prod.title] : prod.stock;
            const stockClass = currentStock > 0 ? 'stock-available' : 'stock-out';
            const stockText = currentStock > 0 ? `Stock: ${currentStock}` : 'Sin Stock';
            const btnState = currentStock > 0 ? '' : 'disabled';
            const btnText = currentStock > 0 ? 'Agregar al Carrito' : 'Agotado';

            // IMAGE LOGIC:
            // 1. Try Specific Image (prod.image)
            // 2. Fallback to Brand (carrusel/...)
            // 3. Fallback to Logo (logo.png)

            let brandIcon = 'logo.png';
            const mapKey = Object.keys(brandMap).find(k => prod.title.toLowerCase().includes(k));
            if (mapKey) {
                brandIcon = `carrusel/carrucel-${brandMap[mapKey]}.png`;
            }

            // OnError Script: If specific image fails, try brand icon. If that fails, show logo.
            const imgOnError = `this.onerror=null; this.src='${brandIcon}'; this.addEventListener('error', function(){this.src='logo.png'});`;

            card.innerHTML = `
                <div class="card-icon">
                    <img src="${prod.image}" alt="${prod.title}" class="product-img" onerror="${imgOnError}">
                </div>
                <h3>${prod.title}</h3>
                ${prod.desc ? `<p>${prod.desc}</p>` : ''}
                
                <div id="stock-${prod.id}" class="stock-status ${stockClass}" data-stock-key="${prod.title}">${stockText}</div>
                
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

            // Click image to detail
            const newImg = card.querySelector('.product-img');
            newImg.addEventListener('click', () => {
                filterGridByProduct(prod.id);
            });

            grid.appendChild(card);
        });

        // Add Back Button
        const backBtnContainer = document.createElement('div');
        backBtnContainer.style.gridColumn = "1 / -1";
        backBtnContainer.style.textAlign = "center";
        backBtnContainer.style.marginTop = "30px";
        backBtnContainer.innerHTML = `
            <button onclick="restoreFullCatalog()" class="btn-secondary" style="background:transparent; color:#00f3ff; border:1px solid #00f3ff; padding:10px 30px; border-radius:30px; cursor:pointer; font-weight:bold; transition:all 0.3s;">
                ⬅ Regresar al Catálogo
            </button>
        `;
        grid.appendChild(backBtnContainer);

        // Scroll
        grid.scrollIntoView({ behavior: 'smooth', block: 'start' });

        // Apply price overrides after rendering (REMOVED: System unified with products DB)
    };

    // --- FILTER GRID LOGIC (ROUTING VIEW) ---
    // --- FILTER GRID LOGIC (ROUTING VIEW) ---
    window.filterGridByProduct = (prodId) => {
        const grid = document.querySelector('.services-grid');
        if (!grid) return;

        // 1. Clear Grid
        grid.innerHTML = '';

        // 2. Find target product
        const target = customProducts.find(p => p.id === prodId);

        if (!target) {
            grid.innerHTML = '<p style="grid-column: 1/-1; text-align: center;">Producto no encontrado.</p>';
            return;
        }

        // 3. Update Header
        const sectionTitle = document.querySelector('.section-title');
        if (sectionTitle) sectionTitle.innerHTML = `Viendo: <span style="color:var(--neon-cyan)">${target.title}</span>`;

        const p = target;
        let displayImage = p.image || 'logo.png';


        // FIX: Define imgOnError which was missing
        let brandIconForError = 'logo.png';
        const brandKey = Object.keys(brandMap).find(k => p.title.toLowerCase().includes(k));
        if (brandKey) {
            brandIconForError = `carrusel/carrucel-${brandMap[brandKey]}.png`;
        }
        const imgOnError = `this.onerror=null; this.src='${brandIconForError}'; this.addEventListener('error', function(){this.src='logo.png'});`;

        // 4. Render SINGLE Card
        const cardClass = p.isSpecial ? `card ${p.specialClass || 'special-card'}` : 'card';
        const badgeHtml = p.badge ? `<p class="gold-text">${p.badge}</p>` : '';
        const noteHtml = p.note ? `<p class="activation-note">${p.note}</p>` : '';
        const priceAltHtml = p.priceAlt ? `<span class="price-alt">($${p.priceAlt})</span>` : '';
        const pid = p.id;

        const html = `
            <div class="${cardClass}" style="margin: 0 auto; max-width: 500px; grid-column: 1 / -1; position: relative; overflow: hidden;">
                <!-- Glowing Backdrop for filtered view -->
                <div style="position: absolute; top:0; left:0; width:100%; height:100%; background: radial-gradient(circle at center, rgba(0,243,255,0.1) 0%, transparent 70%); pointer-events:none;"></div>
                
                <div class="card-icon" style="height: auto; min-height: 300px; padding: 20px; background: rgba(0, 0, 0, 0.4);">
                    <img src="${displayImage}" alt="${p.title}" class="product-img" style="object-fit: contain; max-height: 400px; cursor: pointer;" onerror="${imgOnError}">
                </div>
                <h3>${p.title}</h3>
                
                ${p.isSpecial ? `
                    <div class="card-content">
                            <p class="highlight-text">${p.description}</p>
                            ${p.id === 'canva-pro' || p.title === 'Canva PRO' ? `
                            <ul class="price-list">
                                <li>✨ 1 año por <strong>S/10 soles</strong> (3 personas)</li>
                                <li>✨ 1 año por <strong>S/15 soles</strong> (1 persona)</li>
                            </ul>` : ''}
                            ${p.id === 'panel-canva' || p.title === 'Panel Canva PRO' ? `
                            <ul class="feature-list">
                                <li>🔥 Administra tu propio panel</li>
                                <li>✅ Activación a tu correo</li>
                                <li>⚡ Garantía total</li>
                            </ul>` : ''}
                ` : `
                    <p>${p.description}</p>
                `}
                
                ${p.isSpecial ? '</div>' : ''} 

                <div id="stock-${pid}" class="stock-status stock-available" data-stock-key="${target.title.trim()}">
                    VERIFICANDO STOCK...
                </div>

                ${badgeHtml}
                ${noteHtml}

                <div class="warranty-info">
                    <i class="fas fa-star warranty-star"></i>
                    <span>${p.warranty}</span>
                </div>

                ${p.isSpecial ? '' : `<div class="price-tag">S/${p.price.toFixed(2)} ${priceAltHtml}</div>`}
                
                ${p.id === 'panel-canva' || p.title === 'Panel Canva PRO' ? `<div class="price-tag">S/${p.price.toFixed(2)} ${priceAltHtml}</div>` : ''}

                <button id="btn-${pid}" class="btn-primary btn-add" style="width:100%; margin-top:15px; font-size:1.1rem;"
                    onclick="addToCart('${p.title}', ${p.price})">
                    Agregar al Carrito
                </button>
            </div>

            <div style="grid-column: 1 / -1; text-align: center; margin-top: 30px;">
                <button onclick="restoreFullCatalog()" class="btn-secondary" style="background:transparent; color:#00f3ff; border:1px solid #00f3ff; padding:10px 30px; border-radius:30px; cursor:pointer; font-weight:bold; transition:all 0.3s;">
                    ⬅ Regresar al Catálogo
                </button>
            </div>
        `;

        grid.innerHTML = html;

        // Trigger Stock Update for single item
        setTimeout(updateStockUI, 500);

        // ENABLE LIGHTBOX (Zoom) logic for this single view
        const singleImg = grid.querySelector('.product-img');
        if (singleImg) {
            singleImg.addEventListener('click', () => {
                const lightbox = document.getElementById('lightbox');
                const lightboxImg = document.getElementById('lightbox-img');
                if (lightbox && lightboxImg) {
                    lightbox.style.display = "block";
                    lightboxImg.src = singleImg.src;
                }
            });
        }

        // Scroll to grid
        grid.scrollIntoView({ behavior: 'smooth', block: 'start' });

        // Apply price overrides after rendering
        if (typeof applyPriceOverrides === 'function') {
            applyPriceOverrides();
        }
    };

    window.restoreFullCatalog = () => {
        // Clear URL param
        const newUrl = window.location.pathname;
        window.history.pushState({ path: newUrl }, '', newUrl);

        // Reset Title
        const sectionTitle = document.querySelector('.section-title');
        if (sectionTitle) sectionTitle.innerText = "Nuestros Productos";

        // Re-render Full Grid
        const grid = document.querySelector('.services-grid');
        if (grid) grid.innerHTML = '';
        renderCustomProductsOnGrid();
    };

    // Listen for PopState (Browser Back Button)
    window.addEventListener('popstate', () => {
        const urlParams = new URLSearchParams(window.location.search);
        const viewId = urlParams.get('view');
        if (viewId) {
            filterGridByProduct(viewId);
        } else {
            restoreFullCatalog();
        }
    });

    // --- LOGIC: ADMIN LIST ---
    // Local renderAdminProductList removed to use Global Fix


    // --- LOGIC: EDIT DESCRIPTION ---
    window.editProductDesc = async (id, oldDesc) => {
        const newDesc = prompt("Editar Descripción:", oldDesc);
        if (newDesc !== null && newDesc !== oldDesc) {
            try {
                await db.collection('products').doc(id).update({ desc: newDesc });
                alert("¡Descripción actualizada! 📝✅");
                // The onSnapshot listener will automatically refresh the list
            } catch (error) {
                console.error("Error updating description:", error);
                alert("Error al actualizar: " + error.message);
            }
        }
    };
    // Braces fixed
    // Brace removed


    window.uploadRepairImage = (index, prodId) => {
        const user = firebase.auth().currentUser;
        if (!user) {
            alert("⚠️ Error: No has iniciado sesión.");
            return;
        }

        const fileInput = document.getElementById(`repair - file - ${index} `);
        const file = fileInput.files[0];
        if (!file) return;

        const btn = fileInput.nextElementSibling;
        const originalText = btn.innerText;
        btn.innerText = "⏳ Procesando...";
        btn.disabled = true;

        // V10 Logic: Canvas Resize + Base64 -> Firestore Direct
        const reader = new FileReader();
        reader.onload = function (e) {
            const img = new Image();
            img.onload = function () {
                const canvas = document.createElement('canvas');
                const ctx = canvas.getContext('2d');

                // Resize logic (Max 600px)
                const MAX_WIDTH = 600;
                const MAX_HEIGHT = 600;
                let width = img.width;
                let height = img.height;

                if (width > height) {
                    if (width > MAX_WIDTH) {
                        height *= MAX_WIDTH / width;
                        width = MAX_WIDTH;
                    }
                } else {
                    if (height > MAX_HEIGHT) {
                        width *= MAX_HEIGHT / height;
                        height = MAX_HEIGHT;
                    }
                }

                canvas.width = width;
                canvas.height = height;
                ctx.drawImage(img, 0, 0, width, height);

                const dataUrl = canvas.toDataURL('image/jpeg', 0.7);

                if (dataUrl.length > 800000) {
                    alert("❌ Imagen muy pesada/compleja. Usa una más simple.");
                    btn.innerText = "❌ Muy pesada";
                    setTimeout(() => { btn.innerText = originalText; btn.disabled = false; }, 2000);
                    return;
                }

                btn.innerText = "⏳ Guardando (V10)...";

                db.collection('products').doc(prodId).update({ image: dataUrl })
                    .then(() => {
                        alert("✅ ¡ÉXITO V10! Imagen reparada.");
                        fileInput.value = '';
                        btn.innerText = "✅ Listo";
                        setTimeout(() => { btn.innerText = originalText; btn.disabled = false; }, 2000);
                    })
                    .catch((error) => {
                        console.error("Error updating document: ", error);
                        alert("❌ Error: " + error.message);
                        btn.innerText = "❌ Error";
                        setTimeout(() => { btn.innerText = originalText; btn.disabled = false; }, 2000);
                    });
            };
            img.src = e.target.result;
        };
        reader.readAsDataURL(file);
    };

    window.toggleProductVisibility = (title) => {
        let updatedList = [...hiddenProducts];
        if (updatedList.includes(title)) {
            updatedList = updatedList.filter(t => t !== title);
        } else {
            updatedList.push(title);
        }
        db.collection('settings').doc('visibility').set({ hidden: updatedList }, { merge: true });
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

    // --- PRICE MANAGER LOGIC (UNIFIED WITH PRODUCTS) ---
    const priceModal = document.getElementById('price-modal');
    const btnPricesAdmin = document.getElementById('btn-prices-admin');
    const closePriceModalBtn = document.querySelector('.close-price-modal');
    const btnSavePrices = document.getElementById('btn-save-prices');
    const priceAdminList = document.getElementById('price-admin-list');

    if (btnPricesAdmin) {
        btnPricesAdmin.addEventListener('click', () => {
            priceModal.style.display = 'block';
            renderPriceManager();
        });
    }

    if (closePriceModalBtn) {
        closePriceModalBtn.addEventListener('click', () => {
            priceModal.style.display = 'none';
        });
    }

    // --- LOGIC: RENDER ADMIN LIST ---
    function renderPriceManager() {
        if (!priceAdminList) return;
        priceAdminList.innerHTML = '';

        customProducts.forEach(prod => {
            const row = document.createElement('div');
            row.style.cssText = "display: flex; justify-content: space-between; align-items: center; margin-bottom: 15px; padding-bottom: 15px; border-bottom: 1px solid rgba(255,255,255,0.1);";
            row.innerHTML = `
                <span class="stock-item-name" style="font-weight: bold; color: white;">${prod.title}</span>
                <div style="display: flex; align-items: center; gap: 8px;">
                    <span style="color: #00f3ff; font-weight: bold;">S/</span>
                    <input type="number" step="0.50" class="stock-input price-input-field"
                        data-id="${prod.id}"
                        value="${prod.price}"
                        style="width: 100px; padding: 8px; border-radius: 6px; border: 1px solid #00f3ff; background: rgba(0,0,0,0.5); color: white; font-size: 1rem;">
                </div>
            `;
            priceAdminList.appendChild(row);
        });
    }

    if (btnSavePrices) {
        btnSavePrices.addEventListener('click', async () => {
            const inputs = document.querySelectorAll('.price-input-field');
            const originalText = btnSavePrices.innerHTML;
            
            try {
                btnSavePrices.innerText = "Guardando...";
                for (let input of inputs) {
                    const id = input.getAttribute('data-id');
                    const val = parseFloat(input.value);
                    if (!isNaN(val) && id) {
                        await db.collection('products').doc(id).update({ price: val });
                    }
                }
                alert("¡Precios Actualizados Exitosamente! ☁️💰");
                priceModal.style.display = 'none';
            } catch (err) {
                alert("Error: " + err.message);
            } finally {
                btnSavePrices.innerHTML = originalText;
            }
        });
    }

}); // End of DOMContentLoaded

// --- HELPERS ---

window.uploadImageToImgBB = async function (base64Str, name) {
    // POLYFILL: Actually compress and return Base64 (No External API Needed)
    // This solves "undefined" error and keeps data local/free.
    return new Promise((resolve) => {
        const img = new Image();
        img.src = "data:image/jpeg;base64," + base64Str;
        img.onload = () => {
            const canvas = document.createElement('canvas');
            const ctx = canvas.getContext('2d');
            const MAX_WIDTH = 800;
            const MAX_HEIGHT = 800;
            let width = img.width;
            let height = img.height;

            if (width > height) {
                if (width > MAX_WIDTH) {
                    height *= MAX_WIDTH / width;
                    width = MAX_WIDTH;
                }
            } else {
                if (height > MAX_HEIGHT) {
                    width *= MAX_HEIGHT / height;
                    height = MAX_HEIGHT;
                }
            }
            canvas.width = width;
            canvas.height = height;
            ctx.drawImage(img, 0, 0, width, height);
            // Compress to 0.6 quality
            resolve(canvas.toDataURL('image/jpeg', 0.6));
        };
    });
};

// --- FIX: ADMIN LIST RENDERER (Restored & Cleaned) ---
window.renderAdminProductList = function () {
    const list = document.getElementById('product-admin-list');
    if (!list) return;

    list.innerHTML = '';

    // 1. Render STOCK Items (Originals)
    // STEP A: Raw Filter (Garbage)
    let rawKeys = Object.keys(stockState).filter(k =>
        !k.toLowerCase().startsWith('custom_') &&
        k.toLowerCase() !== 'null' &&
        k.trim() !== ''
    );

    // STEP B: Aggressive Visual Deduplication
    // Goal: Hide "Gemini" if "Gemini Advanced" exists. Hide "Canva-pro" if "Canva PRO" exists.

    // 1. Sort by Quality (Length DESC + Formatting)
    // Longer, formatted names come first and claim the spot.
    rawKeys.sort((a, b) => {
        const normA = a.replace(/[-_]/g, ' ').toLowerCase();
        const normB = b.replace(/[-_]/g, ' ').toLowerCase();

        // If one is clearly formatted (Has Caps/Spaces) and the other isn't, prefer formatted
        const scoreA = (a.includes(' ') ? 5 : 0) + (/[A-Z]/.test(a) ? 2 : 0);
        const scoreB = (b.includes(' ') ? 5 : 0) + (/[A-Z]/.test(b) ? 2 : 0);

        if (scoreA !== scoreB) return scoreB - scoreA;

        // If formatting is similar, prefer LONGER names (More specific)
        return normB.length - normA.length;
    });

    const finalKeys = [];
    const keptNorms = [];

    rawKeys.forEach(key => {
        const norm = key.replace(/[-_]/g, ' ').replace(/\s+/g, ' ').trim().toLowerCase();

        // CHECK: Is this key redundant? 
        // It is redundant if its normalized form is a SUBSTRING of an already kept key.
        // OR if an already kept key is a substring of IT (but we sorted by length, so we see longest first).

        // Exception: "Canva PRO" vs "Canva PRO (Personal)". 
        // "canva pro" is inside "canva pro (personal)". 
        // Since we sort by length, "(Personal)" is processed FIRST.
        // Then "Canva PRO" comes. Is "canva pro" a substring of "canva pro (personal)"? YES.
        // So "Canva PRO" would be hidden. THIS IS RISKY.

        // Let's refine: Only hide if it's an "Ugly" variant or EXACT match.
        // Ugly = Contains hyphens when keeper doesn't?

        // User said: "Eliminate duplicates".
        // He hates "Canva-pro" vs "Canva PRO".
        // He hates "Gemini" vs "Gemini Advanced".

        // Let's try: Hide if EXACT match of normalized form OR if it's a "bad format" substring.

        const isRedundant = keptNorms.some(existing => {
            // 1. Exact match (case/format insensitive)
            if (existing === norm) return true;

            // 2. Substring match, BUT only if the current key looks "raw" (no spaces, or hyphenated)
            // Example: "gemini" (raw) inside "gemini advanced". -> Hide "gemini".
            // Example: "canva-pro" (raw) inside "canva pro". -> Hide "canva-pro".

            const isRaw = !key.includes(' ') || key.includes('-');
            if (isRaw && existing.includes(norm)) return true;

            return false;
        });

        if (!isRedundant) {
            finalKeys.push(key);
            keptNorms.push(norm);
        }
    });

    if (finalKeys.length > 0) {
        const header = document.createElement('h4');
        header.style.color = '#00f3ff';
        header.innerText = "📦 Stock Original";
        list.appendChild(header);

        finalKeys.forEach(key => {
            const row = document.createElement('div');
            row.className = 'stock-item-row';
            row.style.display = 'flex';
            row.style.justifyContent = 'space-between';
            row.style.alignItems = 'center';
            row.style.padding = '10px';
            row.style.background = 'rgba(0, 243, 255, 0.05)';
            row.style.marginBottom = '8px';
            row.style.borderRadius = '8px';
            row.style.border = '1px solid rgba(0, 243, 255, 0.2)';

            const name = key.charAt(0).toUpperCase() + key.slice(1);
            const val = stockState[key];

            const isHidden = hiddenProducts.includes(key);
            const eyeIcon = isHidden ? 'fa-eye-slash' : 'fa-eye';
            const eyeColor = isHidden ? '#888' : '#00f3ff';

            row.innerHTML = `
                <span style="color:${isHidden ? '#888' : 'white'}; text-decoration:${isHidden ? 'line-through' : 'none'}; flex: 1; font-weight: 500;">${name}</span>
                <div style="display:flex; gap:10px; align-items:center;">
                    <span style="color:${val > 0 ? '#00ff88' : '#ff4444'}; font-weight:bold; width:35px; text-align:right; font-size: 0.9rem;">${val}</span>
                    <button onclick="toggleHideProduct('${key.replace(/'/g, "\\'")}')" style="background:transparent; color:${eyeColor}; border:1px solid ${eyeColor}; width: 32px; height: 32px; display: flex; align-items: center; justify-content: center; border-radius:6px; cursor:pointer; transition: all 0.2s;" title="Ocultar/Mostrar">
                        <i class="fas ${eyeIcon}"></i>
                    </button>
                    <button onclick="deleteStockProduct('${key.replace(/'/g, "\\'")}')" style="background:#ff4444; color:white; border:none; width: 32px; height: 32px; display: flex; align-items: center; justify-content: center; border-radius:6px; cursor:pointer; transition: all 0.2s;" title="Borrar">
                        <i class="fas fa-times"></i>
                    </button>
                </div>
            `;
            list.appendChild(row);
        });
    }

    // 2. Render CUSTOM Items (Dynamics)
    if (customProducts.length > 0) {
        const header = document.createElement('h4');
        header.style.color = '#ff00ff';
        header.style.marginTop = '20px';
        header.innerText = "✨ Productos Personalizados (Custom)";
        list.appendChild(header);

        customProducts.forEach(prod => {
            const row = document.createElement('div');
            row.className = 'stock-item-row';
            row.style.display = 'flex';
            row.style.justifyContent = 'space-between';
            row.style.alignItems = 'center';
            row.style.padding = '10px';
            row.style.background = 'rgba(255, 255, 255, 0.05)';
            row.style.marginBottom = '8px';
            row.style.borderRadius = '8px';
            row.style.border = '1px solid rgba(255, 0, 255, 0.2)';

            const stockVal = stockState[prod.title] !== undefined ? stockState[prod.title] : prod.stock;

            row.innerHTML = `
                <div style="display:flex; align-items:center; gap: 12px; flex: 1;">
                    <img src="${prod.image}" style="width: 40px; height: 40px; border-radius: 4px; object-fit: cover; border: 1px solid #333;" onerror="this.src='logo.png'">
                    <div style="display:flex; flex-direction:column;">
                        <span style="color:white; font-weight:bold; font-size: 0.95rem;">${prod.title}</span>
                        <span style="color:#aaa; font-size:0.75rem;">ID: ${prod.id}</span>
                    </div>
                </div>
                <div style="display:flex; gap:12px; align-items:center;">
                    <span style="color:${stockVal > 0 ? '#00ff88' : '#ff4444'}; font-weight: bold; font-size: 0.9rem;">${stockVal}</span>
                    <button onclick="deleteCustomProductAction('${prod.id}')" style="background:#ff0055; color:white; border:none; padding:8px 12px; border-radius:6px; cursor:pointer; transition: all 0.2s;" onmouseover="this.style.opacity='0.8'" onmouseout="this.style.opacity='1'">
                        <i class="fas fa-trash-alt"></i>
                    </button>
                </div>
            `;
            list.appendChild(row);
        });
    } else {
        const empty = document.createElement('p');
        empty.innerText = "No hay productos personalizados creados.";
        empty.style.color = "#888";
        empty.style.textAlign = "center";
        list.appendChild(empty);
    }
};

window.toggleHideProduct = function(key) {
    window.toggleProductVisibility(key);
};

window.deleteStockProduct = async function(key) {
    if (!confirm("¿Seguro que deseas eliminar este producto (Stock Original) permanentemente?")) return;
    try {
        await db.collection('stock').doc('main').update({
            [key]: firebase.firestore.FieldValue.delete()
        });
        alert("Producto eliminado del stock correctamente.");
        // stockState listener will auto-update the list
    } catch (e) {
        console.error(e);
        alert("Error al eliminar: " + e.message);
    }
};

window.deleteCustomProductAction = async function (id) {
    if (!confirm("¿Seguro que deseas eliminar este producto permanentemente?")) return;
    try {
        await db.collection('products').doc(id).delete();
        alert("Producto eliminado correctamente.");
    } catch (e) {
        console.error(e);
        alert("Error al eliminar: " + e.message);
    }
};

// --- TARGETED DB CLEANUP (THE "ASSASSIN" SCRIPT) ---
// deletes specific "ugly" keys if their "pretty" version exists.
(async function () {
    try {
        const docRef = db.collection('stock').doc('main');
        const doc = await docRef.get();
        if (!doc.exists) return;

        const data = doc.data();
        const updates = {};
        let changesCount = 0;

        // MAP: Ugly Key -> Pretty Key equivalent
        // If "Pretty" exists, "Ugly" dies.
        const targets = {
            'canva-pro': 'Canva PRO',
            'panel-canva': 'Panel Canva PRO',
            'gemini': 'Gemini Advanced',
            'google-one': 'Google One',
            'perplexity': 'Perplexity AI',
            'capcut': 'CapCut Pro',
            'netflix': 'Netflix',
            'disney': 'Disney Premium',
            'prime-video': 'Prime Video'
        };

        // Also check generic normalization
        const keys = Object.keys(data);

        for (const [ugly, prettySub] of Object.entries(targets)) {
            // Does the specific Ugly Key exist?
            if (data[ugly] !== undefined) {
                // Does a "Pretty" version exist? 
                // We look for a key that INCLUDES the pretty substring (relaxed match)
                // e.g. "Canva PRO (Personal)" matches "Canva PRO"
                const bestMatch = keys.find(k => k.includes(prettySub) && k !== ugly);

                if (bestMatch) {
                    console.log(`🎯 TARGET ACQUIRED: Deleting '${ugly}' because '${bestMatch}' exists.`);
                    updates[ugly] = firebase.firestore.FieldValue.delete();
                    changesCount++;
                }
            }
        }

        // Also run the Generic "Custom_" garbage collector one last time
        for (const [key, val] of Object.entries(data)) {
            const k = key.toLowerCase();
            if (k.startsWith('custom_') || k === 'null' || k === 'undefined' || k.trim() === '') {
                updates[key] = firebase.firestore.FieldValue.delete();
                changesCount++;
            }
        }

        if (changesCount > 0) {
            console.log(`🔥 EXECUTING TARGETED CLEANUP: ${changesCount} deletions.`);
            await docRef.update(updates);
            // Reload to show clean state
            setTimeout(() => window.location.reload(), 1500);
        } else {
            console.log("✨ DB Clean. No known duplicates found.");
        }

    } catch (e) {
        console.error("Targeted Purge Error:", e);
    }
})();

// --- NEW FEATURES: SEARCH, FILTERS & BANNER ---
function initNewFeatures() {
    // 1. Promo Banner (Site Message)
    const siteMsgContainers = document.querySelectorAll('.global-site-msg');
    
    if(siteMsgContainers.length > 0) {
        console.log("Site message elements found. Attaching listener...");
        db.collection('settings').doc('banner').onSnapshot(doc => {
            console.log("Site message snapshot updated!", doc.exists, doc.data());
            if (doc.exists) {
                const data = doc.data();
                if (data.active && data.text) {
                    // Create seamless loop text
                    const singleText = data.text + " &nbsp; &bull; &nbsp; ";
                    // Repeat enough times to guarantee it overflows the widest 4k screens
                    const repeatedText = singleText.repeat(8);
                    // Two identical blocks side-by-side to allow CSS to translate -50% perfectly
                    const fullText = `<span>${repeatedText}</span><span>${repeatedText}</span>`;

                    siteMsgContainers.forEach(container => {
                        container.style.display = 'flex';
                        const siteMsgText = container.querySelector('.site-msg-text');
                        if (siteMsgText) {
                            siteMsgText.innerHTML = fullText;
                        }
                    });
                } else {
                    siteMsgContainers.forEach(container => {
                        container.style.display = 'none';
                    });
                }
            }
        }, error => {
            console.error("Firebase Snapshot Error on Site Message:", error);
        });
    } else {
        console.error("Site message DOM elements NOT FOUND!");
    }

    // Site Message Admin Modal
    const btnAdminSiteMsg = document.getElementById('btn-banner-admin');
    const siteMsgModal = document.getElementById('site-msg-admin-modal');
    const closeSiteMsgModal = document.querySelector('.close-site-msg');
    const saveSiteMsgBtn = document.getElementById('btn-save-site-msg');
    
    if (btnAdminSiteMsg && siteMsgModal) {
        btnAdminSiteMsg.addEventListener('click', () => {
            siteMsgModal.style.display = 'block';
            db.collection('settings').doc('banner').get().then(doc => {
                if (doc.exists) {
                    const data = doc.data();
                    document.getElementById('admin-site-msg-text').value = data.text || '';
                    document.getElementById('admin-site-msg-active').checked = !!data.active;
                }
            });
        });
    }

    if (closeSiteMsgModal) {
        closeSiteMsgModal.addEventListener('click', () => {
            siteMsgModal.style.display = 'none';
        });
    }

    if (saveSiteMsgBtn) {
        saveSiteMsgBtn.addEventListener('click', () => {
            const text = document.getElementById('admin-site-msg-text').value;
            const active = document.getElementById('admin-site-msg-active').checked;
            
            saveSiteMsgBtn.innerText = "⏳ Guardando...";
            db.collection('settings').doc('banner').set({ text, active }, {merge: true})
                .then(() => {
                    saveSiteMsgBtn.innerText = "✅ ¡Guardado!";
                    setTimeout(() => {
                        saveSiteMsgBtn.innerText = "💾 Guardar Oferta";
                        siteMsgModal.style.display = 'none';
                    }, 1000);
                })
                .catch(err => {
                    console.error("Error saving site message:", err);
                    saveSiteMsgBtn.innerText = "❌ Error (Revisa Consola)";
                    alert("Error al guardar: " + err.message);
                    setTimeout(() => saveSiteMsgBtn.innerText = "💾 Guardar Oferta", 3000);
                });
        });
    }

    // 2. Search & Category Filters
    const searchInput = document.getElementById('input-buscar-px');
    if (searchInput) {
        // Defeat Chrome autofill by clearing value on load
        setTimeout(() => { searchInput.value = ''; }, 50);
    }
    const filterBtns = document.querySelectorAll('.filter-btn');
    let currentSearch = '';
    let currentCat = 'all';

    function getCategory(title) {
        const t = title.toLowerCase();
        if (t.includes('netflix') || t.includes('prime') || t.includes('disney') || t.includes('hbo') || t.includes('crunchyroll') || t.includes('paramount') || t.includes('spotify') || t.includes('youtube') || t.includes('max')) return 'streaming';
        // Diseño is a subset, we must evaluate it explicitly for the UI
        if (t.includes('canva') || t.includes('adobe') || t.includes('capcut') || t.includes('autocad')) return 'diseño';
        if (t.includes('autodesk') || t.includes('office') || t.includes('windows') || t.includes('gemini') || t.includes('chatgpt') || t.includes('perplexity') || t.includes('google')) return 'software';
        return 'otros';
    }

    function applyFilters() {
        const cards = document.querySelectorAll('.services-grid .card');
        cards.forEach(card => {
            const titleElement = card.querySelector('h3');
            if (!titleElement) return;
            const title = titleElement.innerText.toLowerCase();
            const cat = getCategory(title);

            const matchesSearch = currentSearch === '' || title.includes(currentSearch);
            const matchesCat = currentCat === 'all' || cat === currentCat;

            if (matchesSearch && matchesCat) {
                card.style.display = '';
            } else {
                card.style.display = 'none';
            }
        });
    }

    if (searchInput) {
        searchInput.addEventListener('input', (e) => {
            currentSearch = e.target.value.toLowerCase().trim();
            applyFilters();
        });
    }

    filterBtns.forEach(btn => {
        btn.addEventListener('click', (e) => {
            filterBtns.forEach(b => b.classList.remove('active'));
            e.target.classList.add('active');
            currentCat = e.target.getAttribute('data-category');
            applyFilters();
        });
    });

    window.applySearchFilters = applyFilters;
}

initNewFeatures();

const targetGrid = document.querySelector('.services-grid');
if (targetGrid) {
    const observer = new MutationObserver(() => {
        if (typeof window.applySearchFilters === 'function') {
            window.applySearchFilters();
        }
    });
    observer.observe(targetGrid, { childList: true });
}

// --- ZORRITO INTERACTIVO (JS ENGINE AVANZADO) ---
class FoxPet {
    constructor() {
        if (window._foxPetRunning) return;
        window._foxPetRunning = true;

        this.frames = {
            walk: Array.from({length: 8}, (_, i) => `zorrito/caminar ${i+1}.png`),
            sleep: Array.from({length: 4}, (_, i) => `zorrito/dormido ${i+1}.png`),
            angry: Array.from({length: 4}, (_, i) => `zorrito/enojado ${i+1}.png`)
        };
        this.preloadedImages = {};
        this.preload();

        this.petElement = document.createElement('div');
        this.petElement.className = 'virtual-pet';
        document.body.appendChild(this.petElement);

        this.state = 'walk'; // walk, sleep, angry, idle, jump, hang
        this.currentFrameIndex = 0;
        
        // Physics
        this.width = 60;
        this.height = 60;
        this.x = window.innerWidth / 2;
        this.y = -100; // start off screen, then jump to banner
        this.vx = 0;
        this.vy = 0;
        this.gravity = 0.8;
        this.direction = 1; 

        this.banner = document.querySelector('.site-msg-container');
        
        if (this.banner) {
            const rect = this.banner.getBoundingClientRect();
            this.x = rect.left + (rect.width / 2);
            this.y = rect.top + window.scrollY - this.height;
        }

        this.isHovered = false;
        this.lastActionTime = Date.now();

        this.initEvents();
        this.startEngine();
    }

    preload() {
        for (const key in this.frames) {
            this.preloadedImages[key] = [];
            this.frames[key].forEach(src => {
                const img = new Image();
                img.src = src;
                this.preloadedImages[key].push(img);
            });
        }
    }

    initEvents() {
        this.petElement.addEventListener('click', (e) => {
            e.stopPropagation();
            this.setAngry();
        });

        this.petElement.addEventListener('mouseenter', () => {
            if (this.state !== 'angry' && this.state !== 'jump') {
                this.isHovered = true;
                this.state = 'idle';
                this.lastActionTime = Date.now();
            }
        });

        this.petElement.addEventListener('mouseleave', () => {
            this.isHovered = false;
            this.lastActionTime = Date.now();
            if (this.state !== 'angry' && this.state !== 'jump') {
                this.state = 'walk';
            }
        });
    }

    setAngry() {
        if (this.state === 'jump') return; 
        this.state = 'angry';
        this.currentFrameIndex = 0;
        this.lastActionTime = Date.now();
        setTimeout(() => {
            if (this.state === 'angry') {
                this.state = this.isHovered ? 'idle' : 'walk';
                this.lastActionTime = Date.now();
            }
        }, 3000);
    }

    startEngine() {
        setInterval(() => this.updateFrame(), 100);
        setInterval(() => this.updatePhysics(), 30); // 30ms for smoother physics
        setInterval(() => this.makeDecision(), 3000);
    }

    makeDecision() {
        if (this.state === 'jump' || this.state === 'angry') return;
        
        const rand = Math.random();
        
        if (rand < 0.25 && this.state !== 'hang') {
            // Check if on floor to do a super jump
            let floorLimit = this.getFloorLimit();
            let isOnFloor = Math.abs(this.y - floorLimit) < 20;
            this.jump(isOnFloor); 
        } 
        else if (rand < 0.20 && this.state === 'hang') {
            this.drop(); // drop if hanging
        }
        else if (rand < 0.4) {
            this.direction *= -1; // change direction
            if (this.state !== 'sleep') this.state = 'walk';
        }
    }

    jump(superJump = false) {
        this.state = 'jump';
        this.vy = superJump ? -26 : -16; // Strong jump
        this.vx = this.direction * 4; 
    }

    drop() {
        this.state = 'jump';
        this.vy = 0; 
        this.vx = this.direction * 2;
    }

    getFloorLimit() {
        let floorLimit = document.documentElement.scrollHeight - this.height;
        const productsSection = document.getElementById('products');
        if (productsSection) {
            const rect = productsSection.getBoundingClientRect();
            // Restrict floor to the bottom of the products section
            const productsBottom = rect.bottom + window.scrollY;
            if (productsBottom < floorLimit) {
                floorLimit = productsBottom;
            }
        }
        return floorLimit;
    }

    teleportToBanner() {
        this.banner = document.querySelector('.site-msg-container');
        if (this.banner && this.banner.offsetParent !== null) {
            const rect = this.banner.getBoundingClientRect();
            this.x = rect.left + (rect.width / 2);
            this.y = rect.top + window.scrollY - this.height;
        } else {
            this.y = 100;
        }
        this.vy = 0;
        this.vx = 0;
        this.state = 'walk';
    }

    updateFrame() {
        let frameList = this.frames.walk; 
        
        if (this.state === 'angry') frameList = this.frames.angry;
        else if (this.state === 'sleep') frameList = this.frames.sleep;
        else if (this.state === 'idle' || this.state === 'hang') {
            this.petElement.style.backgroundImage = `url('${this.frames.walk[0]}')`;
            return; 
        }
        else if (this.state === 'jump') {
            this.petElement.style.backgroundImage = `url('${this.frames.walk[1]}')`;
            return;
        }

        this.currentFrameIndex = (this.currentFrameIndex + 1) % frameList.length;
        this.petElement.style.backgroundImage = `url('${frameList[this.currentFrameIndex]}')`;
    }

    updatePhysics() {
        const now = Date.now();
        const timeSinceLastAction = now - this.lastActionTime;

        if (this.state !== 'sleep' && this.state !== 'angry' && this.state !== 'jump' && !this.isHovered && timeSinceLastAction > 15000) {
            this.state = 'sleep';
            this.currentFrameIndex = 0;
        }

        if (this.state === 'walk' || this.state === 'hang') {
            this.x += 2 * this.direction; 
        } else if (this.state === 'jump') {
            this.x += this.vx;
        }

        // Screen boundaries
        if (this.x < 0) {
            this.x = 0;
            this.direction = 1;
            if (this.state === 'jump') this.vx *= -1;
        } else if (this.x > window.innerWidth - this.width) {
            this.x = window.innerWidth - this.width;
            this.direction = -1;
            if (this.state === 'jump') this.vx *= -1;
        }

        let floorLimit = this.getFloorLimit();

        if (this.state === 'jump') {
            this.vy += this.gravity;
            this.y += this.vy;

            let landed = false;
            let targetY = floorLimit;

            if (this.vy > 0) {
                // Falling down
                this.banner = document.querySelector('.site-msg-container');
                if (this.banner && this.banner.offsetParent !== null) {
                    const rect = this.banner.getBoundingClientRect();
                    const bannerY = rect.top + window.scrollY;
                    if (this.y + this.height >= bannerY && this.y + this.height - this.vy <= bannerY) {
                        targetY = bannerY - this.height;
                        landed = true;
                    }
                }
                
                if (!landed) {
                    const cards = document.querySelectorAll('.product-card');
                    for (let card of cards) {
                        if (card.offsetParent === null) continue; // invisible
                        const rect = card.getBoundingClientRect();
                        const cardTop = rect.top + window.scrollY;
                        const cardLeft = rect.left + window.scrollX;
                        const cardRight = rect.right + window.scrollX;

                        if (this.x + this.width > cardLeft && this.x < cardRight) {
                            if (this.y + this.height >= cardTop && this.y + this.height - this.vy <= cardTop + 10) {
                                targetY = cardTop - this.height;
                                landed = true;
                                break;
                            }
                        }
                    }
                }

                if (landed) {
                    this.y = targetY;
                    this.state = 'walk';
                    this.vy = 0;
                    this.vx = 0;
                    this.lastActionTime = Date.now();
                } else if (this.y + this.height >= floorLimit) {
                    // Reached the absolute bottom without landing! Teleport back to top!
                    this.teleportToBanner();
                    return;
                }

            } else if (this.vy < 0) {
                // Jumping up (Checking for bottom of cards to hang)
                const cards = document.querySelectorAll('.product-card');
                for (let card of cards) {
                    if (card.offsetParent === null) continue;
                    const rect = card.getBoundingClientRect();
                    const cardBottom = rect.bottom + window.scrollY;
                    const cardLeft = rect.left + window.scrollX;
                    const cardRight = rect.right + window.scrollX;

                    if (this.x + this.width > cardLeft && this.x < cardRight) {
                        if (this.y <= cardBottom && this.y - this.vy >= cardBottom - 10) {
                            this.y = cardBottom;
                            this.state = 'hang';
                            this.vy = 0;
                            this.vx = 0;
                            break;
                        }
                    }
                }
            }
        } else if (this.state === 'walk') {
            // Ledge detection: stay on the current surface!
            let onGround = false;
            let nearLedge = false;
            const bottomY = this.y + this.height;

            // Check Banner
            if (this.banner && this.banner.offsetParent !== null) {
                const rect = this.banner.getBoundingClientRect();
                const bannerY = rect.top + window.scrollY;
                if (Math.abs(bottomY - bannerY) < 10) {
                    const bannerLeft = rect.left + window.scrollX;
                    const bannerRight = rect.right + window.scrollX;
                    if (this.x + this.width > bannerLeft && this.x < bannerRight) {
                        onGround = true;
                        if (this.x <= bannerLeft + 10 || this.x + this.width >= bannerRight - 10) nearLedge = true;
                    }
                }
            }

            // Check Cards
            if (!onGround) {
                const cards = document.querySelectorAll('.product-card');
                for (let card of cards) {
                    if (card.offsetParent === null) continue;
                    const rect = card.getBoundingClientRect();
                    const cardTop = rect.top + window.scrollY;
                    if (Math.abs(bottomY - cardTop) < 10) {
                        const cardLeft = rect.left + window.scrollX;
                        const cardRight = rect.right + window.scrollX;
                        if (this.x + this.width > cardLeft && this.x < cardRight) {
                            onGround = true;
                            if (this.x <= cardLeft + 5 || this.x + this.width >= cardRight - 5) nearLedge = true;
                            break;
                        }
                    }
                }
            }

            // Check Floor
            if (Math.abs(bottomY - floorLimit) < 10) {
                onGround = true;
                // If on floor, force jump frequently
                if (Math.random() < 0.1) this.jump(true);
            }

            if (nearLedge && onGround && bottomY < floorLimit - 50) {
                // Turn around to avoid falling off the card!
                this.direction *= -1;
                this.x += 5 * this.direction; // Step back
            } else if (!onGround) {
                this.drop();
            }
        } else if (this.state === 'hang') {
             // Ledge detection for hanging
             let onCeiling = false;
             
             const cards = document.querySelectorAll('.product-card');
             for (let card of cards) {
                 if (card.offsetParent === null) continue;
                 const rect = card.getBoundingClientRect();
                 const cardBottom = rect.bottom + window.scrollY;
                 const cardLeft = rect.left + window.scrollX;
                 const cardRight = rect.right + window.scrollX;

                 if (Math.abs(this.y - cardBottom) < 10) {
                     if (this.x + this.width > cardLeft && this.x < cardRight) {
                         onCeiling = true;
                         break;
                     }
                 }
             }
             
             if (!onCeiling) {
                 this.drop();
             }
        }

        // Apply
        this.petElement.style.left = `${this.x}px`;
        this.petElement.style.top = `${this.y}px`;
        
        let tf = `scaleX(${this.direction})`;
        if (this.state === 'hang') {
            tf += ` rotate(180deg)`;
        }
        this.petElement.style.transform = tf;
    }
}

// Initialize
setTimeout(() => {
    new FoxPet();
}, 1500);
