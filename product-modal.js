// Modale « description complète » (photo à gauche, texte à droite, croix en haut à droite)

import { sanitizeImageUrl } from './utils.js';

let descriptionDialog = null;

export function openDescriptionModal(product) {
    if (!descriptionDialog) {
        descriptionDialog = document.createElement('dialog');
        descriptionDialog.className = 'product-modal';
        // Clic sur le fond sombre = fermeture
        descriptionDialog.addEventListener('click', (e) => {
            if (e.target === descriptionDialog) descriptionDialog.close();
        });
        document.body.appendChild(descriptionDialog);
    }

    descriptionDialog.innerHTML = '';

    const inner = document.createElement('div');
    inner.className = 'product-modal-inner';

    // Croix de fermeture (haut à droite)
    const closeBtn = document.createElement('button');
    closeBtn.type = 'button';
    closeBtn.className = 'product-modal-close';
    closeBtn.setAttribute('aria-label', 'Fermer');
    closeBtn.textContent = '×';
    closeBtn.addEventListener('click', () => descriptionDialog.close());
    inner.appendChild(closeBtn);

    // Colonne gauche : photo
    const safeImageUrl = sanitizeImageUrl(product.images);
    if (safeImageUrl) {
        const media = document.createElement('div');
        media.className = 'product-modal-media';
        const img = document.createElement('img');
        img.src = safeImageUrl;
        img.alt = product.name || '';
        media.appendChild(img);
        inner.appendChild(media);
    }

    // Colonne droite : titre + description
    const body = document.createElement('div');
    body.className = 'product-modal-body';

    const title = document.createElement('div');
    title.className = 'product-modal-title';
    title.textContent = product.name;

    const text = document.createElement('div');
    text.className = 'product-modal-text';
    text.textContent = product.description;

    body.append(title, text);
    inner.appendChild(body);

    descriptionDialog.appendChild(inner);
    descriptionDialog.showModal();
}
