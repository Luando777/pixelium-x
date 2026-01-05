
import os

file_path = 'pixelium_v11_STABLE.js'

new_logic = r'''    // --- OVERRIDE MANAGER LOGIC (ORIGINAL PRODUCTS) ---
    // State
    let overrideState = {};
    let editingOriginalTitle = null;

    // 1. Initialization: Listen to Overrides
    function initOverrideSystem() {
        db.collection('product_overrides').doc('main').onSnapshot(doc => {
            if (doc.exists) {
                overrideState = doc.data();
                applyProductOverrides();
            } else {
                db.collection('product_overrides').doc('main').set({});
            }
        });
    }

    // 2. Apply Overrides
    function applyProductOverrides() {
        document.querySelectorAll('.services-grid .card').forEach(card => {
            if (card.id.startsWith('custom_')) return;

            const title = card.querySelector('h3').innerText.trim();
            const data = overrideState[title];
            if (data) {
                // Description
                if (data.desc) {
                    let descP = card.querySelector('p:not(.gold-text):not(.activation-note)');
                    if (!descP) {
                        const ul = card.querySelector('ul');
                        if (ul) ul.style.display = 'none';
                        descP = document.createElement('p');
                        card.querySelector('h3').after(descP);
                    }
                    descP.innerText = data.desc;
                }

                // Badge (First Gold Text)
                if (data.badge) {
                    let badgeEl = card.querySelector('.gold-text');
                    if (badgeEl) badgeEl.innerText = data.badge;
                }

                // Note (Activation Note)
                if (data.note) {
                    let noteEl = card.querySelector('.activation-note');
                    if (noteEl) noteEl.innerText = data.note;
                }

                // Warranty
                if (data.warranty) {
                    let warrantySpan = card.querySelector('.warranty-info span');
                    if (warrantySpan) warrantySpan.innerText = data.warranty;
                }
            }
        });
    }

    // 3. Edit Logic (Open Modal)
    window.openEditOriginalModal = (title) => {
        const modal = document.getElementById('product-modal');
        const btnCreate = document.getElementById('btn-create-product');
        
        // Find Card Data to Pre-fill
        let currentDesc = '', currentBadge = '', currentNote = '', currentWarranty = '';
        
        // Check overrides first
        const data = overrideState[title];
        if (data) {
            currentDesc = data.desc || '';
            currentBadge = data.badge || '';
            currentNote = data.note || '';
            currentWarranty = data.warranty || '';
        } else {
            // Scrape from DOM
            const card = Array.from(document.querySelectorAll('.services-grid .card')).find(c => c.querySelector('h3').innerText.trim() === title);
            if (card) {
                const descEl = card.querySelector('p:not(.gold-text):not(.activation-note)');
                if (descEl) currentDesc = descEl.innerText;
                
                const badgeEl = card.querySelector('.gold-text');
                if (badgeEl) currentBadge = badgeEl.innerText;

                const noteEl = card.querySelector('.activation-note');
                if (noteEl) currentNote = noteEl.innerText;

                const warEl = card.querySelector('.warranty-info span');
                if (warEl) currentWarranty = warEl.innerText;
            }
        }

        // Setup Modal UI
        modal.style.display = 'block';
        if(window.switchProductTab) switchProductTab('add'); // Show form
        
        // Fill Inputs
        const nameInput = document.getElementById('new-prod-name');
        if(nameInput) {
            nameInput.value = title;
            nameInput.disabled = true;
        }
        
        document.getElementById('new-prod-desc').value = currentDesc;
        document.getElementById('new-prod-badge').value = currentBadge;
        document.getElementById('new-prod-note').value = currentNote;
        document.getElementById('new-prod-warranty').value = currentWarranty;

        // Hide Irrelevant Inputs
        if(document.getElementById('new-prod-price')) document.getElementById('new-prod-price').style.display = 'none';
        if(document.getElementById('new-prod-price-alt')) document.getElementById('new-prod-price-alt').style.display = 'none';
        if(document.getElementById('new-prod-stock')) document.getElementById('new-prod-stock').style.display = 'none';
        if(document.getElementById('new-prod-img')) document.getElementById('new-prod-img').style.display = 'none';
        
        // Update Button
        btnCreate.innerText = "💾 Guardar Cambios (Original)";
        
        // Remove old listeners by cloning
        const newBtn = btnCreate.cloneNode(true);
        btnCreate.parentNode.replaceChild(newBtn, btnCreate);
        
        newBtn.onclick = async () => {
            const updates = {
                desc: document.getElementById('new-prod-desc').value,
                badge: document.getElementById('new-prod-badge').value,
                note: document.getElementById('new-prod-note').value,
                warranty: document.getElementById('new-prod-warranty').value
            };
            
            try {
                await db.collection('product_overrides').doc('main').set({
                    [title]: updates
                }, { merge: true });
                alert("¡Información actualizada! ☁️✅");
                modal.style.display = 'none';
                location.reload(); 
            } catch(e) {
                alert("Error: " + e.message);
            }
        };
    };

    initOverrideSystem();
'''

with open(file_path, 'r', encoding='utf-8') as f:
    content = f.read()

start_marker = '// --- DESCRIPTION MANAGER LOGIC (ORIGINAL PRODUCTS) ---'
end_marker = 'initDescriptionSystem();'

start_idx = content.find(start_marker)
# Find the LAST occurrence of end_marker AFTER start_idx
end_idx = content.find(end_marker, start_idx)

if start_idx != -1 and end_idx != -1:
    end_idx += len(end_marker) # Include the marker
    
    # Replace
    new_content = content[:start_idx] + new_logic + content[end_idx:]
    
    with open(file_path, 'w', encoding='utf-8') as f:
        f.write(new_content)
    print("Successfully patched file.")
else:
    print(f"Could not find markers. Start: {start_idx}, End: {end_idx}")
