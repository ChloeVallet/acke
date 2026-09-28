(function () {
    'use strict';

    const GRAPHQL_ENDPOINT = 'https://acke-kerian.s2.yapla.com/fr/graphql';
    const MAX_PAGES = 20; // marge large ; un avertissement est loggué si la limite est atteinte
    const querySchema = `
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
     * Valide qu'une URL d'image utilise un schéma sûr (http, https, ou relative).
     * Bloque notamment javascript: et data: pour éviter tout détournement.
     * Retournée telle quelle (non échappée) : elle est affectée via .src, jamais injectée dans du HTML.
     */
    function sanitizeImageUrl(url) {
        if (!url) return '';
        const trimmed = String(url).trim();
        // Autorise http(s):// et les URLs relatives (/, ./, sans schéma)
        if (/^https?:\/\//i.test(trimmed) || /^\/(?!\/)/.test(trimmed) || /^\.\//.test(trimmed)) {
            return trimmed;
        }
        console.warn('URL image ignorée (schéma non autorisé) :', trimmed);
        return '';
    }

    /**
     * Affiche un message d'état (chargement / erreur) dans le conteneur produits
     */
    function renderMessage(message, isError = false) {
        const container = document.getElementsByClassName('products')[0];
        if (!container) return;
        container.innerHTML = '';
        const p = document.createElement('p');
        p.className = isError ? 'boutique-error' : 'boutique-loading';
        p.textContent = message;
        container.appendChild(p);
    }

    /**
     * Récupère l'intégralité du catalogue Yapla en enchaînant les requêtes paginées
     */
    async function fetchAllProducts(pageSize = 100) {
        let allProductsRaw = [];
        let hasNextPage = true;
        let cursor = null;
        let pageCount = 0;

        try {
            while (hasNextPage && pageCount < MAX_PAGES) {
                pageCount++;
                const response = await fetch(GRAPHQL_ENDPOINT, {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({
                        query: querySchema,
                        variables: { first: pageSize, last: null, after: cursor, before: null }
                    })
                });

                if (!response.ok) {
                    console.error('Réponse HTTP non-OK :', response.status);
                    renderMessage("Impossible de charger la boutique pour le moment.", true);
                    return;
                }

                const resData = await response.json();

                if (resData.errors) {
                    console.error('Erreur GraphQL pendant la pagination :', resData.errors);
                    renderMessage("Impossible de charger la boutique pour le moment.", true);
                    return;
                }

                if (!resData.data || !resData.data.products) {
                    console.error('Réponse inattendue (pas de données products) :', resData);
                    renderMessage("Impossible de charger la boutique pour le moment.", true);
                    return;
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

            const groupedProducts = groupVariants(allProductsRaw);
            renderBoutique(groupedProducts);

        } catch (err) {
            console.error('Erreur réseau lors de la récupération :', err);
            renderMessage("Impossible de charger la boutique pour le moment.", true);
        }
    }

    /**
     * Découpe le nom au format : "PRODUIT / GENRE / COULEUR / TAILLE"
     */
    function groupVariants(rawProducts) {
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

    function renderBoutique(products) {
        const container = document.getElementsByClassName('products')[0];
        if (!container) return;

        container.innerHTML = '';

        if (products.length === 0) {
            renderMessage('Aucun produit disponible pour le moment.');
            return;
        }

        products.forEach((product, idx) => container.appendChild(createProductCardHTML(product, idx)));
        container.classList.add('new-products');

        bindEvents(container, products);
    }

    /**
     * Crée un <option> avec value/texte en toute sécurité (pas d'innerHTML)
     */
    function createOption(value, label, disabled = false) {
        const opt = document.createElement('option');
        opt.value = value;
        opt.textContent = label;
        if (disabled) opt.disabled = true;
        return opt;
    }

    /**
     * Construit un <select> vide avec son option placeholder
     */
    function createPlaceholderSelect(id, className, dataJs, placeholderText, disabled = false) {
        const select = document.createElement('select');
        select.id = id;
        select.className = className;
        select.setAttribute('data-js', dataJs);
        if (disabled) select.disabled = true;

        const placeholder = createOption('', placeholderText, true);
        placeholder.selected = true;
        select.appendChild(placeholder);

        return select;
    }

    function createProductCardHTML(product, index) {
        const card = document.createElement('div');
        card.className = 'product';
        card.setAttribute('data-product-index', index);

        // --- Image + prix ---
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

        card.appendChild(imageContainer);

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

        const description = document.createElement('p');
        description.className = 'product-description';
        description.textContent = product.description;
        detailContainer.appendChild(description);

        // --- Sélecteurs (genre / couleur / taille) ou entryId unique ---
        if (product.isSimpleProduct) {
            const hiddenInput = document.createElement('input');
            hiddenInput.type = 'hidden';
            hiddenInput.setAttribute('data-js', 'single-entry-id');
            hiddenInput.value = product.variants[0].entryId;
            detailContainer.appendChild(hiddenInput);
        } else {
            const genres = [...new Set(product.variants.map(v => v.gender))];

            const genreWrapper = document.createElement('div');
            genreWrapper.className = 'input-select';
            genreWrapper.style.marginTop = '10px';
            const selectGenre = createPlaceholderSelect(
                `genre-${index}`, 'form-control', 'gender-select', 'Sélectionner le genre'
            );
            genres.forEach(g => selectGenre.appendChild(createOption(g, g)));
            genreWrapper.appendChild(selectGenre);
            detailContainer.appendChild(genreWrapper);

            const colorWrapper = document.createElement('div');
            colorWrapper.className = 'input-select';
            colorWrapper.style.marginTop = '10px';
            const selectColor = createPlaceholderSelect(
                `couleur-${index}`, 'form-control', 'color-select', 'Sélectionner la couleur', true
            );
            colorWrapper.appendChild(selectColor);
            detailContainer.appendChild(colorWrapper);

            const sizeWrapper = document.createElement('div');
            sizeWrapper.className = 'input-select';
            sizeWrapper.style.marginTop = '10px';
            const selectSize = createPlaceholderSelect(
                `taille-${index}`, 'form-control', 'size-select', 'Sélectionner la taille', true
            );
            sizeWrapper.appendChild(selectSize);
            detailContainer.appendChild(sizeWrapper);
        }

        // --- Bouton d'ajout au panier ---
        const btnWrapper = document.createElement('div');
        btnWrapper.style.marginTop = '15px';

        const btn = document.createElement('button');
        btn.type = 'button';
        btn.className = 'v-btn btn btn-secondary add-to-cart';

        const icon = document.createElement('i');
        icon.className = 'fa-regular fa-cart-circle-plus';
        icon.setAttribute('aria-hidden', 'true');
        btn.appendChild(icon);
        btn.appendChild(document.createTextNode(' Ajouter au panier'));

        btnWrapper.appendChild(btn);
        detailContainer.appendChild(btnWrapper);

        content.appendChild(detailContainer);
        card.appendChild(content);

        return card;
    }

    function bindEvents(container, products) {
        const cards = container.getElementsByClassName('product');

        Array.from(cards).forEach(card => {
            const productIndex = card.getAttribute('data-product-index');
            const product = products[productIndex];
            const btnAddToCart = card.querySelector('.add-to-cart');
            let isSubmitting = false; // verrou logique, plus fiable que le seul attribut disabled

            if (!product.isSimpleProduct) {
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
        });
    }

    function ajouterAuPanierYapla(entryId, btnElement, onDone) {
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
                query: `mutation($productId: Int!) {
            addProductToCart(productId: $productId) {
              inputErrors { message name }
            }
          }`,
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

    fetchAllProducts();

})();