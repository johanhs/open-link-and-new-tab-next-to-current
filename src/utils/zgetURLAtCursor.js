if (typeof Promise.withResolvers !== 'function') {
    Promise.withResolvers = function () {
        let resolve, reject;
        const promise = new Promise((res, rej) => {
            resolve = res;
            reject = rej;
        });
        return { promise, resolve, reject };
    };
}

var zisString = (arg) => typeof arg === 'string' || arg instanceof String;
var zisArray = (arg) => Array.isArray(arg);

// Domain pattern (excludes IP-like patterns)
var ZDOMAIN_PATTERN = /^([a-zA-Z0-9]([a-zA-Z0-9-]*[a-zA-Z0-9])?\.)+[a-zA-Z]{2,}(\/.*)?$/;

// IP pattern (more specific)
var ZIP_PATTERN = /^(\d{1,3}\.){3}\d{1,3}(:\d+)?(\/.*)?$/;

// Only use whitespace as definite delimiters
var ZURL_DELIMITERS = [' ', '\n', '\t', '\r'];

var zisValidURL = (arg) => {
    try {
        const zurl = new URL(arg);
        if (zurl.origin && zurl.origin !== 'null' && zurl.host) return true;
        return false;
    } catch (err) {
        return false;
    }
};

var zconvertURLToHTTPS = (url) => url.replace(/^http:/i, 'https:');

var ZWWWDOT = 'www.';
var ZSCHEME_AUTHORITY_SEPARATOR = '://';

var zstartsWithWWWDOT = (url) => {
    if (!zisString(url)) return false;
    if (url.slice(0, 4).toLowerCase().startsWith(ZWWWDOT)) return true;
    return false;
};

var zconvertURLToHTTPSIfNeeded = (arg) => {
    let url = arg;
    if (zstartsWithWWWDOT(url)) url = `https://${url}`;
    else url = zconvertURLToHTTPS(url);
    return url;
};

var zvalidateAndFormatURL = (text) => {
    // Case 1: Already has a protocol
    if (text.includes(ZSCHEME_AUTHORITY_SEPARATOR)) {
        if (zisValidURL(text)) return zconvertURLToHTTPSIfNeeded(text);
    }

    // Case 2: Starts with www.
    if (zstartsWithWWWDOT(text)) {
        const withProtocol = `https://${text}`;
        if (zisValidURL(withProtocol)) return withProtocol;
    }

    // Extract just the domain/host part for testing
    let hostPart = text;
    const slashIndex = text.indexOf('/');
    if (slashIndex > 0) {
        hostPart = text.substring(0, slashIndex);
    }

    // Case 3: Domain name pattern (something.tld)
    // Domain must have a TLD with alphabetic characters (not just numbers)
    if (ZDOMAIN_PATTERN.test(hostPart)) {
        const withProtocol = `https://${text}`;
        if (zisValidURL(withProtocol)) return withProtocol;
    }

    // Case 4: IP address
    if (ZIP_PATTERN.test(hostPart)) {
        // Use HTTP for IP addresses by default
        const withProtocol = `http://${text}`;
        if (zisValidURL(withProtocol)) return withProtocol;
    }

    // Last resort: Try with https:// anyway if it has a dot and might be a domain
    if (text.includes('.') && !text.includes(' ')) {
        const withProtocol = `https://${text}`;
        if (zisValidURL(withProtocol)) return withProtocol;
    }

    return null;
};

var zgetURLFromCaretPosition = (caretPosition) => {
    if (!caretPosition?.offsetNode?.textContent) return null;

    const text = caretPosition.offsetNode.textContent;
    const offset = caretPosition.offset;

    // Find start of the potential URL
    let startPos = offset;
    while (startPos > 0) {
        if (ZURL_DELIMITERS.includes(text[startPos - 1])) break;
        startPos--;
    }

    // Find end of the potential URL
    let endPos = offset;
    while (endPos < text.length) {
        if (ZURL_DELIMITERS.includes(text[endPos])) break;
        endPos++;
    }

    // Extract the potential URL
    let potentialURL = text.substring(startPos, endPos).trim();

    // Clean up common issues
    potentialURL = potentialURL.replace(/\.$/, ''); // Remove trailing period

    if (!potentialURL) return null;

    // Check if it's a valid URL (with or without protocol)
    return zvalidateAndFormatURL(potentialURL);
};

var zgetAllElements = (arg, rootElement) => {
    const rootEl = rootElement ? rootElement : document;
    let searchString = '';
    if (rootElement && rootElement !== document && rootEl.nodeName !== '#document-fragment') {
        if (zisString(arg)) searchString = `:scope ${arg}`;
        else if (zisArray(arg)) searchString = arg.map((sel) => `:scope ${sel}`).join(', ');
    } else searchString = zisArray(arg) ? arg.join(', ') : arg;
    const elements = rootEl.querySelectorAll(searchString);
    return Array.from(elements);
};

var zgetAllChildren = (el) => {
    let newChildren = [];
    const allChildren = zgetAllElements('*', el);
    allChildren.forEach((c) => {
        newChildren.push(c);
        if (c.shadowRoot) {
            const shadowChildren = zgetAllChildren(c.shadowRoot);
            newChildren = newChildren.concat(shadowChildren);
        }
        if (c.nodeName === 'IFRAME' && c?.contentDocument) {
            const iframeChildren = zgetAllChildren(c.contentDocument);
            newChildren = newChildren.concat(iframeChildren);
        }
    });
    return newChildren;
};

var zgetAllElementsIncludingShadowRootsAndIframes = (rootElement) => {
    const rootEl = rootElement ? rootElement : document;
    let ztot = [];
    zgetAllElements('*', rootEl).forEach((el) => {
        ztot.push(el);
        if (el.shadowRoot) {
            const shadowChildren = zgetAllChildren(el.shadowRoot);
            ztot = ztot.concat(shadowChildren);
        }
        if (el.nodeName === 'IFRAME' && el.contentDocument) {
            const iframeChildren = zgetAllChildren(el.contentDocument);
            ztot = ztot.concat(iframeChildren);
        }
    });
    if ('shadowRoot' in rootEl && rootEl.shadowRoot) {
        const rootElShadowChildren = zgetAllChildren(rootEl.shadowRoot);
        ztot = ztot.concat(rootElShadowChildren);
    }
    if (rootEl.nodeName === 'IFRAME' && rootEl.contentDocument) {
        const rootElIframeChildren = zgetAllChildren(rootEl.contentDocument);
        ztot = ztot.concat(rootElIframeChildren);
    }

    return ztot;
};

var zgetAllElementsIncludingShadowRootsAndIframesBySelector = (selectors, rootElement) => {
    const allElements = zgetAllElementsIncludingShadowRootsAndIframes(rootElement, []);
    const allMatchingElements = allElements.filter((el) => el.matches(selectors));
    return allMatchingElements;
};

var zpointerMovePromise = null;

var zpointerMoveListener = (e) => {
    let res = null;
    const { clientX, clientY } = e;
    if (document.caretPositionFromPoint) {
        const caretPosition = document.caretPositionFromPoint(clientX, clientY);
        const validURL = zgetURLFromCaretPosition(caretPosition);
        if (validURL) res = validURL;
    }
    if (!zpointerMovePromise?.resolve) console.warn('no resolve in zpointerMovePromise!', zpointerMovePromise);
    else {
        zpointerMovePromise.resolve(res);
        zpointerMovePromise = null;
    }
};

var zgetURLAtCursorAsync = async () => {
    const hoveredAnchors = zgetAllElementsIncludingShadowRootsAndIframesBySelector('a:hover');
    const hoveredAnchorsWithHref = hoveredAnchors.filter((anchor) => anchor.href);
    if (hoveredAnchorsWithHref.length) {
        const lastHoveredAnchor = hoveredAnchorsWithHref[hoveredAnchorsWithHref.length - 1];
        return zconvertURLToHTTPSIfNeeded(lastHoveredAnchor.href);
    }
    zpointerMovePromise = Promise.withResolvers();
    document.addEventListener('pointermove', zpointerMoveListener, { passive: true, once: true });
    const url = await zpointerMovePromise.promise;
    return url;
};

zgetURLAtCursorAsync();
