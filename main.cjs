const { app, BrowserWindow, shell, ipcMain, net } = require('electron');
const path = require('path');
const fs = require('fs');

let mainWindow = null;

function getConfigPath() {
  return path.join(app.getPath('userData'), 'server-config.json');
}

function loadServerConfig() {
  try {
    const configPath = getConfigPath();
    if (fs.existsSync(configPath)) {
      const data = JSON.parse(fs.readFileSync(configPath, 'utf8'));
      if (data && data.url) return data;
    }
  } catch (err) {
    console.error('[Electron] Error reading server config:', err.message);
  }
  return { url: process.env.BACKEND_URL || 'http://localhost:5000' };
}

function saveServerConfig(config) {
  try {
    const configPath = getConfigPath();
    fs.mkdirSync(path.dirname(configPath), { recursive: true });
    fs.writeFileSync(configPath, JSON.stringify(config, null, 2), 'utf8');
    return { ok: true };
  } catch (err) {
    console.error('[Electron] Error saving server config:', err.message);
    return { ok: false, error: err.message };
  }
}

function registerIpcHandlers() {
  ipcMain.handle('get-server-config', async () => {
    return loadServerConfig();
  });

  ipcMain.handle('save-server-config', async (event, config) => {
    return saveServerConfig(config);
  });

  ipcMain.handle('test-server-connection', async (event, url) => {
    const targetUrl = (url || loadServerConfig().url).replace(/\/+$/, '') + '/api/health';
    try {
      const response = await net.fetch(targetUrl, { method: 'GET' });
      return { ok: response.ok, status: response.status };
    } catch (err) {
      return { ok: false, error: err.message || 'Server unreachable' };
    }
  });
}

function createMainWindow() {
  const iconPath = path.join(__dirname, 'assets', 'icon.png');

  mainWindow = new BrowserWindow({
    width: 1440,
    height: 900,
    minWidth: 1100,
    minHeight: 700,
    title: 'Novotion Sales & Lead Portal',
    icon: fs.existsSync(iconPath) ? iconPath : undefined,
    backgroundColor: '#090d16',
    autoHideMenuBar: true,
    webPreferences: {
      preload: path.join(__dirname, 'preload.cjs'),
      nodeIntegration: false,
      contextIsolation: true,
      webSecurity: false, // allows file:// to fetch http://localhost:5000 without CORS blocking
    },
  });

  mainWindow.webContents.setWindowOpenHandler(({ url }) => {
    if (url.startsWith('http:') || url.startsWith('https:')) {
      shell.openExternal(url);
      return { action: 'deny' };
    }
    return { action: 'allow' };
  });

  // Resolve frontend index.html
  const possiblePaths = [
    path.join(__dirname, '..', 'frontend', 'dist', 'index.html'),
    path.join(process.resourcesPath, 'frontend', 'dist', 'index.html'),
    path.join(process.resourcesPath, 'app', 'frontend', 'dist', 'index.html'),
    path.join(__dirname, 'dist', 'index.html'),
  ];

  const indexPath = possiblePaths.find(p => fs.existsSync(p));

  if (process.env.VITE_DEV_SERVER_URL) {
    console.log('[Electron] Loading dev server URL:', process.env.VITE_DEV_SERVER_URL);
    mainWindow.loadURL(process.env.VITE_DEV_SERVER_URL);
  } else if (indexPath) {
    console.log('[Electron] Loading local frontend bundle:', indexPath);
    mainWindow.loadFile(indexPath);
  } else {
    const fallbackUrl = process.env.BACKEND_URL || 'http://localhost:5000';
    console.log('[Electron] Local frontend bundle not found, falling back to:', fallbackUrl);
    mainWindow.loadURL(fallbackUrl);
  }

  mainWindow.once('ready-to-show', () => {
    mainWindow.show();
  });

  mainWindow.on('closed', () => {
    mainWindow = null;
  });

  return mainWindow;
}

app.whenReady().then(() => {
  registerIpcHandlers();
  createMainWindow();

  app.on('activate', () => {
    if (BrowserWindow.getAllWindows().length === 0) {
      createMainWindow();
    }
  });
});

app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') {
    app.quit();
  }
});
