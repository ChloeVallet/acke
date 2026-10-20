// Description d'un produit sur la carte + bouton « Voir plus »

import { openDescriptionModal } from './product-modal.js';

function createMoreButton(product) {
    const btn = document.createElement('button');
    btn.type = 'button';
    btn.className = 'product-more';
    btn.textContent = 'Voir plus';
    btn.hidden = true; // affiché seulement si le texte est coupé (voir updateMoreButtons)
    btn.addEventListener('click', () => openDescriptionModal(product));
    return btn;
}

export function createDescription(product) {
    const wrap = document.createElement('div');
    wrap.className = 'product-description-wrap';

    const p = document.createElement('p');
    p.className = 'product-description'; // le clamp de Yapla s'applique tel quel
    p.textContent = product.description || '';

    wrap.append(p, createMoreButton(product));
    return wrap;
}

/**
 * Affiche « Voir plus » uniquement sur les cartes dont la description est coupée
 */
export function updateMoreButtons(container) {
    container.querySelectorAll('.product-description-wrap').forEach((wrap) => {
        const desc = wrap.querySelector('.product-description');
        const btn = wrap.querySelector('.product-more');
        if (!desc || !btn) return;
        // Texte coupé par le clamp = contenu plus haut que la zone visible
        btn.hidden = desc.scrollHeight <= desc.clientHeight + 1;
    });
}
