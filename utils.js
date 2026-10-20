// Petites fonctions utilitaires, sans logique métier

/**
 * Valide qu'une URL d'image utilise un schéma sûr (http, https, ou relative).
 * Bloque notamment javascript: et data: pour éviter tout détournement.
 * Retournée telle quelle (non échappée) : elle est affectée via .src, jamais injectée dans du HTML.
 */
export function sanitizeImageUrl(url) {
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
 * Crée un <option> avec value/texte en toute sécurité (pas d'innerHTML)
 */
export function createOption(value, label, disabled = false) {
    const opt = document.createElement('option');
    opt.value = value;
    opt.textContent = label;
    if (disabled) opt.disabled = true;
    return opt;
}

/**
 * Construit un <select> vide avec son option placeholder
 */
export function createPlaceholderSelect(id, className, dataJs, placeholderText, disabled = false) {
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

/**
 * Conteneur de la liste de produits (ou undefined s'il n'existe pas sur la page)
 */
export function getProductsContainer() {
    return document.getElementsByClassName('products')[0];
}

/**
 * Affiche un message d'état (chargement / erreur) dans le conteneur produits
 */
export function renderMessage(message, isError = false) {
    const container = getProductsContainer();
    if (!container) return;
    container.innerHTML = '';
    const p = document.createElement('p');
    p.className = isError ? 'boutique-error' : 'boutique-loading';
    p.textContent = message;
    container.appendChild(p);
}
