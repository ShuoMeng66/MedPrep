/**
 * MedPrep icon generator — crops book foreground onto gradient squircle frame.
 * Run: npm run icons:generate
 */
import sharp from 'sharp'
import { readFileSync, writeFileSync } from 'fs'
import { join, dirname } from 'path'
import { fileURLToPath } from 'url'

const __dirname = dirname(fileURLToPath(import.meta.url))
const root = join(__dirname, '..')
const publicDir = join(root, 'public')
const sourcePath = join(publicDir, 'icon-source.png')

/** Book + staff region (excludes bottom MedPrep text) */
const BOOK_CROP = { left: 0.06, top: 0.06, width: 0.88, height: 0.62 }

const GRADIENT_STOPS = [
  { offset: '0%', color: '#0051A8' },
  { offset: '45%', color: '#007AFF' },
  { offset: '100%', color: '#00D2FF' },
]

function gradientSvg(size, radius) {
  const stops = GRADIENT_STOPS.map(
    (s) => `<stop offset="${s.offset}" stop-color="${s.color}"/>`,
  ).join('')
  return `<svg width="${size}" height="${size}" xmlns="http://www.w3.org/2000/svg">
  <defs>
    <linearGradient id="bg" x1="0%" y1="100%" x2="100%" y2="0%">${stops}</linearGradient>
  </defs>
  <rect width="${size}" height="${size}" rx="${radius}" fill="url(#bg)"/>
</svg>`
}

async function gradientBg(size) {
  const radius = Math.round(size * 0.22)
  return sharp(Buffer.from(gradientSvg(size, radius))).png().toBuffer()
}

async function extractBook(sourceMeta) {
  const { width: w, height: h } = sourceMeta
  return sharp(sourcePath)
    .extract({
      left: Math.round(BOOK_CROP.left * w),
      top: Math.round(BOOK_CROP.top * h),
      width: Math.round(BOOK_CROP.width * w),
      height: Math.round(BOOK_CROP.height * h),
    })
    .png()
    .toBuffer()
}

async function compositeOnGradient(size, fgBuffer, contentRatio, verticalBias = 0) {
  const bg = await gradientBg(size)
  const contentSize = Math.round(size * contentRatio)
  const resized = await sharp(fgBuffer)
    .resize(contentSize, contentSize, { fit: 'contain' })
    .toBuffer()

  const meta = await sharp(resized).metadata()
  const left = Math.round((size - meta.width) / 2)
  const top = Math.round((size - meta.height) / 2 + verticalBias)

  return sharp(bg)
    .composite([{ input: resized, left, top }])
    .png()
    .toBuffer()
}

async function fullIcon(size) {
  return sharp(sourcePath)
    .resize(size, size, { fit: 'cover' })
    .sharpen()
    .png()
    .toBuffer()
}

async function bookIcon(size, contentRatio = 0.82) {
  const meta = await sharp(sourcePath).metadata()
  const book = await extractBook(meta)
  return compositeOnGradient(size, book, contentRatio, -size * 0.02)
}

async function main() {
  const meta = await sharp(sourcePath).metadata()
  if (!meta.width) throw new Error('Cannot read icon-source.png')

  const outputs = [
    { name: 'icon-512.png', buf: await fullIcon(512) },
    { name: 'icon-192.png', buf: await fullIcon(192) },
    { name: 'apple-touch-icon.png', buf: await fullIcon(180) },
    { name: 'icon-maskable-512.png', buf: await bookIcon(512, 0.72) },
    { name: 'icon-maskable-192.png', buf: await bookIcon(192, 0.72) },
    { name: 'favicon-48.png', buf: await bookIcon(48, 0.84) },
  ]

  for (const { name, buf } of outputs) {
    const out = join(publicDir, name)
    await sharp(buf).toFile(out)
    console.log('wrote', name)
  }

  const favicon48 = readFileSync(join(publicDir, 'favicon-48.png'))
  const b64 = favicon48.toString('base64')
  const faviconSvg = `<svg width="32" height="32" viewBox="0 0 32 32" fill="none" xmlns="http://www.w3.org/2000/svg">
  <defs>
    <linearGradient id="g" x1="0%" y1="100%" x2="100%" y2="0%">
      <stop offset="0%" stop-color="#0051A8"/>
      <stop offset="45%" stop-color="#007AFF"/>
      <stop offset="100%" stop-color="#00D2FF"/>
    </linearGradient>
  </defs>
  <rect width="32" height="32" rx="7" fill="url(#g)"/>
  <image href="data:image/png;base64,${b64}" x="2" y="1" width="28" height="28" preserveAspectRatio="xMidYMid meet"/>
</svg>`

  writeFileSync(join(publicDir, 'favicon.svg'), faviconSvg)
  writeFileSync(join(root, 'favicon.svg'), faviconSvg)
  console.log('wrote favicon.svg (public + root)')
}

main().catch((err) => {
  console.error(err)
  process.exit(1)
})
