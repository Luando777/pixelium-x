
import os

file_path = 'pixelium_v11_STABLE.js'

restored_logic = r'''
    // --- PRODUCT SYSTEM (RESTORED) ---
    const productModal = document.getElementById('product-modal');
    const btnProductsAdmin = document.getElementById('btn-products-admin');
    const closeProductModalBtn = document.querySelector('.close-product-modal');
    const btnCreateProduct = document.getElementById('btn-create-product');
    // productAdminList already defined later or here? Let's check V11 structure. 
    // It's safer to rely on getElementById inside functions or define if missing, but let's assume it's okay to redefine const if scope allows or var.
    // Actually, V11 might NOT have productAdminList defined if I deleted the block.
    // Ideally put this block where variables don't collide.
    const productAdminListDOM = document.getElementById('product-admin-list'); 

    let hiddenProducts = JSON.parse(localStorage.getItem('hiddenProducts')) || [];
    let customProducts = [];

    function initProductSystem() {
        console.log("Initializing Product System...");
        db.collection('products').orderBy('createdAt', 'desc').onSnapshot(snapshot => {
            const products = [];
            snapshot.forEach(doc => {
                products.push({id: doc.id, ...doc.data()});
            });
            customProducts = products;
            console.log("Loaded custom products:", customProducts.length);

            // Re-render Custom Grid
            document.querySelectorAll('.card[id^="custom_"]').forEach(e => e.remove());
            renderCustomProductsOnGrid();
            applyProductVisibility();
            if(typeof applyPriceOverrides === 'function') applyPriceOverrides();
            if(typeof applyProductOverrides === 'function') applyProductOverrides();
            
            // Refresh Admin List if open (renderAdminProductList is defined later in file)
             if (productModal && productModal.style.display === 'block') {
                if(typeof renderAdminProductList === 'function') renderAdminProductList();
            }
        });
    }

    // Call on load
    initProductSystem();

    if (btnProductsAdmin) {
        btnProductsAdmin.addEventListener('click', () => {
            productModal.style.display = 'block';
            if(typeof renderAdminProductList === 'function') renderAdminProductList();
            if(window.switchProductTab) switchProductTab('add');
        });
    }

    if (closeProductModalBtn) {
        closeProductModalBtn.addEventListener('click', () => {
            productModal.style.display = 'none';
        });
    }

    window.switchProductTab = (tab) => {
        const addTab = document.getElementById('product-tab-add');
        const listTab = document.getElementById('product-tab-list');
        if(addTab) addTab.style.display = tab === 'add' ? 'block' : 'none';
        if(listTab) listTab.style.display = tab === 'list' ? 'block' : 'none';
        
        const buttons = document.querySelectorAll('#product-modal .tab-btn');
        if(buttons.length > 0) {
            buttons.forEach(b => b.classList.remove('active'));
            if(tab === 'add') buttons[0].classList.add('active');
            if(tab === 'list') buttons[1].classList.add('active');
        }
    };

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

            const imgFile = imgInput.files[0];
            const storageRef = firebase.storage().ref();
            const fileRef = storageRef.child(`products/${Date.now()}_${imgFile.name}`);

            fileRef.put(imgFile).then((snapshot) => {
                return snapshot.ref.getDownloadURL();
            }).then(async (imageUrl) => {

                const prodId = 'custom_' + Date.now();
                const trimmedTitle = title.trim();
                const newProduct = {
                    title: trimmedTitle,
                    desc: document.getElementById('new-prod-desc').value,
                    price: parseFloat(price),
                    priceAlt: document.getElementById('new-prod-price-alt').value,
                    stock: parseInt(document.getElementById('new-prod-stock').value) || 10,
                    warranty: document.getElementById('new-prod-warranty').value,
                    image: imageUrl,
                    badge: document.getElementById('new-prod-badge').value,
                    note: document.getElementById('new-prod-note').value,
                    createdAt: firebase.firestore.FieldValue.serverTimestamp() 
                };

                try {
                    await db.collection('products').doc(prodId).set(newProduct);
                    await db.collection('stock').doc('main').set({
                        [trimmedTitle]: newProduct.stock
                    }, { merge: true });

                    alert("¡Producto Creado! ☁️🔥");
                    document.getElementById('new-prod-name').value = '';
                    document.getElementById('new-prod-price').value = '';
                    document.getElementById('new-prod-img').value = '';
                    btnCreateProduct.innerText = "✨ Crear Producto";
                    btnCreateProduct.disabled = false;

                } catch (err) {
                    alert("Error: " + err.message);
                    btnCreateProduct.disabled = false;
                }
            }).catch((error) => {
                console.error("Upload failed:", error);
                alert("Error subiendo imagen: " + error.message);
                btnCreateProduct.disabled = false;
            });
        });
    }

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

    function renderCustomProductsOnGrid() {
        const grid = document.querySelector('.services-grid');
        if (!grid) return;

        customProducts.forEach(prod => {
            if (document.getElementById(prod.id)) return; 

            const card = document.createElement('div');
            card.className = 'card';
            card.id = prod.id || `custom_${Date.now()}`; 

            const currentStock = (typeof stockState !== 'undefined' && stockState[prod.title] !== undefined) ? stockState[prod.title] : (prod.stock || 0);
            const stockClass = currentStock > 0 ? 'stock-available' : 'stock-out';
            const stockText = currentStock > 0 ? `Stock: ${currentStock}` : 'Sin Stock';
            const btnState = currentStock > 0 ? '' : 'disabled';
            const btnText = currentStock > 0 ? 'Agregar al Carrito' : 'Agotado';

            // Safe Price
            const pPrice = parseFloat(prod.price) || 0;

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
            
            <div class="price-tag">S/${pPrice.toFixed(2)} ${prod.priceAlt ? `<span class="price-alt">($${prod.priceAlt})</span>` : ''}</div>
            <button class="btn-add" onclick="window.addToCart('${prod.title}', ${pPrice})" ${btnState}>${btnText}</button>
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
'''

with open(file_path, 'r', encoding='utf-8') as f:
    content = f.read()

target = '// --- STOCK MANAGER LOGIC (SEPARATE SYSTEM) ---'
if target in content:
    new_content = content.replace(target, restored_logic + '\n' + target)
    with open(file_path, 'w', encoding='utf-8') as f:
        f.write(new_content)
    print("RESTORED Product Logic successfully.")
else:
    print("Could not find target string to insert code.")
