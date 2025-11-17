# Icon Placeholder

The Chrome Extension requires PNG icons in the following sizes:
- icon16.png (16x16 pixels)
- icon48.png (48x48 pixels)  
- icon128.png (128x128 pixels)

## Option 1: Generate Icons Automatically

Run the provided Python script:
```bash
pip install Pillow
python3 generate_icons.py
```

## Option 2: Create Icons Manually

You can create your own icons using any image editor:

1. **Design Guidelines:**
   - Use the gradient colors: #667eea to #764ba2
   - Include a clock or chart symbol
   - Keep it simple and recognizable at small sizes

2. **Recommended Tools:**
   - Figma (free online)
   - Canva (free online)
   - GIMP (free desktop app)
   - Photoshop
   - Any online icon generator

3. **Quick Online Solution:**
   - Visit: https://www.favicon-generator.org/
   - Upload a simple image or emoji (📊)
   - Download the generated icons
   - Rename them to icon16.png, icon48.png, icon128.png

## Option 3: Use the SVG (Temporary)

For testing purposes, you can temporarily use the icon.svg file, though Chrome prefers PNG format.

## Current Status

The extension will work without icons, but Chrome will show a default placeholder icon. The functionality remains fully operational.
