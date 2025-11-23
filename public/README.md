# Public Assets Directory

This directory contains static assets that are served at the root URL path.

## Recommended File Structure:

```
public/
├── favicon.ico          # Main favicon (16x16, 32x32, or 48x48)
├── favicon-16x16.png    # 16x16 favicon (optional)
├── favicon-32x32.png    # 32x32 favicon (optional)
├── apple-touch-icon.png # Apple touch icon (180x180)
├── logo.png             # Main logo (recommended: 200x200 or larger)
├── logo.svg             # Vector logo (preferred if available)
└── logo-white.png       # White version for dark backgrounds (optional)
```

## How to Use:

### Favicon:
- Place `favicon.ico` in this directory
- Next.js will automatically serve it at `/favicon.ico`
- You can also add favicon metadata in `src/app/layout.tsx`

### Logo:
- Place logo files in this directory
- Reference them in your code as: `/logo.png` or `/logo.svg`
- Example: `<img src="/logo.png" alt="Travunited Logo" />`

## File Formats:

- **Favicon**: `.ico` (multi-size) or `.png` (single size)
- **Logo**: `.png`, `.svg`, `.jpg`, or `.webp`
- **Apple Touch Icon**: `.png` (180x180 pixels)

## Notes:

- Files in this directory are publicly accessible
- Use descriptive filenames
- Optimize images for web (compress PNG/JPG, use SVG when possible)
- Keep file sizes reasonable for fast loading

