const fs = require('fs');
const path = require('path');
const crypto = require('crypto');

const wasms = path.resolve(__dirname, '..', 'wasm');
const files = fs.readdirSync(wasms).filter(
  (file) => file.endsWith('.wasm')
);
files.forEach((file) => {
  const data = fs.readFileSync(path.join(wasms, file));
  const data_b64 = data.toString('base64');
  const { name } = path.parse(file);
  const hash = crypto.createHash('sha1').update(data).digest('hex');
  const json = JSON.stringify({
    name, data: data_b64, hash: hash.substring(0, 8)
  });
  fs.writeFileSync(path.join(wasms, `${file}.json`), json);
});
