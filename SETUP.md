# Environment Setup Guide

##  What's Been Set Up

### Virtual Environment
- **Location**: `./venv/`
- **Python Version**: 3.10.12
- **Status**:  Created and activated

### Installed Packages
```
Pillow==10.1.0  (Image generation)
pip==25.3       (Package manager)
setuptools==59.6.0
```

### Generated Assets
-  `icons/icon16.png` (16x16 pixels)
-  `icons/icon48.png` (48x48 pixels)
-  `icons/icon128.png` (128x128 pixels)

---

##  Quick Reference

### Activate Virtual Environment (Every Session)
```bash
cd /home/keerthana/Desktop/keka-hours-tracker
source venv/bin/activate
```

### Deactivate Virtual Environment
```bash
deactivate
```

### Install Dependencies from requirements.txt
```bash
source venv/bin/activate
pip install -r requirements.txt
```

### Regenerate Icons (if needed)
```bash
source venv/bin/activate
python3 generate_icons.py
```

---

##  Next Steps

1. **Load Extension in Chrome**:
   - Open `chrome://extensions/`
   - Enable Developer Mode
   - Click "Load unpacked"
   - Select this folder: `/home/keerthana/Desktop/keka-hours-tracker`

2. **Test the Extension**:
   - Navigate to: `https://niruthi.keka.com/#/me/attendance/logs`
   - Should see floating card in bottom-right corner

3. **Debug if Needed**:
   - Press F12 on the Keka page
   - Check Console for `[Keka Tracker]` logs

---

##  Project Structure After Setup
```
keka-hours-tracker/
├── venv/                    # Virtual environment (NEW)
├── icons/
│   ├── icon16.png          #  Generated
│   ├── icon48.png          #  Generated
│   ├── icon128.png         #  Generated
│   ├── icon.svg
│   └── ICONS_README.md
├── manifest.json
├── content.js
├── background.js
├── styles.css
├── popup.html
├── generate_icons.py
├── requirements.txt        # Created
└── README.md
```

---

##  Troubleshooting

### Environment Not Activating?
```bash
# Make activation script executable
chmod +x venv/bin/activate
source venv/bin/activate
```

### Icons Not Generating?
```bash
# Check Pillow installation
source venv/bin/activate
python3 -c "from PIL import Image; print('Pillow OK')"

# If error, reinstall
pip install Pillow==10.1.0
```

### Extension Not Loading?
- Clear browser cache
- Reload extension from `chrome://extensions/`
- Check manifest.json is valid JSON
- Press F12 → Console for errors

---

##  Environment Ready!

Your environment is now fully configured with all required dependencies.

**To get started immediately**:
```bash
cd /home/keerthana/Desktop/keka-hours-tracker
source venv/bin/activate
```

Then load the extension in Chrome! 

