// Electron entry point for the Windows desktop build.
const { app, BrowserWindow, Menu, shell, ipcMain } = require('electron');
const path = require('path');
const fs = require('fs');
const os = require('os');
const https = require('https');
const { spawn } = require('child_process');

// ---------------------------------------------------------------- updates (www/js/update.js asks for them)
const RELEASES = 'https://github.com/vladypiatko-crypto/fp/releases/download/';
// download a file, following GitHub's redirects, and report progress 0..100
function download(url, dest, onProgress, hops = 0) {
  return new Promise((resolve, reject) => {
    if (hops > 6) { reject(new Error('too many redirects')); return; }
    https.get(url, { headers: { 'User-Agent': 'QuackAttack' } }, res => {
      if (res.statusCode >= 300 && res.statusCode < 400 && res.headers.location) {
        res.resume();
        if (!res.headers.location.startsWith('https://')) { reject(new Error('bad redirect')); return; }
        download(res.headers.location, dest, onProgress, hops + 1).then(resolve, reject);
        return;
      }
      if (res.statusCode !== 200) { res.resume(); reject(new Error('HTTP ' + res.statusCode)); return; }
      const total = Number(res.headers['content-length']) || 0;
      let got = 0;
      const out = fs.createWriteStream(dest);
      res.on('data', chunk => { got += chunk.length; if (total) onProgress(Math.floor(got * 100 / total)); });
      res.pipe(out);
      out.on('finish', () => out.close(() => resolve()));
      out.on('error', reject); res.on('error', reject);
    }).on('error', reject);
  });
}
// the new exe can only take the old one's place once the game has closed: a tiny script waits for that,
// moves it over, starts the new version and deletes itself
function swapAndRestart(newExe, target) {
  const bat = path.join(os.tmpdir(), 'quack-update.cmd');
  fs.writeFileSync(bat, [
    '@echo off', 'set n=0',
    ':wait', 'timeout /t 1 /nobreak >nul', 'set /a n+=1',
    `move /y "${newExe}" "${target}" >nul 2>&1`,
    'if errorlevel 1 if %n% lss 30 goto wait',
    `start "" "${target}"`, '(goto) 2>nul & del "%~f0"', '',
  ].join('\r\n'));
  spawn('cmd.exe', ['/c', bat], { detached: true, stdio: 'ignore', windowsHide: true }).unref();
  app.quit();
}
ipcMain.handle('quack-update', async (e, url) => {
  if (typeof url !== 'string' || !url.startsWith(RELEASES)) throw new Error('not a game download');
  // the portable exe tells us where it really lives (the running copy is unpacked in a temp folder)
  const target = process.env.PORTABLE_EXECUTABLE_FILE;
  if (!target) { shell.openExternal(url); return 'opened'; } // not the portable build: just download it
  const newExe = path.join(os.tmpdir(), 'QuackAttack-new.exe');
  await download(url, newExe, p => { if (!e.sender.isDestroyed()) e.sender.send('quack-update-progress', p); });
  setTimeout(() => swapAndRestart(newExe, target), 600); // let the game show "restarting" first
  return 'restarting';
});

function createWindow() {
  const win = new BrowserWindow({
    width: 1280,
    height: 720,
    minWidth: 480,
    minHeight: 300,
    title: 'Quack Attack',
    backgroundColor: '#1b1325',
    autoHideMenuBar: true,
    icon: path.join(__dirname, 'build', 'icon.png'),
    webPreferences: { contextIsolation: true, backgroundThrottling: false, preload: path.join(__dirname, 'preload.js') },
  });
  Menu.setApplicationMenu(null);
  win.loadFile(path.join(__dirname, 'www', 'index.html'));
  // links the game opens (the update page) go to the normal web browser
  win.webContents.setWindowOpenHandler(({ url }) => {
    if (url.startsWith('https://')) shell.openExternal(url);
    return { action: 'deny' };
  });
  // F11 or Alt+Enter toggles fullscreen
  win.webContents.on('before-input-event', (event, input) => {
    if (input.type === 'keyDown' && (input.key === 'F11' || (input.alt && input.key === 'Enter'))) {
      win.setFullScreen(!win.isFullScreen());
      event.preventDefault();
    }
  });
}

app.whenReady().then(createWindow);
app.on('window-all-closed', () => app.quit());
