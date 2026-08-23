/**
 * Build Italy DEM for View 5 from AWS Terrarium tiles (SRTM).
 * Run: node scripts/build-italy-height.cjs
 */
const fs = require('fs');
const path = require('path');
const zlib = require('zlib');
const https = require('https');
const { PNG } = require('pngjs');

const ROOT = path.resolve(__dirname, '..');
const OUT_PNG = path.join(ROOT, 'assets/maps/rome/italy-height.png');
const OUT_JSON = path.join(ROOT, 'assets/maps/rome/italy-height.json');
const OUT_PREVIEW = path.join(ROOT, 'assets/maps/rome/italy-height-preview.png');

const BBOX = [6.4, 36.2, 18.9, 47.4];
const OUT_W = 2048;
const OUT_H = 1920;
const Z = 8;
const OFFSET = 500;

function lon2x(lon, z) {
  return Math.pow(2, z) * ((lon + 180) / 360);
}
function lat2y(lat, z) {
  const n = Math.pow(2, z);
  const r = lat * Math.PI / 180;
  return n * (1 - Math.log(Math.tan(r) + 1 / Math.cos(r)) / Math.PI) / 2;
}

function get(url) {
  return new Promise(function (resolve, reject) {
    https.get(url, { headers: { 'User-Agent': 'italy-dem-builder/1.0' } }, function (res) {
      if (res.statusCode >= 300 && res.statusCode < 400 && res.headers.location) {
        return get(res.headers.location).then(resolve, reject);
      }
      if (res.statusCode !== 200) {
        res.resume();
        reject(new Error(url + ' → ' + res.statusCode));
        return;
      }
      const chunks = [];
      res.on('data', function (c) { chunks.push(c); });
      res.on('end', function () { resolve(Buffer.concat(chunks)); });
    }).on('error', reject);
  });
}

function decodeTile(buf) {
  const png = PNG.sync.read(buf);
  const h = new Float32Array(png.width * png.height);
  for (var i = 0; i < h.length; i++) {
    var o = i * 4;
    h[i] = png.data[o] * 256 + png.data[o + 1] + png.data[o + 2] / 256 - 32768;
  }
  return { w: png.width, h: png.height, data: h };
}

function sampleTile(tile, fx, fy) {
  var x = Math.max(0, Math.min(tile.w - 1.001, fx));
  var y = Math.max(0, Math.min(tile.h - 1.001, fy));
  var x0 = Math.floor(x), y0 = Math.floor(y);
  var x1 = Math.min(tile.w - 1, x0 + 1);
  var y1 = Math.min(tile.h - 1, y0 + 1);
  var tx = x - x0, ty = y - y0;
  var a = tile.data[y0 * tile.w + x0];
  var b = tile.data[y0 * tile.w + x1];
  var c = tile.data[y1 * tile.w + x0];
  var d = tile.data[y1 * tile.w + x1];
  return a * (1 - tx) * (1 - ty) + b * tx * (1 - ty) + c * (1 - tx) * ty + d * tx * ty;
}

async function main() {
  var x0 = Math.floor(lon2x(BBOX[0], Z));
  var x1 = Math.floor(lon2x(BBOX[2], Z));
  var y0 = Math.floor(lat2y(BBOX[3], Z));
  var y1 = Math.floor(lat2y(BBOX[1], Z));
  console.log('tiles z=' + Z + ' x=' + x0 + '..' + x1 + ' y=' + y0 + '..' + y1);

  var tiles = new Map();
  var urls = [];
  var xi, yi;
  for (yi = y0; yi <= y1; yi++) {
    for (xi = x0; xi <= x1; xi++) {
      urls.push({ key: xi + ',' + yi, x: xi, y: yi });
    }
  }

  for (var i = 0; i < urls.length; i++) {
    var u = urls[i];
    var url = 'https://s3.amazonaws.com/elevation-tiles-prod/terrarium/' + Z + '/' + u.x + '/' + u.y + '.png';
    process.stdout.write('  ' + (i + 1) + '/' + urls.length + ' ' + u.key + '\r');
    try {
      tiles.set(u.key, decodeTile(await get(url)));
    } catch (err) {
      console.warn('\nskip ' + u.key + ': ' + err.message);
    }
  }
  console.log('\nloaded ' + tiles.size + ' tiles');
  if (!tiles.size) throw new Error('No elevation tiles');

  var meters = new Float32Array(OUT_W * OUT_H);
  var png = new PNG({ width: OUT_W, height: OUT_H });
  var preview = new PNG({ width: OUT_W, height: OUT_H });
  var minH = Infinity, maxH = -Infinity;

  for (var py = 0; py < OUT_H; py++) {
    var lat = BBOX[3] - (py / (OUT_H - 1)) * (BBOX[3] - BBOX[1]);
    for (var px = 0; px < OUT_W; px++) {
      var lon = BBOX[0] + (px / (OUT_W - 1)) * (BBOX[2] - BBOX[0]);
      var xf = lon2x(lon, Z);
      var yf = lat2y(lat, Z);
      var tx = Math.floor(xf);
      var ty = Math.floor(yf);
      var tile = tiles.get(tx + ',' + ty);
      var m = 0;
      if (tile) m = sampleTile(tile, (xf - tx) * 256, (yf - ty) * 256);
      if (!isFinite(m) || m < -500 || m > 9000) m = 0;
      meters[py * OUT_W + px] = m;
      if (m < minH) minH = m;
      if (m > maxH) maxH = m;
      var enc = Math.max(0, Math.min(65535, Math.round(m + OFFSET)));
      var o = (py * OUT_W + px) * 4;
      png.data[o] = (enc >> 8) & 255;
      png.data[o + 1] = enc & 255;
      png.data[o + 2] = 0;
      png.data[o + 3] = 255;
      var g = m <= 0 ? 20 : Math.max(0, Math.min(255, Math.round((m / 3500) * 255)));
      preview.data[o] = g;
      preview.data[o + 1] = g;
      preview.data[o + 2] = m <= 0 ? 60 : g;
      preview.data[o + 3] = 255;
    }
  }

  fs.mkdirSync(path.dirname(OUT_PNG), { recursive: true });
  fs.writeFileSync(OUT_PNG, PNG.sync.write(png));
  fs.writeFileSync(OUT_PREVIEW, PNG.sync.write(preview));
  fs.writeFileSync(OUT_JSON, JSON.stringify({
    bbox: BBOX,
    width: OUT_W,
    height: OUT_H,
    offset: OFFSET,
    min: minH,
    max: maxH,
    encoding: 'R*256+G-offset meters'
  }, null, 2));
  console.log('wrote', OUT_PNG);
  console.log('elev m', minH.toFixed(1), '..', maxH.toFixed(1));
}

main().catch(function (err) {
  console.error(err);
  process.exit(1);
});
