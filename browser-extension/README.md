# Dzongkha Dictionary Quick Lookup extension

This Manifest V3 companion extension enables GoldenDict-style double-copy lookup on desktop webpages. It does not contain or duplicate dictionary data: the floating frame calls the same search API and datasets as the main Dzongkha Dictionary.

## Install locally in Chrome or Edge

1. Open `chrome://extensions` in Chrome or `edge://extensions` in Edge.
2. Enable **Developer mode**.
3. Choose **Load unpacked** and select this `browser-extension` directory.
4. Open the deployed Dzongkha Dictionary once. The extension detects and remembers its address automatically. Alternatively, open the extension's details and choose **Extension options** to enter the address manually.

Before publishing, the included `test-page.html` can be served with the dictionary and used to verify both English and Dzongkha selections on a normal webpage.

## Use

1. Select an English or Dzongkha word on a normal webpage.
2. Press **Command+C twice** on macOS or **Ctrl+C twice** on Windows within 1.8 seconds.
3. Close the result with **Esc**, the close button, or a click outside. Use **Open Full Entry** for the complete dictionary result.

The extension preserves the browser's normal copy behavior. It only reads the current selection during a copy event, keeps it briefly to recognize the second copy, and does not send it anywhere except the configured dictionary URL.

Browser-protected pages such as `chrome://`, `edge://`, extension stores, and some built-in PDF viewers do not permit content scripts, so quick lookup is unavailable there. macOS support refers to Chrome/Edge and other Chromium browsers that accept Manifest V3 extensions; Safari requires a separately signed Safari Web Extension package.
