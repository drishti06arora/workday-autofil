# Workday Autofill Chrome Extension

This Chrome extension is designed to autofill Workday information forms and work with Workday job pages.

## Files
- `manifest.json`
- `content.js`
- `popup.html`
- `popup.js`

## Installation
1. Open Chrome and go to `chrome://extensions`
2. Enable Developer mode
3. Click "Load unpacked" and select the `workday-autofil` folder

## How it works
1. The extension is loaded as an unpacked Chrome extension.
2. When you open a Workday job page, it runs on matching pages and can autofill form fields.
3. The popup UI provides a button to trigger extraction of Workday form fields.

## Notes
- `manifest.json` includes `host_permissions` for `*://*.workdayjobs.com/*`
- `popup.html` contains the popup UI and button styling
