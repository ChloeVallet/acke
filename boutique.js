// Point d'entrée : charge le catalogue, le regroupe, l'affiche.
// À charger sur la page avec : <script type="module" src=".../boutique/boutique.js"></script>

import { fetchAllProducts } from './api.js';
import { groupVariants } from './catalog.js';
import { createProductCardHTML } from './product-card.js';
import { bindEvents } from './product-events.js';
import { updateMoreButtons } from './product-description.js';
import { getProductsContainer, renderMessage } from './utils.js';

const LOAD_ERROR_MESSAGE = 'Impossible de charger la boutique pour le moment.';

function renderBoutique(products) {
    const container = getProductsContainer();
    if (!container) return;

    container.innerHTML = '';

    if (products.length === 0) {
        renderMessage('Aucun produit disponible pour le moment.');
        return;
    }

    products.forEach((product, idx) => container.appendChild(createProductCardHTML(product, idx)));
    container.classList.add('new-products');

    bindEvents(container, products);
    updateMoreButtons(container);

    // La police web peut changer la hauteur du texte : on recalcule quand elle est chargée
    if (document.fonts && document.fonts.ready) {
        document.fonts.ready.then(() => updateMoreButtons(container));
    }
}

async function init() {
    try {
        const rawProducts = await fetchAllProducts();
        renderBoutique(groupVariants(rawProducts));
    } catch (err) {
        console.error('Erreur lors du chargement de la boutique :', err);
        renderMessage(LOAD_ERROR_MESSAGE, true);
    }
}

// Recalcule « Voir plus » quand la largeur change (pas à chaque défilement mobile)
function watchResize() {
    let lastWidth = window.innerWidth;
    window.addEventListener('resize', () => {
        if (window.innerWidth === lastWidth) return;
        lastWidth = window.innerWidth;
        const container = getProductsContainer();
        if (container) updateMoreButtons(container);
    });
}

watchResize();
init();
