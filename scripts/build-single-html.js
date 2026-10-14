// Bundles www/ into one self-contained HTML file (dist/QuackAttack.html) that runs in any browser.
const fs = require('fs');
const path = require('path');
const root = path.join(__dirname, '..');
const www = path.join(root, 'www');
let html = fs.readFileSync(path.join(www, 'index.html'), 'utf8');
html = html.replace(/<script src="([^"]+)"><\/script>/g, (tag, src) => {
  const js = fs.readFileSync(path.join(www, src), 'utf8').replace(/<\/script/gi, '<\\/script');
  return '<script>\n' + js + '\n</script>';
});
fs.mkdirSync(path.join(root, 'dist'), { recursive: true });
fs.writeFileSync(path.join(root, 'dist', 'QuackAttack.html'), html);
console.log('wrote dist/QuackAttack.html (' + Math.round(html.length / 1024) + ' KB)');
