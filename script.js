'use strict';

// Renseignez votre numéro WhatsApp complet avec indicatif, sans + ni espaces.
// Exemple Côte d'Ivoire: 2250700000000
const WHATSAPP_NUMBER = '2250777416001'; // TODO: Remplacez par votre numéro

const products = [
    { id: 'dahlia', name: 'Dahlia', image: 'fleur dahila.png', price: 13500, description: 'Dahlia lumineux pour illuminer vos espaces.' },
    { id: 'lotus', name: 'Lotus (Nerium Oleander)', image: 'fleur lotus-neriumoleander.png', price: 15000, description: 'Élégance et pureté, un classique intemporel.' },
    { id: 'pandy', name: 'Pansy', image: 'fleur pansy.png', price: 10000, description: 'Délicat et coloré, parfait pour offrir.' },
    { id: 'f1', name: 'Bouquet Classique', image: 'fleur1.png', price: 20000, description: 'Un bouquet classique pour toutes les occasions.' },
    { id: 'f2', name: 'Bouquet Romance', image: 'fleur2.png', price: 17000, description: 'Notes roses et rouges pour dire je t\'aime.' },
    { id: 'f3', name: 'Bouquet Soleil', image: 'fleur3.png', price: 16200, description: 'Tons jaunes et orangés, énergie positive.' },
    { id: 'f4', name: 'Bouquet Pastel', image: 'fleur4.png', price: 10800, description: 'Douceur pastel et charme discret.' },
    { id: 'f5', name: 'Bouquet Prestige', image: 'fleur5.png', price: 19500, description: 'Composition généreuse pour moments d\'exception.' },
];

const formatCFA = (value) => `${value.toLocaleString('fr-FR')} CFA`;

const grid = document.getElementById('product-grid');
const yearEl = document.getElementById('year');
if (yearEl) yearEl.textContent = new Date().getFullYear();

function renderProducts(){
    if(!grid) return;
    grid.innerHTML = products.map(p => `
        <div class="card" data-id="${p.id}">
            <img src="${p.image}" alt="${p.name}">
            <div class="content">
                <h4>${p.name}</h4>
                <div class="price">${formatCFA(p.price)}</div>
                <div class="actions">
                    <button class="btn btn-view" data-action="view" data-id="${p.id}">Voir</button>
                    <button class="btn btn-buy" data-action="buy" data-id="${p.id}">Commander</button>
                </div>
            </div>
        </div>
    `).join('');
}

renderProducts();

// Modals
const viewModal = document.getElementById('view-modal');
const buyModal = document.getElementById('buy-modal');

function openModal(modal){
    if(!modal) return;
    modal.setAttribute('aria-hidden', 'false');
}
function closeModal(modal){
    if(!modal) return;
    modal.setAttribute('aria-hidden', 'true');
}

function findProduct(id){
    return products.find(p => p.id === id);
}

// View details
function onView(id){
    const p = findProduct(id);
    if(!p) return;
    document.getElementById('view-image').src = p.image;
    document.getElementById('view-image').alt = p.name;
    document.getElementById('view-name').textContent = p.name;
    document.getElementById('view-price').textContent = formatCFA(p.price);
    document.getElementById('view-desc').textContent = p.description;
    openModal(viewModal);
}

// Buy flow
let currentProductId = null;
function onBuy(id){
    const p = findProduct(id);
    if(!p) return;
    currentProductId = id;
    document.getElementById('buy-image').src = p.image;
    document.getElementById('buy-image').alt = p.name;
    document.getElementById('buy-name').textContent = p.name;
    document.getElementById('buy-price').textContent = formatCFA(p.price);
    openModal(buyModal);
}

// Delegated clicks
if (grid) {
    grid.addEventListener('click', (e) => {
        const target = e.target;
        if(!(target instanceof HTMLElement)) return;
        const action = target.getAttribute('data-action');
        const id = target.getAttribute('data-id');
        if(action === 'view' && id) onView(id);
        if(action === 'buy' && id) onBuy(id);
    });
}

// Close modal on backdrop or X
[...document.querySelectorAll('[data-close-modal]')].forEach(el => {
    el.addEventListener('click', () => {
        closeModal(viewModal);
        closeModal(buyModal);
    });
});

// WhatsApp order submission
const orderForm = document.getElementById('order-form');
if (orderForm) {
    orderForm.addEventListener('submit', (e) => {
        e.preventDefault();
        if(!currentProductId) return;
        const p = findProduct(currentProductId);
        if(!p) return;
        const quantity = parseInt(document.getElementById('quantity').value || '1', 10);
        const fullName = document.getElementById('fullName').value.trim();
        const phone = document.getElementById('phone').value.trim();
        const address = document.getElementById('address').value.trim();
        const note = document.getElementById('note').value.trim();

        const total = p.price * Math.max(1, quantity);
        const lines = [
            "Bonjour, je souhaite passer une commande depuis Atelier de fleurs:",
            `• Produit: ${p.name}`,
            `• Prix unitaire: ${formatCFA(p.price)}`,
            `• Quantité: ${quantity}`,
            `• Total: ${formatCFA(total)}`,
            "---",
            `Nom: ${fullName}`,
            `Téléphone: ${phone}`,
            `Adresse: ${address}`,
            note ? `Message: ${note}` : null
        ].filter(Boolean);

        const message = encodeURIComponent(lines.join('\n'));
        const url = `https://wa.me/${WHATSAPP_NUMBER}?text=${message}`;
        window.open(url, '_blank');
    });
}
