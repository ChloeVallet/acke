// Lecture du catalogue Yapla (GraphQL). Aucune manipulation du DOM ici :
// en cas de problème, la fonction lève une erreur, c'est boutique.js qui l'affiche.

import { GRAPHQL_ENDPOINT, MAX_PAGES } from './config.js';

const PRODUCTS_QUERY = `
    query($first: Int, $after: String, $last: Int, $before: String) {
        products: allProductEntries(first: $first, after: $after, last: $last, before: $before) {
            edges {
                node {
                    entryId
                    name
                    description
                    price
                    images
                    status
                }
                cursor
            }
            pageInfo {
                hasNextPage
                hasPreviousPage
                endCursor
                startCursor
            }
        }
    }
`;

/**
 * Récupère l'intégralité du catalogue Yapla en enchaînant les requêtes paginées
 * @returns {Promise<Array>} la liste brute des produits (une entrée = une variante)
 */
export async function fetchAllProducts(pageSize = 100) {
    let allProductsRaw = [];
    let hasNextPage = true;
    let cursor = null;
    let pageCount = 0;

    while (hasNextPage && pageCount < MAX_PAGES) {
        pageCount++;
        const response = await fetch(GRAPHQL_ENDPOINT, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                query: PRODUCTS_QUERY,
                variables: { first: pageSize, last: null, after: cursor, before: null }
            })
        });

        if (!response.ok) {
            throw new Error(`Réponse HTTP non-OK : ${response.status}`);
        }

        const resData = await response.json();

        if (resData.errors) {
            throw new Error('Erreur GraphQL pendant la pagination : ' + JSON.stringify(resData.errors));
        }

        if (!resData.data || !resData.data.products) {
            throw new Error('Réponse inattendue (pas de données products)');
        }

        const productsData = resData.data.products;
        const currentBatch = productsData.edges.map(e => e.node);
        allProductsRaw = allProductsRaw.concat(currentBatch);

        hasNextPage = productsData.pageInfo.hasNextPage;

        if (cursor === productsData.pageInfo.endCursor && hasNextPage) {
            console.warn('Curseur de pagination stagnant, arrêt anticipé.');
            break;
        }
        cursor = productsData.pageInfo.endCursor;
    }

    if (hasNextPage && pageCount >= MAX_PAGES) {
        console.warn(`Limite de pagination atteinte (${MAX_PAGES} pages) : le catalogue affiché peut être incomplet.`);
    }

    return allProductsRaw;
}
