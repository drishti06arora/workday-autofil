# Workday Autofill Chrome Extension

This Chrome extension is designed to autofill Workday forms and work with Workday job pages by extracting fields and then connecting to local agent which sends back response json.

## Project Structure

```
workday-autofil/
├── extension/              # Chrome extension (load this folder in Chrome)
│   ├── manifest.json       # Extension configuration
│   ├── popup.html          # Popup UI
│   ├── popup.js            # Popup logic
│   ├── content.js          # Content script entry point
│   ├── extraction.js       # Field extraction logic
│   ├── agent-client.js     # Agent communication & filling
│   └── ui.js               # Floating button UI & orchestration
├── backend/                # Local agent server
│   ├── controllers/        # HTTP request handling
│   │   └── fillController.js
│   ├── services/           # Business logic and field fill strategy
│   │   └── fillService.js
│   ├── utils/              # Reusable helpers
│   │   ├── httpUtils.js
│   │   └── fieldUtils.js
│   ├── database/           # In-memory mapping repository
│   │   └── fieldMappingRepository.js
│   ├── local-agent.js      # Server bootstrap
│   └── package.json        # Node project config
└── README.md               # This file
└── DEVLOG.md               # Developers Log
```

## Installation

### Load Extension in Chrome
1. Open Chrome and go to `chrome://extensions`
2. Enable Developer mode
3. Click "Load unpacked" and select the `extension/` folder

### Start Local Agent
1. Navigate to `backend/` folder
2. Run `npm start` (no dependencies needed)
3. Agent will listen at `http://127.0.0.1:3000`

## How it works
1. The extension is loaded as an unpacked Chrome extension from the `extension/` folder.
2. When you open a Workday job page, the content script runs on matching pages and can extract form fields.
3. The floating button calls the extraction layer, then sends extracted fields to the local agent.
4. The local agent processes fields using the expected fields memory and returns fill values.
5. The extension then autofills the matched fields on the page.

## Local agent support
- `local-agent.js` runs a simple local HTTP server on `http://127.0.0.1:3000`.
- It accepts a POST request to `/fill` with extracted fields and returns a JSON map of selectors to values.
- The extension sends extracted field metadata from the page to this server and applies the returned values.

## High-level diagram
```
[User] -> [Chrome Extension Popup]
                 |
                 v
         [content.js on Workday page]
                 |
                 v
        [Extract form field metadata]
                 |
                 v
         [Local agent / backend]
                 |
                 v
          [Response JSON with values]
                 |
                 v
         [content.js autofills form]
```

## Architecture

### Extension (`extension/` folder)
- **manifest.json** — Chrome extension configuration and permissions
- **popup.html/popup.js** — Popup button UI and orchestration
- **content.js** — Content script entry point, message handling
- **extraction.js** — Pure field extraction logic
- **agent-client.js** — Agent communication and field filling
- **ui.js** — Floating button UI and orchestration

### Backend (`backend/` folder)
- **local-agent.js** — HTTP server that processes fields
- **package.json** — Node project configuration

## Notes
- `manifest.json` includes `host_permissions` for `*://*.myworkdayjobs.com/*` and `http://127.0.0.1/*`
- `popup.html` contains the popup UI and button styling
- The extension requires a running local agent on port 3000
