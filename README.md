# Open Link and New Tab Next to Current

A browser extension for Chromium and Firefox browsers that lets you open urls and new tabs next to your current one using keyboard shortcut, keyboard shortcut + click and keyboard shortcut while hovering over an url.

## Features

- ### **Open new tab next to current**
    - Configurable keyboard shortcut - **Default:**
        - (macOS): Control + R
        - (windows / linux): Control + R
- ### **Open link next to current tab**
    - (macOS): Press Command + Option while clicking on links to open them in a new tab next to your current one.
    - (windows / linux): Press control + alt while clicking on links to open them in a new tab next to your current one.
- ### **Open url at cursor position next to current tab**
    - Open a tab next to current based on what your cursor is hovering over. This also works for urls that are not clickable anchors like plain text etc, even if the url is inside a wall of text. If a tab is not immediately opened, just move your cursor and it will be opened if it is a valid url, more details in the 'How it works' section.
    - Configurable keyboard shortcut - **Defaults:**
        - (macOS): Option + R
        - (windows / linux): Alt + R

## Installation

### From Chrome Web Store

1. Install the extension from the Chrome Web Store <https://chromewebstore.google.com/detail/open-link-and-new-tab-nex/pelhnkebfbkkmlpiiodpljcdolnjijee>
2. The extension will start working immediately after installation (all tabs will be reloaded)
3. If you want the extension to work in private/incognito windows, go to <chrome://extensions/?id=pelhnkebfbkkmlpiiodpljcdolnjijee> and Enable `Allow in Incognito` or `Allow in Private` (all tabs will be reloaded when enabling/disabling incognito access, otherwise the extension context gets invalidated).

### From Firefox add-ons

1. Install the extension from firefox add-ons (link coming soon)

## Development

This extension is built with TypeScript and uses Webpack for bundling.

### Package Manager Requirements

This project uses Yarn 4.9.2 as its package manager. For the best development experience:

1.  Make sure you have [Corepack](https://nodejs.org/api/corepack.html) enabled:

    ```bash
    corepack enable
    ```

2.  Install dependencies:

    ```bash
    yarn install
    ```

3.  Development builds with hot reloading:
    ```bash
    yarn dev:chrome
    yarn dev:firefox
    ```
4.  Production builds:
    ```bash
    yarn build:chrome
    yarn build:firefox
    ```
5.  OS Compability package (if the build should be compatible across different operating systems):
    ```bash
    yarn package:chrome
    yarn package:firefox
    ```
6.  Linting / type checking
    ```bash
    yarn lint
    yarn tcheck
    ```
7.  Load the extension:

- **Chromium browsers**: Go to <chrome://extensions>, enable Developer mode, click "Load unpacked", and select the `chrome/prod` or `packaged/open-link-and-new-tab-next-to-current-chrome` directory
- **Firefox**: Go to <about:debugging#/runtime/this-firefox>, click "Load Temporary Add-on...", and select manifest.json in the `firefox/prod` or `packaged/open-link-and-new-tab-next-to-current-firefox` directory

## How it works

### Open link next to current tab

A content script is injected that listens for specific key combinations:

- Mac: Command+Option
- Windows / Linux: Control+Alt

When these keys are held down while clicking links, the links open in new tabs next to the current one instead of at the end of the tab strip.

### Open link at cursor position next to current tab

This keyboard shortcut command will open a new tab next to the current tab with the url your cursor is hovering on (if that is a valid url). In some cases this is the preferred option since it solves cases when websites override the regular click and open link in new tab behaviour, and with urls that are not linkable or just plain text. If what you're hovering on is not an anchor, a pointermove listener will be created which runs only once determine what url your curosr is hovering over, and gets terminated after being triggered (to not create any unnecssary listenres, this not commonly needed but is necessary to handle all edge cases). So if a new tab is not created immediately just move your cursor and a tab will be created next to current with the url at your cursor position if it'a a valid url. HTTP links will automatically be converted to HTTPS, except for IP addresses.

### Open new tab next to current

This keyboard shortcut command will open a new blank tab next to current one.

## Technical Details

- Built with TypeScript
- Uses webpack for building and bundling
- Supports both Chromium and Firefox browsers
- Implements shadow DOM and iframe traversal for link detection

## Privacy

This extension:

- Does not collect any user data
- Does not communicate with external servers

## License

MIT License
