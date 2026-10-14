// Bundles www/ into one self-contained HTML file (dist/QuackAttack.html) that runs in any browser.
const fs = require('fs');
const path = require('path');
const root = path.join(__dirname, '..');
const html = fs.readFileSync(path.join(root, 'www', 'index.html'), 'utf8');
const js = fs.readFileSync(path.join(root, 'www', 'game.js'), 'utf8').replace(/<\/script/gi, '<\\/script');
const out = html.replace('<script src="game.js"></script>', () => '<script>\n' + js + '\n</script>');
fs.mkdirSync(path.join(root, 'dist'), { recursive: true });
fs.writeFileSync(path.join(root, 'dist', 'QuackAttack.html'), out);
console.log('wrote dist/QuackAttack.html');
