// Generates electron/icon.png (256px) and electron/icon.ico (PNG-in-ICO) with
// no image dependencies: a teal rounded square with a white "helping hand"
// ring. Run: node scripts/make-icon.mjs
import { deflateSync } from 'node:zlib';
import { writeFileSync } from 'node:fs';

const N = 256;
const teal = [15, 118, 110];
const px = Buffer.alloc(N * N * 4);

function inRounded(x, y, r) {
  const cx = Math.min(Math.max(x, r), N - 1 - r);
  const cy = Math.min(Math.max(y, r), N - 1 - r);
  return (x - cx) ** 2 + (y - cy) ** 2 <= r * r;
}

for (let y = 0; y < N; y++) {
  for (let x = 0; x < N; x++) {
    const i = (y * N + x) * 4;
    if (!inRounded(x, y, 56)) continue; // transparent corner
    let [r, g, b] = teal;
    const d = Math.hypot(x - 128, y - 118);
    const ring = d > 58 && d < 80; // white ring
    const dot = Math.hypot(x - 128, y - 118) < 26; // white centre
    const base = y > 196 && y < 212 && x > 72 && x < 184; // white bar ("support")
    if (ring || dot || base) [r, g, b] = [255, 255, 255];
    px[i] = r;
    px[i + 1] = g;
    px[i + 2] = b;
    px[i + 3] = 255;
  }
}

const crcTable = Array.from({ length: 256 }, (_, n) => {
  let c = n;
  for (let k = 0; k < 8; k++) c = c & 1 ? 0xedb88320 ^ (c >>> 1) : c >>> 1;
  return c >>> 0;
});
const crc32 = (buf) => {
  let c = 0xffffffff;
  for (const byte of buf) c = crcTable[(c ^ byte) & 0xff] ^ (c >>> 8);
  return (c ^ 0xffffffff) >>> 0;
};
const chunk = (type, data) => {
  const len = Buffer.alloc(4);
  len.writeUInt32BE(data.length);
  const td = Buffer.concat([Buffer.from(type, 'ascii'), data]);
  const crc = Buffer.alloc(4);
  crc.writeUInt32BE(crc32(td));
  return Buffer.concat([len, td, crc]);
};

const raw = Buffer.alloc((N * 4 + 1) * N);
for (let y = 0; y < N; y++) px.copy(raw, y * (N * 4 + 1) + 1, y * N * 4, (y + 1) * N * 4);
const ihdr = Buffer.alloc(13);
ihdr.writeUInt32BE(N, 0);
ihdr.writeUInt32BE(N, 4);
ihdr[8] = 8; // bit depth
ihdr[9] = 6; // RGBA
const png = Buffer.concat([
  Buffer.from([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a]),
  chunk('IHDR', ihdr),
  chunk('IDAT', deflateSync(raw, { level: 9 })),
  chunk('IEND', Buffer.alloc(0)),
]);

const ico = Buffer.alloc(22);
ico.writeUInt16LE(0, 0);
ico.writeUInt16LE(1, 2); // icon
ico.writeUInt16LE(1, 4); // one image
ico[6] = 0; // 256 wide
ico[7] = 0; // 256 high
ico.writeUInt16LE(1, 10); // planes
ico.writeUInt16LE(32, 12); // bpp
ico.writeUInt32LE(png.length, 14);
ico.writeUInt32LE(22, 18);

writeFileSync(new URL('../electron/icon.png', import.meta.url), png);
writeFileSync(new URL('../electron/icon.ico', import.meta.url), Buffer.concat([ico, png]));
console.log(`icon.png ${png.length} bytes, icon.ico ${png.length + 22} bytes`);
