import browser from 'webextension-polyfill';
let openLinksNextToCurrent = false;

const setOS = async () => {
    const { os } = await browser.runtime.getPlatformInfo();
    await browser.storage.local.set({ os });
};

const getIsAllowedIncognitoAccess = async () => {
    const isAllowedIncognitoAccess = await browser.extension.isAllowedIncognitoAccess();
    return isAllowedIncognitoAccess;
};

const setIsAllowedIncognitoAccess = async (isAllowedIncognitoAccess: boolean) => {
    await browser.storage.local.set({ isAllowedIncognitoAccess });
};

const getPreviousIsAllowedIncognitoAccess = async () => {
    const { isAllowedIncognitoAccess = false } = await browser.storage.local.get('isAllowedIncognitoAccess');
    return isAllowedIncognitoAccess;
};

const reloadAllRegularTabs = async () => {
    const regularTabs = await browser.tabs.query({ url: ['http://*/*', 'https://*/*'] });
    regularTabs.forEach((tab) => {
        void browser.tabs.reload(tab.id);
    });
};

// If the incognito access mode change, tabs need to be reloaded for content script to work (otherwise the extension context gets invalidated)
const reloadTabsIfIncognitoAccessChanged = async () => {
    const previousAllowedIncognitoAccess = await getPreviousIsAllowedIncognitoAccess();
    const currentAllowedIncognitoAccess = await getIsAllowedIncognitoAccess();
    if (previousAllowedIncognitoAccess !== currentAllowedIncognitoAccess) {
        void setIsAllowedIncognitoAccess(currentAllowedIncognitoAccess);
        void reloadAllRegularTabs();
    }
};

const init = async () => {
    await setOS();
    const isAllowedIncognitoAccess = await getIsAllowedIncognitoAccess();
    await setIsAllowedIncognitoAccess(isAllowedIncognitoAccess);
    void reloadAllRegularTabs();
};

browser.runtime.onInstalled.addListener((e) => {
    if (e.reason === 'install') void init();
    else if (e.reason === 'update') {
        void reloadTabsIfIncognitoAccessChanged();
    }
});

const getCurrentActiveTab = async () => {
    const [currentTab] = await browser.tabs.query({ active: true, currentWindow: true });
    return currentTab;
};

const moveCreatedTabNextToCurrent = async (tabId: number) => {
    const currentTab = await getCurrentActiveTab();
    if (currentTab) void browser.tabs.move(tabId, { index: currentTab.index + 1 });
};

const openNewTabNextToCurrent = async () => {
    const currentTab = await getCurrentActiveTab();
    if (currentTab) void browser.tabs.create({ index: currentTab.index + 1 });
};

const openLinkAtCursorInNewTab = async () => {
    const currentTab = await getCurrentActiveTab();
    const tabId = currentTab?.id;
    if (!tabId) {
        console.log('No active tab found to open link at cursor!');
        return;
    }

    const tabFrames = await browser.webNavigation.getAllFrames({ tabId });
    if (!tabFrames || !tabFrames.length) {
        console.log('No frames found for current tab!');
        return;
    }
    const tabFrameIds = tabFrames.map((frame) => frame.frameId);

    const firstURLAtCursorResults = await Promise.any(
        tabFrameIds.map((frameId) => {
            return browser.scripting.executeScript({
                target: { tabId, frameIds: [frameId] },
                files: ['utils/zgetURLAtCursor.js'],
            });
        }),
    );

    if (!firstURLAtCursorResults || !firstURLAtCursorResults.length || !firstURLAtCursorResults[0]) {
        console.log('No link found at cursor!');
        return;
    }
    const { result } = firstURLAtCursorResults[0];

    if (!result || typeof result !== 'string') {
        console.log('No valid link found at cursor:', result);
        return;
    }

    await browser.tabs.create({ index: currentTab.index + 1, url: result, active: false });
};

browser.runtime.onMessage.addListener((message, sender, sendResponse) => {
    // Verify message is from our extension
    if (!sender.id || sender.id !== browser.runtime.id) {
        console.warn(
            'open-link-and-new-tab-next-to-current > browser.runtime.onMessage > Received message from unauthorized sender:',
            sender,
        );
        sendResponse({ status: 'unauthorized' });
        return true;
    }

    if (!message || typeof message !== 'object' || !('type' in message)) {
        console.warn(
            'open-link-and-new-tab-next-to-current > browser.runtime.onMessage > Invalid message format:',
            message,
        );
        sendResponse({ status: 'invalid' });
        return true;
    }

    if (message.type === 'start-open-links-next-to-current') openLinksNextToCurrent = true;
    if (message.type === 'stop-open-links-next-to-current') openLinksNextToCurrent = false;
    // sendResponse to acknowledge the message and not get any conssole errors
    sendResponse({ status: 'ok' });
    return true;
});

browser.tabs.onCreated.addListener((tab) => {
    if (openLinksNextToCurrent && tab.id) void moveCreatedTabNextToCurrent(tab.id);
});

browser.commands.onCommand.addListener((command) => {
    if (command === 'open-new-tab-next-to-current') void openNewTabNextToCurrent();
    else if (command === 'open-link-at-cursor-in-new-tab') void openLinkAtCursorInNewTab();
});
