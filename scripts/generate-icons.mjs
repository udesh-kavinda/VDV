import sharp from 'sharp'
import { writeFileSync } from 'fs'

const svg = `<svg width="512" height="512" viewBox="0 0 100 100" fill="none" xmlns="http://www.w3.org/2000/svg">
  <rect width="100" height="100" rx="22" fill="#1a1a1a"/>
  <path d="M50 14 L80 24 L80 52 Q80 72 50 86 Q20 72 20 52 L20 24 Z"
    fill="#2d2d2d" stroke="#f0ebe3" stroke-width="2.5" stroke-linejoin="round"/>
  <rect x="28" y="62" width="44" height="12" rx="3" fill="#f0ebe3"/>
  <path d="M34 62 L38 48 L62 48 L66 62 Z" fill="#f0ebe3"/>
  <path d="M40 62 L43 51 L57 51 L60 62 Z" fill="#1a1a1a" opacity="0.35"/>
  <circle cx="36" cy="74" r="6" fill="#1a1a1a"/>
  <circle cx="36" cy="74" r="2.5" fill="#f0ebe3" opacity="0.4"/>
  <circle cx="64" cy="74" r="6" fill="#1a1a1a"/>
  <circle cx="64" cy="74" r="2.5" fill="#f0ebe3" opacity="0.4"/>
  <circle cx="72" cy="72" r="9" fill="#c8a96e"/>
  <rect x="69" y="72" width="6" height="5" rx="1" fill="#1a1a1a"/>
  <path d="M69.5 72 Q69.5 68 72 68 Q74.5 68 74.5 72" stroke="#1a1a1a" stroke-width="1.8" fill="none"/>
</svg>`

const svgBuf = Buffer.from(svg)

// 512x512
await sharp(svgBuf).resize(512, 512).png().toFile('public/icons/icon-512.png')
console.log('✓ icon-512.png')

// 192x192
await sharp(svgBuf).resize(192, 192).png().toFile('public/icons/icon-192.png')
console.log('✓ icon-192.png')

// 180x180 apple touch icon
await sharp(svgBuf).resize(180, 180).png().toFile('public/icons/apple-touch-icon.png')
console.log('✓ apple-touch-icon.png')

// 32x32 favicon
const fav32 = await sharp(svgBuf).resize(32, 32).png().toBuffer()
writeFileSync('public/favicon-32.png', fav32)
console.log('✓ favicon-32.png')

// Replace favicon.ico with the 32px png (browsers accept png favicons)
await sharp(svgBuf).resize(32, 32).png().toFile('public/favicon.ico')
console.log('✓ favicon.ico')

console.log('All icons generated!')
