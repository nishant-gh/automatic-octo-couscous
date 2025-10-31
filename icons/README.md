# GuardianAI Icons

## Icon Files Needed

The extension requires PNG icon files in the following sizes:
- `icon16.png` - 16x16 pixels (toolbar)
- `icon48.png` - 48x48 pixels (extension management page)
- `icon128.png` - 128x128 pixels (Chrome Web Store)

## Design Guidelines

**Visual Theme:**
- Shield shape (protection)
- Purple/blue gradient (trust, technology)
- AI circuit patterns (modern, intelligent)
- Checkmark or guardian symbol

**Color Palette:**
- Primary: #667eea (purple-blue)
- Secondary: #764ba2 (deep purple)
- Accent: #ffffff (white)

## Creating Icons

### Option 1: Convert from SVG

The `icon.svg` file contains the base design. Convert to PNG using:

```bash
# Using ImageMagick
convert -background none -density 1200 icon.svg -resize 16x16 icon16.png
convert -background none -density 1200 icon.svg -resize 48x48 icon48.png
convert -background none -density 1200 icon.svg -resize 128x128 icon128.png
```

### Option 2: Use Design Tools

- **Figma**: Import SVG, export as PNG at required sizes
- **Adobe Illustrator**: Open SVG, export artboards as PNG
- **Inkscape**: Open SVG, export as PNG with custom dimensions

### Option 3: Online Converters

Use online SVG to PNG converters:
- CloudConvert
- Convertio
- Online-Convert

## Temporary Solution

For development/testing, you can:
1. Use the SVG file directly (some browsers support it)
2. Create placeholder images using any graphic tool
3. Use emoji-based icons as temporary placeholders

## Icon Checklist

- [ ] icon16.png created
- [ ] icon48.png created
- [ ] icon128.png created
- [ ] All icons follow design guidelines
- [ ] Icons are optimized for file size
- [ ] Icons have transparent backgrounds
- [ ] Icons are visually consistent

## Design Elements

The shield-based design represents:
- **Shield Shape**: Protection and security
- **Circuit Pattern**: AI and technology
- **Checkmark**: Verification and trust
- **Gradient**: Modern, approachable design
- **Purple/Blue Colors**: Trust, calm, intelligence

Perfect for conveying "intelligent protection" to elderly users and their families.
