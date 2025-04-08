# Vrt Text Blocker Firefox Extension

A simple Firefox extension that allows you to block specific text on VRT.be.

## Features

- Block specific text on any webpage
- Elements containing blocked text will be blacked out
- Restore individual blocks when needed
- Restore the entire page to its original state

## Installation (Manual)

1. Download this repository as a ZIP file or clone it
2. Open Firefox and navigate to `about:debugging`
3. Click "This Firefox"
4. Click "Load Temporary Add-on..."
5. Navigate to the downloaded files and select the `manifest.json` file
6. The extension is now installed temporarily (until you restart Firefox)

## Usage

1. Visit any webpage
2. Click on the Text Blocker icon in your toolbar
3. Enter text you want to block and click "Add"
4. The extension will block all elements containing that text
5. To restore a blocked element, click "Restore" next to the text
6. To clear all blocked texts, click "Clear All"

## File Structure

- `manifest.json` - Extension configuration
- `popup/popup.html` - The popup UI
- `popup/popup.js` - The popup logic
- `content-script.js` - The script that runs on webpages to block/restore text
- `icons/` - Extension icons

## Known Limitations

- Only blocks elements after they appear on the page
- Currently only blocks parent <li> elements that contain the blocked text
- Needs page refresh if blocking doesn't apply immediately

## Permissions

- `storage` - To store your list of blocked texts
- `activeTab` - To access and modify the content of the current tab
