// Ajout au panier Yapla (mutation GraphQL)

import { GRAPHQL_ENDPOINT } from './config.js';

const ADD_TO_CART_MUTATION = `mutation($productId: Int!) {
    addProductToCart(productId: $productId) {
        inputErrors { message name }
    }
}`;

export function ajouterAuPanierYapla(entryId, btnElement, onDone) {
    if (!entryId) {
        alert('Veuillez sélectionner un genre, une couleur et une taille.');
        if (onDone) onDone();
        return;
    }

    const productId = parseInt(entryId, 10);
    if (isNaN(productId) || productId <= 0) {
        alert("Impossible d'ajouter l'article au panier.");
        if (onDone) onDone();
        return;
    }

    if (btnElement) btnElement.disabled = true;

    fetch(GRAPHQL_ENDPOINT, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
            query: ADD_TO_CART_MUTATION,
            variables: { productId: productId }
        })
    })
        .then(res => res.json())
        .then(data => {
            const inputErrors = data.data?.addProductToCart?.inputErrors;
            if (data.errors || (inputErrors && inputErrors.length > 0)) {
                alert("Impossible d'ajouter l'article au panier.");
            }
        })
        .catch(() => {
            alert("Impossible d'ajouter l'article au panier.");
        })
        .finally(() => {
            if (btnElement) btnElement.disabled = false;
            if (onDone) onDone();
        });
}
