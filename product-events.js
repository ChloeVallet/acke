// Comportement des cartes : sélecteurs genre → couleur → taille, et bouton « Ajouter au panier »

import { createOption } from './utils.js';
import { ajouterAuPanierYapla } from './cart.js';

/**
 * Sélecteurs en cascade : le genre filtre les couleurs, la couleur filtre les tailles
 */
function bindVariantSelects(card, product) {
    const selectGenre = card.querySelector('[data-js="gender-select"]');
    const selectColor = card.querySelector('[data-js="color-select"]');
    const selectSize = card.querySelector('[data-js="size-select"]');

    const resetSelect = (select, placeholderText) => {
        select.innerHTML = ''; // sûr ici : aucune donnée produit, juste un reset
        const placeholder = createOption('', placeholderText, true);
        placeholder.selected = true;
        select.appendChild(placeholder);
    };

    const updateColors = () => {
        const selectedGender = selectGenre.value;
        const filteredVariants = product.variants.filter(v => v.gender === selectedGender);
        const colors = [...new Set(filteredVariants.map(v => v.color))];

        resetSelect(selectColor, 'Sélectionner la couleur');
        colors.forEach(c => selectColor.appendChild(createOption(c, c)));
        selectColor.disabled = false;

        resetSelect(selectSize, 'Sélectionner la taille');
        selectSize.disabled = true;

        if (colors.length === 1) {
            selectColor.value = colors[0];
            updateSizes();
        }
    };

    const updateSizes = () => {
        const selectedGender = selectGenre.value;
        const selectedColor = selectColor.value;

        const filteredVariants = product.variants.filter(
            v => v.gender === selectedGender && v.color === selectedColor
        );

        resetSelect(selectSize, 'Sélectionner la taille');
        filteredVariants.forEach(v => {
            const estDispo = v.status === 'Disponible';
            const label = estDispo ? v.size : `${v.size} (Épuisé)`;
            selectSize.appendChild(createOption(v.entryId, label, !estDispo));
        });
        selectSize.disabled = false;

        if (filteredVariants.length === 1) {
            selectSize.value = filteredVariants[0].entryId;
        }
    };

    selectGenre.addEventListener('change', updateColors);
    selectColor.addEventListener('change', updateSizes);

    // Présélection quand il n'y a qu'un seul choix possible
    const genres = [...new Set(product.variants.map(v => v.gender))];
    if (genres.length === 1) {
        selectGenre.value = genres[0];
        updateColors();
    }

    const colors = [...new Set(product.variants.map(v => v.color))];
    if (colors.length === 1) {
        selectColor.value = colors[0];
        updateSizes();
    }
}

function bindAddToCart(card, product) {
    const btnAddToCart = card.querySelector('.add-to-cart');
    let isSubmitting = false; // verrou logique, plus fiable que le seul attribut disabled

    btnAddToCart.addEventListener('click', () => {
        if (isSubmitting) return;

        let selectedEntryId = null;

        if (product.isSimpleProduct) {
            const hiddenInput = card.querySelector('[data-js="single-entry-id"]');
            selectedEntryId = hiddenInput ? hiddenInput.value : null;
        } else {
            const selectSize = card.querySelector('[data-js="size-select"]');
            selectedEntryId = selectSize ? selectSize.value : null;
        }

        isSubmitting = true;
        ajouterAuPanierYapla(selectedEntryId, btnAddToCart, () => { isSubmitting = false; });
    });
}

export function bindEvents(container, products) {
    const cards = container.getElementsByClassName('product');

    Array.from(cards).forEach(card => {
        const productIndex = card.getAttribute('data-product-index');
        const product = products[productIndex];

        if (!product.isSimpleProduct) {
            bindVariantSelects(card, product);
        }
        bindAddToCart(card, product);
    });
}
