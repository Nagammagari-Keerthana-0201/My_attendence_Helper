# My Attendance Helper

A browser extension that automatically displays your daily work time summary from the Keka attendance logs page.

## Overview

This extension detects today's attendance entry on Keka and shows a floating summary card containing:

- In Time  
- Worked Duration  
- Remaining Time  
- Estimated Logout Time  

It works on both light and dark Keka themes and does not require user interaction.

## Features

- Automatically identifies today's attendance row  
- Extracts swipe times directly from the dropdown  
- Works on both dark and light Keka themes  
- Calculates worked and remaining minutes  
- Shows a clean floating card in the bottom-right corner  
- Secure and lightweight (no external requests)  
- Zero configuration needed after installation  

## How It Works

When you open the Keka attendance logs page:

https://niruthi.keka.com/#/me/attendance/logs

The extension:

1. Matches today's date with the attendance table  
2. Opens the dropdown for today's row  
3. Extracts all swipe times (IN/OUT)  
4. Computes total worked minutes  
5. Subtracts from the required duration (default: 8 hours 15 minutes)  
6. Displays a floating summary card with the calculations  

## Project Structure

my-attendance-helper/
├── manifest.json
├── content.js
├── background.js
├── styles.css
├── popup.html
├── generate_icons.py
├── icons/
│ ├── icon.svg
│ ├── icon16.png
│ ├── icon48.png
│ ├── icon128.png
│ └── ICONS_README.md
└── README.md


## Installation (Developer Mode)

1. Download or clone the repository  
2. Open your browser's extensions page  
   - Chrome: chrome://extensions/  
   - Edge: edge://extensions/  
3. Enable Developer Mode  
4. Click Load unpacked  
5. Select the project folder  

The extension will automatically activate on the attendance logs page.

## Daily Summary Card (Preview)

Simplified representation:

   Today Summary
In Time: 10:12 AM
Worked: 6h 29m
Remaining: 1h 46m
Est. Logout: 07:31 PM


## Configuration

You can change the required working minutes inside content.js:

const REQUIRED_MINUTES = 495; // 8 hours 15 minutes


## Troubleshooting

Card does not appear:
- Confirm you are on the Attendance Logs page  
- Wait 2–3 seconds for Keka UI to load  
- Open browser console (F12)  
- Look for logs starting with: KEKA TRACKER  

Incorrect calculations:
- Check if any swipe entry is marked as MISSING  
- Ensure the dropdown is opening automatically  

Extension not loading:
- Verify manifest.json is valid  
- Ensure icons exist  
- Reload the extension in chrome://extensions/  

## Development

1. Edit the source files  
2. Open chrome://extensions/  
3. Press Reload on the extension  
4. Refresh the Keka page  
5. Check the console if needed  

## Security

The extension is private and secure:

- No external API calls  
- No network communication  
- No analytics or tracking  
- Runs only on the Keka domain  
- Fully open and auditable code  

## License

MIT License

## Disclaimer

This extension is independently developed to improve usability.  
It is not affiliated with or endorsed by Keka HR.
