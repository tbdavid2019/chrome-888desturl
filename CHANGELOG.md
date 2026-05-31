# Changelog

## 0.1.0 - 2026-05-30

Initial working version of `888desturl Quick Trace`.

### Added

- Manifest V3 extension scaffold
- Chrome context menu entry: `檢查最終網址`
- Chrome side panel UI for result display
- Fast final-destination lookup through:
  - `https://url.david888.com/api/final?url=<encoded_url>&format=json`
- Result rendering for:
  - final URL
  - redirect count
  - hosted result page
- Copy button and result-page shortcut
- Extension icon assets and in-panel SVG brand icon

### Changed

- Updated the open behavior to use Chrome side panel instead of opening a normal tab
- Moved `chrome.sidePanel.open()` directly into the context menu click path to preserve the required user gesture
- Added loading-state transitions for slower traces

### Fixed

- Fixed the no-response behavior when right-clicking the context menu item
- Removed stale result leakage between consecutive trace requests
- Reworked side panel opening flow after earlier fallback-to-tab behavior caused the wrong UX

### Notes

- Chrome side panel opening behavior was aligned with the official Chrome Extensions sidePanel documentation and the known user-gesture limitation discussed in the GoogleChrome sample repository.
