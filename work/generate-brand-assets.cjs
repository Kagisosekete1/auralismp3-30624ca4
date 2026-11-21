const fs = require('fs');
const path = require('path');
const sharp = require('sharp');

const root = process.cwd();
const source = path.join(root, 'src/assets/auralis-mark-source.jpg');
const wordmarkSource = path.join(root, 'src/assets/auralis-wordmark-source.webp');
const resources = path.join(root, 'android/app/src/main/res');
const assets = path.join(root, 'src/assets');
const navy = '#001123';

const clamp = (value, min, max) => Math.max(min, Math.min(max, value));

async function extractMark() {
  const { data, info } = await sharp(source).removeAlpha().raw().toBuffer({ resolveWithObject: true });
  const { width, height, channels } = info;
  const bg = [data[0], data[1], data[2]];
  const rgba = Buffer.alloc(width * height * 4);
  let left = width, top = height, right = -1, bottom = -1;

  for (let y = 0; y < height; y++) {
    for (let x = 0; x < width; x++) {
      const i = (y * width + x) * channels;
      const o = (y * width + x) * 4;
      const distance = Math.hypot(data[i] - bg[0], data[i + 1] - bg[1], data[i + 2] - bg[2]);
      const alpha = Math.round(clamp((distance - 20) * (255 / 42), 0, 255));
      rgba[o] = data[i];
      rgba[o + 1] = data[i + 1];
      rgba[o + 2] = data[i + 2];
      rgba[o + 3] = alpha;
      if (alpha > 8) {
        left = Math.min(left, x); top = Math.min(top, y);
        right = Math.max(right, x); bottom = Math.max(bottom, y);
      }
    }
  }

  const cropped = await sharp(rgba, { raw: { width, height, channels: 4 } })
    .extract({ left, top, width: right - left + 1, height: bottom - top + 1 })
    .png().toBuffer();
  return { cropped, width: right - left + 1, height: bottom - top + 1 };
}

async function markCanvas(mark, size, fill = null, scale = 0.74) {
  const target = Math.round(size * scale);
  let colorized = mark.cropped;
  if (fill) {
    const { data, info } = await sharp(mark.cropped).ensureAlpha().raw().toBuffer({ resolveWithObject: true });
    const rgb = fill.match(/[a-f\d]{2}/gi).slice(0, 3).map((value) => parseInt(value, 16));
    for (let i = 0; i < data.length; i += 4) {
      data[i] = rgb[0]; data[i + 1] = rgb[1]; data[i + 2] = rgb[2];
    }
    colorized = await sharp(data, { raw: { width: info.width, height: info.height, channels: 4 } }).png().toBuffer();
  }
  const logo = await sharp(colorized).resize(target, target, { fit: 'inside', kernel: 'lanczos3' }).png().toBuffer();
  return sharp({ create: { width: size, height: size, channels: 4, background: '#00000000' } })
    .composite([{ input: logo, gravity: 'centre' }]).png().toBuffer();
}

async function squareIcon(mark, size) {
  const innerSize = Math.round(size * 0.86);
  const logo = await sharp(source).resize(innerSize, innerSize, { fit: 'fill', kernel: 'lanczos3' }).png().toBuffer();
  return sharp({ create: { width: size, height: size, channels: 4, background: navy } })
    .composite([{ input: logo, gravity: 'centre' }]).png().toBuffer();
}

async function wordmarkCanvas(size, scale) {
  const logo = await sharp(wordmarkSource)
    .resize(Math.round(size * scale), Math.round(size * scale), { fit: 'inside', kernel: 'lanczos3' })
    .png().toBuffer();
  return sharp({ create: { width: size, height: size, channels: 4, background: '#00000000' } })
    .composite([{ input: logo, gravity: 'centre' }]).png().toBuffer();
}

async function run() {
  if (!fs.existsSync(source)) throw new Error(`Missing attached brand mark: ${source}`);
  if (!fs.existsSync(wordmarkSource)) throw new Error(`Missing full Auralis wordmark: ${wordmarkSource}`);
  fs.mkdirSync(assets, { recursive: true });
  const mark = await extractMark();
  const transparentMark = await markCanvas(mark, 512);
  await sharp(transparentMark).png().toFile(path.join(assets, 'auralis-mark.png'));

  const densitySizes = { mdpi: 48, hdpi: 72, xhdpi: 96, xxhdpi: 144, xxxhdpi: 192 };
  const adaptiveSizes = { mdpi: 108, hdpi: 162, xhdpi: 216, xxhdpi: 324, xxxhdpi: 432 };
  for (const [density, size] of Object.entries(densitySizes)) {
    const dir = path.join(resources, `mipmap-${density}`);
    fs.mkdirSync(dir, { recursive: true });
    const icon = await squareIcon(mark, size);
    await fs.promises.writeFile(path.join(dir, 'ic_launcher.png'), icon);
    await fs.promises.writeFile(path.join(dir, 'ic_launcher_round.png'), icon);
  }
  for (const [density, size] of Object.entries(adaptiveSizes)) {
    const dir = path.join(resources, `mipmap-${density}`);
    fs.mkdirSync(dir, { recursive: true });
    await fs.promises.writeFile(path.join(dir, 'ic_launcher_foreground.png'), await markCanvas(mark, size, null, 0.48));
  }

  const drawableNodpi = path.join(resources, 'drawable-nodpi');
  fs.mkdirSync(drawableNodpi, { recursive: true });
  const whiteMark = await markCanvas(mark, 96, '#ffffff');
  await sharp(whiteMark).png().toFile(path.join(drawableNodpi, 'ic_stat_onesignal_default.png'));
  await squareIcon(mark, 256).then((buffer) => fs.promises.writeFile(path.join(drawableNodpi, 'ic_onesignal_large_icon_default.png'), buffer));
  await sharp(await wordmarkCanvas(432, 0.50)).png().toFile(path.join(drawableNodpi, 'auralis_splash_logo.png'));

  const portrait = { mdpi: [320, 480], hdpi: [480, 800], xhdpi: [720, 1280], xxhdpi: [1080, 1920], xxxhdpi: [1440, 2560] };
  const landscape = { mdpi: [480, 320], hdpi: [800, 480], xhdpi: [1280, 720], xxhdpi: [1920, 1080], xxxhdpi: [2560, 1440] };
  for (const [orientation, sizes] of Object.entries({ port: portrait, land: landscape })) {
    for (const [density, [width, height]] of Object.entries(sizes)) {
      const size = Math.round(Math.min(width, height) * 0.48);
      const logo = await wordmarkCanvas(size, 0.85);
      await sharp({ create: { width, height, channels: 4, background: navy } })
        .composite([{ input: logo, gravity: 'centre' }]).png()
        .toFile(path.join(resources, `drawable-${orientation}-${density}`, 'splash.png'));
    }
  }
  await fs.promises.copyFile(path.join(resources, 'drawable-port-mdpi', 'splash.png'), path.join(resources, 'drawable', 'splash.png'));

  for (const [name, size] of Object.entries({ 'icon-512.png': 512, 'icon-192.png': 192, 'apple-touch-icon.png': 180, 'apple-touch-icon-167.png': 167, 'apple-touch-icon-152.png': 152, 'apple-touch-icon-120.png': 120 })) {
    await fs.promises.writeFile(path.join(root, 'public', name), await squareIcon(mark, size));
  }
  const generatedIcons = path.join(root, 'work/generated-icons');
  fs.mkdirSync(generatedIcons, { recursive: true });
  await fs.promises.writeFile(path.join(generatedIcons, 'auralis-playstore-icon-512.png'), await squareIcon(mark, 512));
  console.log('Generated Auralis launcher, splash, OneSignal, and web icons from the supplied mark.');
}

run().catch((error) => { console.error(error); process.exitCode = 1; });
