const { app, BrowserWindow, ipcMain } = require('electron');
const path = require('path');
const http = require('http');
const fs = require('fs');
const { Innertube } = require('youtubei.js');

let ytClientPromise = null;
function getYtClient() {
  if (!ytClientPromise) ytClientPromise = Innertube.create();
  return ytClientPromise;
}

// The YouTube embed player rejects file:// origins (error 153), so the
// renderer is served over a local http server instead of loadFile().
const MIME_TYPES = {
  '.html': 'text/html',
  '.js': 'text/javascript',
  '.css': 'text/css',
};

function startStaticServer() {
  return new Promise((resolve) => {
    const server = http.createServer((req, res) => {
      const reqPath = req.url === '/' ? '/index.html' : req.url;
      const filePath = path.join(__dirname, path.normalize(reqPath).replace(/^(\.\.[/\\])+/, ''));
      fs.readFile(filePath, (err, data) => {
        if (err) {
          res.writeHead(404);
          res.end('Not found');
          return;
        }
        const ext = path.extname(filePath);
        res.writeHead(200, { 'Content-Type': MIME_TYPES[ext] || 'application/octet-stream' });
        res.end(data);
      });
    });
    server.listen(0, '127.0.0.1', () => resolve(server));
  });
}

async function createWindow() {
  const server = await startStaticServer();
  const { port } = server.address();

  const win = new BrowserWindow({
    width: 1000,
    height: 700,
    minWidth: 700,
    minHeight: 500,
    backgroundColor: '#121212',
    webPreferences: {
      preload: path.join(__dirname, 'preload.js'),
      contextIsolation: true,
      nodeIntegration: false,
    },
  });

  win.setMenuBarVisibility(false);
  win.loadURL(`http://127.0.0.1:${port}/index.html`);
  win.on('closed', () => server.close());
}

ipcMain.handle('search-music', async (_event, query) => {
  const yt = await getYtClient();
  const result = await yt.search(query, { type: 'video' });
  return result.results
    .filter((v) => v.type === 'Video' && v.id)
    .slice(0, 20)
    .map((v) => ({
      id: v.id,
      title: v.title?.text || '(sin título)',
      author: v.author?.name || '',
      duration: v.duration?.text || '',
      thumbnail: v.thumbnails?.[0]?.url || '',
    }));
});

app.whenReady().then(() => {
  createWindow();

  app.on('activate', () => {
    if (BrowserWindow.getAllWindows().length === 0) createWindow();
  });
});

app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') app.quit();
});
