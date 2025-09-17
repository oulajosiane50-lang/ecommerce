// app.js
// Rôle: interactivité complète pour la page e-commerce (vanilla JS).
// Fonctionnalités:
// 1) affichage des produits dans la grille (#products)
// 2) ouverture/fermeture modale produit (accessible, gestion focus + Esc)
// 3) formulaire commande avec validation
// 4) enregistrement commande dans localStorage
// 5) affichage récap de la dernière commande
// 6) bouton WhatsApp dans la modale produit
// 7) bouton WhatsApp dans "Ma commande" (view-cart-btn)
// 8) fonction d'ouverture WhatsApp avec message prérempli

document.addEventListener('DOMContentLoaded', () => {
  /* ---------------------------
     Modèle de données (exemples)
     --------------------------- */
  const products = [
    { id: 'p1', name: 'fleur1', price: 15000, img: 'fleur1.png' },
    { id: 'p2', name: 'fleur2', price: 20000, img: 'fleur2.png' },
    { id: 'p3', name: 'fleur3', price: 10000, img: 'fleur3.png' },
    { id: 'p4', name: 'fleur4', price: 10000, img: 'fleur4.png' }
  ];

  /* ---------------------------
     Sélecteurs & éléments DOM
     --------------------------- */
  const productsContainer = document.getElementById('products');
  const modal = document.getElementById('product-modal');
  const modalImg = document.getElementById('modal-img');
  const modalTitle = document.getElementById('modal-title');
  const modalPrice = document.getElementById('modal-price');
  const modalDesc = document.getElementById('modal-desc');
  const modalCloseBtn = document.getElementById('modal-close');
  const addToCartBtn = document.getElementById('add-to-cart');
  const viewCartBtn = document.getElementById('view-cart-btn');
  const cartCountEl = document.getElementById('cart-count');

  // Create order form elements inside modal dynamically (to ensure presence)
  // We'll append the form inside modal-info under modalDesc
  const modalInfo = document.querySelector('.modal-info');

  // Keep track of currently displayed product
  let currentProduct = null;
  // Track cart count in memory (persist in localStorage optionally)
  let cartCount = parseInt(localStorage.getItem('cartCount') || '0', 10) || 0;
  cartCountEl.textContent = cartCount;

  // Save the element that had focus before opening the modal (accessibility)
  let lastFocusedElementBeforeModal = null;

  /* ---------------------------
     Helpers
     --------------------------- */
  function formatCurrency(n) {
    // Format integer number like 15000 => "15 000"
    return String(n).replace(/\B(?=(\d{3})+(?!\d))/g, ' ');
  }

  function saveLastOrder(order) {
    localStorage.setItem('lastOrder', JSON.stringify(order));
    // also bump cartCount and persist
    cartCount += 1;
    cartCountEl.textContent = cartCount;
    localStorage.setItem('cartCount', String(cartCount));
  }

  function getLastOrder() {
    const raw = localStorage.getItem('lastOrder');
    return raw ? JSON.parse(raw) : null;
  }

  function showMessage(container, text, type = 'success') {
    // type: 'success' or 'error'
    const el = document.createElement('div');
    el.className = `message ${type}`;
    el.setAttribute('role', type === 'error' ? 'alert' : 'status');
    el.textContent = text;
    container.prepend(el);
    // auto remove after 4s
    setTimeout(() => {
      el.classList.add('hidden');
      setTimeout(() => el.remove(), 350);
    }, 4000);
  }

  function openWhatsApp(phoneNumber, message) {
    // If phoneNumber is empty, open generic wa.me with message
    // phoneNumber: in international format without '+' (e.g. '225XXXXXXXX')
    // message: plain text (will be encoded)
    const encoded = encodeURIComponent(message);
    let url;
    if (phoneNumber) {
      url = `https://wa.me/${phoneNumber}?text=${encoded}`;
    } else {
      url = `https://wa.me/?text=${encoded}`;
    }
    window.open(url, '_blank');
  }

  /* ---------------------------
     Render products list
     --------------------------- */
  function renderProducts() {
    if (!productsContainer) return;
    productsContainer.innerHTML = ''; // clear
    products.forEach(p => {
      const article = document.createElement('article');
      article.className = 'card';
      article.innerHTML = `
        <div class="card-image">
          <img src="${p.img}" alt="${p.name}">
        </div>
        <div class="card-body">
          <h3 class="card-title">${p.name}</h3>
          <p class="price">${formatCurrency(p.price)} FCFA</p>
          <div style="margin-top:auto; display:flex;gap:8px;">
            <button class="btn secondary view-btn" data-id="${p.id}">Voir +</button>
            <button class="btn primary quick-buy" data-id="${p.id}">Acheter</button>
          </div>
        </div>
      `;
      productsContainer.appendChild(article);
    });

    // attach events
    productsContainer.querySelectorAll('.view-btn').forEach(btn => {
      btn.addEventListener('click', (e) => {
        const id = btn.dataset.id;
        const prod = products.find(x => x.id === id);
        if (prod) openProductModal(prod);
      });
    });

    productsContainer.querySelectorAll('.quick-buy').forEach(btn => {
      btn.addEventListener('click', () => {
        const id = btn.dataset.id;
        const prod = products.find(x => x.id === id);
        if (prod) {
          openProductModal(prod, { focusOn: 'order-form-quantity' });
        }
      });
    });
  }

  /* ---------------------------
     Modal: open / close / accessibility
     --------------------------- */
  function openProductModal(product, options = {}) {
    currentProduct = product;
    // fill modal
    modalImg.src = product.img;
    modalImg.alt = product.name;
    modalTitle.textContent = product.name;
    modalPrice.textContent = `${formatCurrency(product.price)} FCFA`;
    modalDesc.textContent = `Les ${product.name} sont adaptées à vos gouts et selon votre style; elles sont idéales pour tout événement.`;

    // create or refresh order form inside modal
    createOrRefreshOrderForm();

    // show modal
    modal.setAttribute('aria-hidden', 'false');
    modal.style.display = 'flex';

    // accessibility: save last focused and move focus to first focusable element
    lastFocusedElementBeforeModal = document.activeElement;
    const firstFocusable = modal.querySelector('button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])');
    if (firstFocusable) firstFocusable.focus();

    // If options request to focus on a specific field id
    if (options.focusOn) {
      const el = document.getElementById(options.focusOn);
      if (el) el.focus();
    }
  }

  function closeProductModal() {
    modal.setAttribute('aria-hidden', 'true');
    modal.style.display = 'none';
    currentProduct = null;
    // return focus to previous element
    if (lastFocusedElementBeforeModal) lastFocusedElementBeforeModal.focus();
  }

  modalCloseBtn && modalCloseBtn.addEventListener('click', closeProductModal);
  // also close buttons in modal (there was a button with id="close")
  const modalCloseFallback = document.getElementById('close');
  if (modalCloseFallback) modalCloseFallback.addEventListener('click', closeProductModal);

  // close by clicking the overlay
  modal.addEventListener('click', (e) => {
    if (e.target === modal) closeProductModal();
  });

  // close by ESC
  document.addEventListener('keydown', (e) => {
    if (e.key === 'Escape' && modal.getAttribute('aria-hidden') === 'false') {
      closeProductModal();
    }
  });

  /* ---------------------------
     Create order form inside modal
     --------------------------- */
  function createOrRefreshOrderForm() {
    if (!modalInfo) return;

    // Remove any existing form
    const existingForm = document.getElementById('order-form');
    if (existingForm) existingForm.remove();

    // Build form
    const form = document.createElement('form');
    form.id = 'order-form';
    form.setAttribute('novalidate', 'true');
    form.innerHTML = `
      <hr style="margin:12px 0;">
      <h4>Passer commande</h4>

      <label for="order-qty">Quantité</label>
      <input id="order-qty" type="number" min="1" value="1" required style="width:100px;display:block;margin-bottom:8px;">

      <label for="customer-name">Nom complet *</label>
      <input id="customer-name" type="text" required placeholder="Ex: Marie Dupont" style="display:block;margin-bottom:8px;">

      <label for="customer-phone">Téléphone (ex: 225XXXXXXXX) *</label>
      <input id="customer-phone" type="tel" required placeholder="225xxxxxxxx" style="display:block;margin-bottom:8px;">

      <label for="customer-address">Adresse (optionnel)</label>
      <textarea id="customer-address" rows="2" placeholder="Ville, Rue..." style="display:block;margin-bottom:8px;"></textarea>

      <div id="form-errors" aria-live="polite" style="color:#b91c1c;margin-bottom:8px;"></div>

      <div style="display:flex;gap:8px;align-items:center">
        <button type="button" id="submit-order" class="btn primary">Commander</button>
        <button type="button" id="whatsapp-now" class="btn whatsapp-btn">WhatsApp</button>
        <span id="form-status" style="margin-left:8px;color:#065f46;"></span>
      </div>
    `;

    modalInfo.appendChild(form);

    // Style whatsapp button inline (color constraint)
    const waBtn = form.querySelector('#whatsapp-now');
    if (waBtn) {
      waBtn.style.background = '#25D366';
      waBtn.style.color = '#fff';
      waBtn.style.display = 'inline-flex';
      waBtn.style.alignItems = 'center';
      waBtn.style.gap = '8px';
      waBtn.style.fontWeight = '700';
      waBtn.innerHTML = `<svg width="18" height="18" viewBox="0 0 24 24" fill="none" aria-hidden="true" focusable="false"
        xmlns="http://www.w3.org/2000/svg"><path d="M20.52 3.48a11.94 11.94 0 10-16.9 16.9l-.9 3.3 3.4-.9a11.94 11.94 0 0014.4-19.3z" fill="#fff" opacity=".08"/><path d="M17.472 14.382c-.297-.149-1.76-.868-2.035-.968-.275-.1-.475-.149-.675.15-.198.297-.768.968-.94 1.166-.173.198-.347.223-.644.074-.297-.149-1.254-.463-2.388-1.475-.883-.787-1.48-1.758-1.652-2.056-.173-.298-.018-.459.131-.608.134-.133.298-.347.447-.52.149-.174.198-.298.298-.497.099-.198.05-.372-.025-.52-.075-.149-.675-1.626-.927-2.231-.246-.585-.497-.506-.675-.516l-.577-.01c-.198 0-.52.074-.793.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.064 2.877 1.212 3.074.149.198 2.092 3.2 5.07 4.487 1.305.563 2.323.898 3.122 1.149 1.31.407 2.5.35 3.441.213.525-.084 1.6-.653 1.826-1.287.224-.632.224-1.175.157-1.287-.066-.112-.244-.174-.54-.323z" fill="#fff"/></svg><span>WhatsApp</span>`;
      waBtn.setAttribute('aria-label', 'Envoyer cette commande sur WhatsApp');
    }

    // attach event handlers
    const submitBtn = form.querySelector('#submit-order');
    const qtyInput = form.querySelector('#order-qty');
    const nameInput = form.querySelector('#customer-name');
    const phoneInput = form.querySelector('#customer-phone');
    const addrInput = form.querySelector('#customer-address');
    const errorsEl = form.querySelector('#form-errors');
    const statusEl = form.querySelector('#form-status');

    function validateForm() {
      errorsEl.innerHTML = '';
      const errors = [];
      const qty = Number(qtyInput.value) || 0;
      if (qty < 1) errors.push('La quantité doit être au moins 1.');
      if (!nameInput.value.trim()) errors.push('Le nom est requis.');
      if (!phoneInput.value.trim()) errors.push('Le téléphone est requis.');
      // we could add phone format check (simple)
      if (phoneInput.value.trim() && !/^\d{8,15}$/.test(phoneInput.value.trim())) {
        errors.push('Format du téléphone invalide (chiffres uniquement, ex: 225xxxxxxxx).');
      }
      if (errors.length) {
        errorsEl.innerHTML = errors.map(e => `<div>• ${e}</div>`).join('');
        return false;
      }
      return true;
    }

    submitBtn.addEventListener('click', () => {
      statusEl.textContent = '';
      if (!validateForm()) {
        showMessage(errorsEl, 'Corrige les erreurs du formulaire.', 'error');
        return;
      }
      // Build order object
      const qty = Number(qtyInput.value);
      const total = currentProduct.price * qty;
      const order = {
        id: 'order_' + Date.now(),
        product: {
          id: currentProduct.id,
          name: currentProduct.name,
          price: currentProduct.price,
          img: currentProduct.img
        },
        qty,
        total,
        customer: {
          name: nameInput.value.trim(),
          phone: phoneInput.value.trim(),
          address: addrInput.value.trim()
        },
        createdAt: new Date().toISOString()
      };

      // save
      saveLastOrder(order);
      statusEl.textContent = 'Commande enregistrée ✅';
      showLastOrder(); // update UI section
      showMessage(form, 'Commande enregistrée avec succès.', 'success');
      // keep modal open so user can send to WhatsApp or close
    });

    // WhatsApp now button: open with prefilled message but do NOT auto-save order (if not saved, create temp order)
    waBtn.addEventListener('click', () => {
      statusEl.textContent = '';
      // validate fields but we may allow sending even if not saved; still require name+phone
      const qty = Number(qtyInput.value) || 1;
      if (!nameInput.value.trim() || !phoneInput.value.trim()) {
        errorsEl.innerHTML = '<div>• Le nom et le téléphone sont requis pour envoyer le message WhatsApp.</div>';
        return;
      }
      const total = currentProduct.price * qty;
      const order = {
        product: { name: currentProduct.name, price: currentProduct.price },
        qty,
        total,
        customer: {
          name: nameInput.value.trim(),
          phone: phoneInput.value.trim(),
          address: addrInput.value.trim()
        }
      };

      const message = buildWhatsAppMessage(order);
      // optional: send to business number (empty => opens generic chat)
      // If you want to set business number by default, provide it here (international format without +), e.g. '22501020304'
      const businessPhone = ''; // <-- put business number here if desired
      openWhatsApp(businessPhone, message);
    });
  }

  /* ---------------------------
     Build WhatsApp message text
     --------------------------- */
  function buildWhatsAppMessage(order) {
    // order: { product: {name, price}, qty, total, customer: {name, phone, address} }
    const lines = [];
    lines.push(`🧾 *Nouvelle commande*`);
    lines.push('');
    lines.push(`*Produit:* ${order.product.name}`);
    lines.push(`*Prix unitaire:* ${formatCurrency(order.product.price)} FCFA`);
    lines.push(`*Quantité:* ${order.qty}`);
    lines.push(`*Total:* ${formatCurrency(order.total)} FCFA`);
    lines.push('');
    lines.push(`*Infos client:*`);
    lines.push(`Nom: ${order.customer.name}`);
    lines.push(`Téléphone: ${order.customer.phone}`);
    if (order.customer.address) lines.push(`Adresse: ${order.customer.address}`);
    lines.push('');
    lines.push(`Merci — Répondre pour confirmer la commande.`);
    return lines.join('\n');
  }

  /* ---------------------------
     Show last order summary on the page
     (we add a section with id 'last-order' if not exists)
     --------------------------- */
  function showLastOrder() {
    let lastOrderSection = document.getElementById('last-order');
    const order = getLastOrder();
    if (!order) {
      // remove section if exists
      if (lastOrderSection) lastOrderSection.remove();
      return;
    }

    if (!lastOrderSection) {
      lastOrderSection = document.createElement('section');
      lastOrderSection.id = 'last-order';
      lastOrderSection.className = 'container';
      // insert after main or at end of body
      const main = document.querySelector('main');
      if (main && main.parentNode) {
        main.parentNode.insertBefore(lastOrderSection, main.nextSibling);
      } else {
        document.body.appendChild(lastOrderSection);
      }
    }

    lastOrderSection.innerHTML = `
      <div style="background:#fff;border:1px solid #e6e9ee;padding:16px;border-radius:8px;display:flex;gap:12px;align-items:center;">
        <img src="${order.product.img || ''}" alt="${order.product.name}" style="width:84px;height:64px;object-fit:cover;border-radius:6px;border:1px solid #eee;">
        <div style="flex:1">
          <div style="font-weight:700">${order.product.name} <span style="color:#0ea5e9">(${order.qty}×)</span></div>
          <div style="color:#374151;margin-top:6px">Total : <strong style="color:#0078d4">${formatCurrency(order.total)} FCFA</strong></div>
          <div style="color:#6b7280;margin-top:6px;font-size:13px">Client : ${order.customer.name} • ${order.customer.phone}</div>
        </div>
        <div style="display:flex;flex-direction:column;gap:8px;align-items:flex-end">
          <button id="wa-last-order" class="btn whatsapp-btn">WhatsApp</button>
          <button id="clear-last-order" class="btn">Supprimer</button>
        </div>
      </div>
    `;

    // style whatsapp button
    const waLastBtn = lastOrderSection.querySelector('#wa-last-order');
    if (waLastBtn) {
      waLastBtn.style.background = '#25D366';
      waLastBtn.style.color = '#fff';
      waLastBtn.style.fontWeight = '700';
      waLastBtn.innerHTML = `<svg width="18" height="18" viewBox="0 0 24 24" fill="none" aria-hidden="true" focusable="false"
          xmlns="http://www.w3.org/2000/svg"><path d="M20.52 3.48a11.94 11.94 0 10-16.9 16.9l-.9 3.3 3.4-.9a11.94 11.94 0 0014.4-19.3z" fill="#fff" opacity=".08"/><path d="M17.472 14.382c-.297-.149-1.76-.868-2.035-.968-.275-.1-.475-.149-.675.15-.198.297-.768.968-.94 1.166-.173.198-.347.223-.644.074-.297-.149-1.254-.463-2.388-1.475-.883-.787-1.48-1.758-1.652-2.056-.173-.298-.018-.459.131-.608.134-.133.298-.347.447-.52.149-.174.198-.298.298-.497.099-.198.05-.372-.025-.52-.075-.149-.675-1.626-.927-2.231-.246-.585-.497-.506-.675-.516l-.577-.01c-.198 0-.52.074-.793.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.064 2.877 1.212 3.074.149.198 2.092 3.2 5.07 4.487 1.305.563 2.323.898 3.122 1.149 1.31.407 2.5.35 3.441.213.525-.084 1.6-.653 1.826-1.287.224-.632.224-1.175.157-1.287-.066-.112-.244-.174-.54-.323z" fill="#fff"/></svg><span style="margin-left:6px">WhatsApp</span>`;
    }

    // attach events
    const waBtnElm = lastOrderSection.querySelector('#wa-last-order');
    if (waBtnElm) {
      waBtnElm.addEventListener('click', () => {
        const ord = getLastOrder();
        if (!ord) {
          alert('Aucune commande trouvée.');
          return;
        }
        const message = buildWhatsAppMessage(ord);
        const businessPhone = ''; // replace if needed
        openWhatsApp(businessPhone, message);
      });
    }

    const clearBtn = lastOrderSection.querySelector('#clear-last-order');
    if (clearBtn) {
      clearBtn.addEventListener('click', () => {
        if (!confirm('Supprimer le dernier récap de commande ?')) return;
        localStorage.removeItem('lastOrder');
        cartCount = 0;
        cartCountEl.textContent = cartCount;
        localStorage.setItem('cartCount', String(cartCount));
        showLastOrder();
      });
    }
  }

  /* ---------------------------
     "Ma commande" button behavior
     --------------------------- */
  viewCartBtn.addEventListener('click', () => {
    // If last order exists, show recap or open WhatsApp; here we display a quick summary + WhatsApp prompt
    const ord = getLastOrder();
    if (!ord) {
      alert('Ton panier est vide. Ajoute une commande depuis la fiche produit.');
      return;
    }
    // Show a simple modal-like prompt with options: ouvrir WhatsApp ou afficher récap dans page
    const message = `Récap commande:\nProduit: ${ord.product.name}\nQuantité: ${ord.qty}\nTotal: ${formatCurrency(ord.total)} FCFA\nClient: ${ord.customer.name} • ${ord.customer.phone}`;
    if (confirm(`${message}\n\nEnvoyer cette commande via WhatsApp ?`)) {
      const businessPhone = ''; // put business number if desired
      openWhatsApp(businessPhone, buildWhatsAppMessage(ord));
    }
  });

  /* ---------------------------
     Init
     --------------------------- */
  renderProducts();
  showLastOrder();

  // If modal exists ensure it's initially hidden
  if (modal) {
    modal.setAttribute('aria-hidden', 'true');
    modal.style.display = 'none';
  }

  /* ---------------------------
     Final developer checks (console)
     --------------------------- */
  console.log('app.js chargé — interactivité active (vanilla JS).');
});
