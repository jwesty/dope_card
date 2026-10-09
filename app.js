'use strict';
const W = 264, H = 176;
const $ = id => document.getElementById(id);
const tbody = $('editor').querySelector('tbody');
const initial = [200, 300, 400, 500, 600, 700, 800];

for (let i = 0; i < 7; i++) {
  const tr = document.createElement('tr');
  for (const [j, key] of ['yards', 'elev', 'wind5', 'wind10'].entries()) {
    const td = document.createElement('td');
    const input = document.createElement('input');
    // Full text keyboard on iPhone: supports negatives, dashes, and freeform holds.
    input.type = 'text';
    input.inputMode = 'text';
    input.autocomplete = 'off';
    input.maxLength = 8;
    input.dataset.key = key;
    input.setAttribute('aria-label', `Row ${i + 1} ${key}`);
    input.value = j === 0 ? String(initial[i]) : '';
    input.addEventListener('input', render);
    td.append(input);
    tr.append(td);
  }
  tbody.append(tr);
}

function getProfile() {
  return {
    version: 1,
    title: $('title').value,
    ammo: $('ammo').value,
    zero: $('zero').value,
    units: $('units').value,
    rows: [...tbody.rows].map(tr =>
      Object.fromEntries([...tr.querySelectorAll('input')].map(el => [el.dataset.key, el.value]))
    )
  };
}

function loadProfile(p) {
  if (!p || !Array.isArray(p.rows) || p.rows.length !== 7) {
    throw Error('JSON must contain exactly seven rows');
  }
  for (const key of ['title', 'ammo', 'zero', 'units']) {
    if (p[key] !== undefined) $(key).value = String(p[key]);
  }
  [...tbody.rows].forEach((tr, i) =>
    [...tr.querySelectorAll('input')].forEach(el => {
      el.value = String(p.rows[i]?.[el.dataset.key] ?? '');
    })
  );
  render();
}

function fitText(ctx, text, x, y, maxWidth, size = 11) {
  ctx.font = `bold ${size}px monospace`;
  let s = String(text).toUpperCase();
  while (s.length && ctx.measureText(s).width > maxWidth) s = s.slice(0, -1);
  ctx.fillText(s, x, y);
}

function drawCard(ctx, p) {
  ctx.fillStyle = '#fff';
  ctx.fillRect(0, 0, W, H);
  ctx.fillStyle = '#000';
  ctx.textBaseline = 'middle';
  ctx.fillRect(0, 0, W, 27);
  ctx.fillStyle = '#fff';
  fitText(ctx, p.title || 'DOPE CARD', 5, 9, 250, 12);
  fitText(ctx, `${p.ammo}  |  ZERO ${p.zero} YD`, 5, 21, 253, 9);
  ctx.fillStyle = '#000';
  ctx.font = 'bold 10px monospace';
  ctx.fillText('YDS', 5, 35);
  ctx.fillText(`ELEV ${p.units}`, 55, 35);
  ctx.fillText('5 MPH', 153, 35);
  ctx.fillText('10 MPH', 209, 35);
  ctx.fillRect(0, 42, W, 2);
  const xs = [0, 49, 146, 202, 263];
  for (let i = 0; i < 8; i++) ctx.fillRect(0, 44 + i * 16, W, 1);
  for (const x of xs) ctx.fillRect(x, 43, 1, 113);
  ctx.font = 'bold 11px monospace';
  p.rows.forEach((r, i) => {
    const y = 52 + i * 16;
    fitText(ctx, r.yards, 5, y, 41, 11);
    fitText(ctx, r.elev, 55, y, 84, 11);
    fitText(ctx, r.wind5, 153, y, 44, 11);
    fitText(ctx, r.wind10, 209, y, 49, 11);
  });
  ctx.font = '8px monospace';
  ctx.fillText('USER-ENTERED DOPE  •  VERIFY HOLDS', 4, 168);
}

const canvas = $('preview');
const ctx = canvas.getContext('2d', { willReadFrequently: true });
function render() { drawCard(ctx, getProfile()); }
for (const id of ['title', 'ammo', 'zero', 'units']) $(id).addEventListener('input', render);
render();

function download(blob, name) {
  const a = document.createElement('a');
  const url = URL.createObjectURL(blob);
  a.href = url;
  a.download = name;
  document.body.append(a);
  a.click();
  a.remove();
  setTimeout(() => URL.revokeObjectURL(url), 1000);
}

$('downloadPng').onclick = () => canvas.toBlob(blob => {
  if (blob) download(blob, 'dope_card.png');
}, 'image/png');
$('saveJson').onclick = () => download(
  new Blob([JSON.stringify(getProfile(), null, 2)], { type: 'application/json' }),
  'dope_profile.json'
);
$('loadJson').onchange = async e => {
  const file = e.target.files[0];
  if (!file) return;
  try { loadProfile(JSON.parse(await file.text())); }
  catch (err) { alert('Could not load profile: ' + err.message); }
  e.target.value = '';
};
$('reset').onclick = () => {
  [...tbody.querySelectorAll('input')].forEach((el, i) => {
    el.value = i % 4 === 0 ? String(initial[Math.floor(i / 4)]) : '';
  });
  render();
};

// BMP: 176x264, 1-bit, bottom-up. Rotate landscape pixels 90 degrees CCW.
// Palette: index 0 black, index 1 white. Rows padded to 4-byte boundaries.
function makeBmp() {
  const outW = 176, outH = 264;
  const rowBytes = Math.ceil(outW / 32) * 4;
  const pixelSize = rowBytes * outH, offset = 62, total = offset + pixelSize;
  const buffer = new ArrayBuffer(total), v = new DataView(buffer), b = new Uint8Array(buffer);
  b[0] = 0x42; b[1] = 0x4d;
  v.setUint32(2, total, true);
  v.setUint32(10, offset, true);
  v.setUint32(14, 40, true);
  v.setInt32(18, outW, true);
  v.setInt32(22, outH, true);
  v.setUint16(26, 1, true);
  v.setUint16(28, 1, true);
  v.setUint32(34, pixelSize, true);
  v.setInt32(38, 2835, true);
  v.setInt32(42, 2835, true);
  v.setUint32(46, 2, true);
  b.set([0, 0, 0, 0, 255, 255, 255, 0], 54);
  const src = ctx.getImageData(0, 0, W, H).data;
  for (let y = 0; y < outH; y++) for (let x = 0; x < outW; x++) {
    const sx = W - 1 - y, sy = x;
    const k = (sy * W + sx) * 4;
    const lum = (src[k] * 299 + src[k + 1] * 587 + src[k + 2] * 114) / 1000;
    if (lum >= 128) {
      const byteIndex = offset + (outH - 1 - y) * rowBytes + (x >> 3);
      b[byteIndex] |= 0x80 >> (x & 7);
    }
  }
  return new Blob([buffer], { type: 'image/bmp' });
}
$('downloadBmp').onclick = () => download(makeBmp(), 'dope_card.bmp');
