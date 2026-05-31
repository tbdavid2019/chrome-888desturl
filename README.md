# final destination 333
![alt text](icons/icon128.png)

Chrome Extension for checking a URL's final destination through the 888desturl API.

## What It Does

- Adds a context menu item: `檢查最終網址`
- Works on:
  - links
  - the current page
  - selected text that is a full URL
- Opens a Chrome side panel immediately
- Calls the fast final-destination endpoint:
  - `https://url.david888.com/api/final?url=<encoded_url>&format=json`
- Displays:
  - final URL
  - redirect count
  - link to the hosted result page

## Requirements

- Google Chrome `116+`
- Developer mode enabled in `chrome://extensions`

## Install

1. Open `chrome://extensions`
2. Turn on `Developer mode`
3. Click `Load unpacked`
4. Select this folder

If the extension is already loaded and files changed, click `Reload`.

## Usage

1. Open any webpage
2. Right-click a link, the page, or selected URL text
3. Click `檢查最終網址`
4. The side panel opens and starts tracing
5. Wait for the result
6. Copy the final URL or open the result page

## UX Behavior

- The side panel opens first, so the user sees immediate feedback
- While the request is running, the panel shows a loading state
- If the request takes longer than `1.5s`, the panel switches to a slower-progress message
- Previous results are cleared before each new trace

## Files

- [manifest.json](/Users/david/Documents/git/tbdavid2019/chrome-888desturl/manifest.json:1): MV3 manifest, permissions, side panel, icons
- [background.js](/Users/david/Documents/git/tbdavid2019/chrome-888desturl/background.js:1): context menu, side panel open, API request flow
- [panel.html](/Users/david/Documents/git/tbdavid2019/chrome-888desturl/panel.html:1): side panel markup
- [panel.css](/Users/david/Documents/git/tbdavid2019/chrome-888desturl/panel.css:1): side panel styling
- [panel.js](/Users/david/Documents/git/tbdavid2019/chrome-888desturl/panel.js:1): panel state rendering

## Current Scope

This version focuses on fast final-destination lookup only.

Not included yet:

- full redirect chain view
- security status display
- LINE-specific `context=line` mode
- per-site enable/disable rules

## Notes

- `chrome.sidePanel.open()` must run directly from the context menu click path. If it is delayed by async work, Chrome may reject it as not being triggered by a user gesture.
- Manifest icons do not support SVG in Chrome, so the extension uses raster icon assets for manifest registration.

## API

- Base URL: `https://url.david888.com`
- Fast endpoint: `https://url.david888.com/api/final?url=<encoded_url>&format=json`

## License

Internal project repository. Add a license file if you want to distribute it publicly.
