import browser from 'webextension-polyfill';

const COMMAND_KEY = 'Meta';
const OPTION_ALT_KEY = 'Alt';
const CONTROL_KEY = 'Control';

let LISTENING_TO_KEYS: string[] = [];
let KEYS_DOWN: { [key: string]: boolean } = {};

const initKeys = async () => {
    const { os } = await browser.storage.local.get('os');
    if (os === 'mac') {
        LISTENING_TO_KEYS = [COMMAND_KEY, OPTION_ALT_KEY];
        KEYS_DOWN = {
            Meta: false,
            Alt: false,
        };
    } else {
        LISTENING_TO_KEYS = [CONTROL_KEY, OPTION_ALT_KEY];
        KEYS_DOWN = {
            Control: false,
            Alt: false,
        };
    }
};

const sendMessageToServiceWorker = (type: string) => {
    void browser.runtime.sendMessage({ type });
};

const allKeysAreDown = () => LISTENING_TO_KEYS.every((key) => KEYS_DOWN[key]);

const updateKeysDown = (e: KeyboardEvent) => {
    if (LISTENING_TO_KEYS.some((k) => k === e.key)) {
        KEYS_DOWN[e.key] = true;
        if (allKeysAreDown()) sendMessageToServiceWorker('start-open-links-next-to-current');
    }
};

const updateKeysUp = (e: KeyboardEvent) => {
    if (LISTENING_TO_KEYS.some((k) => k === e.key)) {
        const allKeysPreviouslyDown = allKeysAreDown();
        KEYS_DOWN[e.key] = false;
        if (allKeysPreviouslyDown) sendMessageToServiceWorker('stop-open-links-next-to-current');
    }
};

const resetKeysAndStopOpenLinksNextToCurrent = () => {
    const allKeysPreviouslyDown = allKeysAreDown();
    for (const k in KEYS_DOWN) {
        KEYS_DOWN[k] = false;
    }
    if (allKeysPreviouslyDown) sendMessageToServiceWorker('stop-open-links-next-to-current');
};

const removeEventListeners = () => {
    window.removeEventListener('keydown', updateKeysDown);
    window.removeEventListener('keyup', updateKeysUp);
    window.removeEventListener('contextmenu', resetKeysAndStopOpenLinksNextToCurrent);
    window.removeEventListener('blur', resetKeysAndStopOpenLinksNextToCurrent);
};

const addEventListeners = () => {
    removeEventListeners();
    window.addEventListener('keydown', updateKeysDown, { passive: true });
    window.addEventListener('keyup', updateKeysUp, { passive: true });
    window.addEventListener('contextmenu', resetKeysAndStopOpenLinksNextToCurrent);
    window.addEventListener('blur', resetKeysAndStopOpenLinksNextToCurrent);
};

// Initialize on content script load
void (async () => {
    try {
        await initKeys();
        addEventListeners();
    } catch (error) {
        console.error('Failed to initialize content script:', error);
    }
})();
