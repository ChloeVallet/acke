// Logique métier : regroupe les variantes Yapla en un seul produit.
// Pas de DOM, pas de réseau : uniquement des données en entrée et en sortie.

/**
 * Découpe le nom au format : "PRODUIT / GENRE / COULEUR / TAILLE"
 * et regroupe toutes les variantes d'un même produit.
 */
export function groupVariants(rawProducts) {
    const catalog = {};

    rawProducts.forEach(item => {
        const hasVariants = item.name.includes('/');

        if (!hasVariants) {
            const baseName = item.name.trim();
            catalog[baseName] = {
                name: baseName,
                isSimpleProduct: true,
                description: item.description,
                images: item.images || '',
                price: item.price,
                variants: [{
                    entryId: item.entryId,
                    gender: null,
                    color: null,
                    size: null,
                    price: item.price,
                    status: item.status
                }]
            };
        } else {
            const parts = item.name.split('/').map(p => p.trim());
            const baseName = parts[0] || item.name;

            if (!catalog[baseName]) {
                catalog[baseName] = {
                    name: baseName,
                    isSimpleProduct: false,
                    description: item.description,
                    images: item.images || '',
                    price: item.price,
                    variants: []
                };
            }

            catalog[baseName].variants.push({
                entryId: item.entryId,
                gender: parts[1] || 'Mixte',
                color: parts[2] || 'Unique',
                size: parts[3] || 'Taille unique',
                price: item.price,
                status: item.status
            });
        }
    });

    return Object.values(catalog);
}
