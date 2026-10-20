// Construction du HTML d'une carte produit (DOM uniquement, aucun événement ici :
// les événements sont branchés ensuite par product-events.js)

import { sanitizeImageUrl, createOption, createPlaceholderSelect } from './utils.js';
import { createDescription } from './product-description.js';

/**
 * Image du produit + pastille de prix
 */
function createImageBlock(product) {
    const imageContainer = document.createElement('div');
    imageContainer.className = 'product-image-container';

    const img = document.createElement('img');
    img.className = 'product-image';
    const safeImageUrl = sanitizeImageUrl(product.images);
    if (safeImageUrl) img.src = safeImageUrl;
    img.alt = product.name || '';
    imageContainer.appendChild(img);

    const priceEl = document.createElement('p');
    priceEl.className = 'product-price';
    priceEl.textContent = `${product.price} €`;
    imageContainer.appendChild(priceEl);

    return imageContainer;
}

/**
 * Un champ <select> dans son wrapper Yapla (genre, couleur ou taille)
 */
function createSelectField(id, dataJs, placeholderText, disabled, values = []) {
    const wrapper = document.createElement('div');
    wrapper.className = 'input-select';
    wrapper.style.marginTop = '10px';

    const select = createPlaceholderSelect(id, 'form-control', dataJs, placeholderText, disabled);
    values.forEach(v => select.appendChild(createOption(v, v)));

    wrapper.appendChild(select);
    return wrapper;
}

/**
 * Produit simple : un identifiant caché. Produit à variantes : 3 sélecteurs.
 */
function appendVariantFields(detailContainer, product, index) {
    if (product.isSimpleProduct) {
        const hiddenInput = document.createElement('input');
        hiddenInput.type = 'hidden';
        hiddenInput.setAttribute('data-js', 'single-entry-id');
        hiddenInput.value = product.variants[0].entryId;
        detailContainer.appendChild(hiddenInput);
        return;
    }

    const genres = [...new Set(product.variants.map(v => v.gender))];

    detailContainer.appendChild(
        createSelectField(`genre-${index}`, 'gender-select', 'Sélectionner le genre', false, genres)
    );
    detailContainer.appendChild(
        createSelectField(`couleur-${index}`, 'color-select', 'Sélectionner la couleur', true)
    );
    detailContainer.appendChild(
        createSelectField(`taille-${index}`, 'size-select', 'Sélectionner la taille', true)
    );
}

function createAddToCartBlock() {
    const btnWrapper = document.createElement('div');
    btnWrapper.style.marginTop = '15px';
    btnWrapper.style.textAlign = 'center';

    const btn = document.createElement('button');
    btn.type = 'button';
    btn.className = 'v-btn btn btn-secondary add-to-cart';

    const icon = document.createElement('i');
    icon.className = 'fa-regular fa-cart-circle-plus';
    icon.setAttribute('aria-hidden', 'true');
    btn.appendChild(icon);
    btn.appendChild(document.createTextNode(' Ajouter au panier'));

    btnWrapper.appendChild(btn);
    return btnWrapper;
}

export function createProductCardHTML(product, index) {
    const card = document.createElement('div');
    card.className = 'product';
    card.setAttribute('data-product-index', index);

    card.appendChild(createImageBlock(product));

    // --- Contenu ---
    const content = document.createElement('div');
    content.className = 'product-content';

    const detailContainer = document.createElement('div');
    detailContainer.className = 'product-detail-container';

    const detail = document.createElement('div');
    detail.className = 'product-detail';
    const title = document.createElement('p');
    title.className = 'product-title';
    title.textContent = product.name;
    detail.appendChild(title);
    detailContainer.appendChild(detail);

    detailContainer.appendChild(createDescription(product));
    appendVariantFields(detailContainer, product, index);
    detailContainer.appendChild(createAddToCartBlock());

    content.appendChild(detailContainer);
    card.appendChild(content);

    return card;
}
