/**
 * Generates PNG icons by drawing directly with Node canvas (no SVG parser needed).
 * Run: node scripts/generate-icons.mjs
 */
import { createCanvas } from 'canvas';
import { writeFileSync } from 'fs';

function drawSunIcon(size, opts = {}) {
  const { maskable = false } = opts;
  const canvas = createCanvas(size, size);
  const ctx = canvas.getContext('2d');

  // Background
  ctx.fillStyle = '#090909';
  if (maskable) {
    // Full bleed for maskable
    ctx.fillRect(0, 0, size, size);
  } else {
    // Rounded rect for regular
    const r = size * 0.2;
    ctx.beginPath();
    ctx.moveTo(r, 0);
    ctx.lineTo(size - r, 0);
    ctx.arcTo(size, 0, size, r, r);
    ctx.lineTo(size, size - r);
    ctx.arcTo(size, size, size - r, size, r);
    ctx.lineTo(r, size);
    ctx.arcTo(0, size, 0, size - r, r);
    ctx.lineTo(0, r);
    ctx.arcTo(0, 0, r, 0, r);
    ctx.closePath();
    ctx.fill();
  }

  const cx = size / 2;
  const cy = size / 2;

  // Scale factor: maskable uses 80% of canvas (safe zone)
  const scale = maskable ? 0.72 : 0.88;
  const sunR = size * (maskable ? 0.172 : 0.219);
  const rayInner = sunR * 1.08;
  const rayOuter = size * scale * 0.5;
  const rayWidth = size * 0.047;

  // Rays (8 directions)
  ctx.strokeStyle = '#ff6600';
  ctx.globalAlpha = 0.75;
  ctx.lineWidth = rayWidth;
  ctx.lineCap = 'round';
  for (let i = 0; i < 8; i++) {
    const angle = (i * Math.PI) / 4;
    ctx.beginPath();
    ctx.moveTo(cx + Math.cos(angle) * rayInner, cy + Math.sin(angle) * rayInner);
    ctx.lineTo(cx + Math.cos(angle) * rayOuter, cy + Math.sin(angle) * rayOuter);
    ctx.stroke();
  }

  // Sun body
  ctx.globalAlpha = 1;
  ctx.fillStyle = '#ff6600';
  ctx.beginPath();
  ctx.arc(cx, cy, sunR, 0, Math.PI * 2);
  ctx.fill();

  return canvas.toBuffer('image/png');
}

const sizes = [
  { file: 'public/icons/icon-192.png', size: 192 },
  { file: 'public/icons/icon-512.png', size: 512 },
  { file: 'public/icons/icon-512-maskable.png', size: 512, maskable: true },
];

for (const { file, size, maskable } of sizes) {
  const buf = drawSunIcon(size, { maskable });
  writeFileSync(file, buf);
  console.log(`✓ ${file} (${buf.length} bytes)`);
}
