const { app, BrowserWindow, shell, ipcMain, net, dialog } = require('electron');
const path = require('path');
const fs = require('fs');
const { autoUpdater } = require('electron-updater');

let mainWindow = null;
let updateStatus = { stage: 'idle' };

// Configure Auto-Updater
autoUpdater.logger = console;
autoUpdater.autoDownload = true;
autoUpdater.autoInstallOnAppQuit = true;

const DEFAULT_UPDATE_URL = 'https://novotionsalesandlead.web.app/releases/';

function configureUpdateFeed() {
  const feedUrl = process.env.UPDATE_FEED_URL || DEFAULT_UPDATE_URL;
  try {
    autoUpdater.setFeedURL({
      provider: 'generic',
      url: feedUrl,
    });
    console.log('[AutoUpdater] Feed configured with:', feedUrl);
  } catch (err) {
    console.error('[AutoUpdater] Error setting feed URL:', err.message);
  }
}

function broadcastUpdateStatus(data) {
  updateStatus = data;
  if (mainWindow && !mainWindow.isDestroyed()) {
    mainWindow.webContents.send('update-status', data);
  }
}

function setupAutoUpdaterEvents() {
  autoUpdater.on('checking-for-update', () => {
    console.log('[AutoUpdater] Checking for updates...');
    broadcastUpdateStatus({ stage: 'checking' });
  });

  autoUpdater.on('update-available', (info) => {
    console.log('[AutoUpdater] Update available:', info.version);
    broadcastUpdateStatus({
      stage: 'available',
      version: info.version,
      releaseDate: info.releaseDate,
      releaseNotes: info.releaseNotes,
    });
  });

  autoUpdater.on('update-not-available', (info) => {
    console.log('[AutoUpdater] App is up to date (current version:', info.version, ')');
    broadcastUpdateStatus({
      stage: 'not-available',
      version: info.version,
    });
  });

  autoUpdater.on('download-progress', (progressObj) => {
    console.log(`[AutoUpdater] Download speed: ${progressObj.bytesPerSecond} - ${progressObj.percent.toFixed(1)}%`);
    broadcastUpdateStatus({
      stage: 'downloading',
      percent: Math.round(progressObj.percent),
      bytesPerSecond: progressObj.bytesPerSecond,
      transferred: progressObj.transferred,
      total: progressObj.total,
    });
  });

  autoUpdater.on('update-downloaded', (info) => {
    console.log('[AutoUpdater] Update downloaded successfully:', info.version);
    broadcastUpdateStatus({
      stage: 'downloaded',
      version: info.version,
    });

    if (mainWindow && !mainWindow.isDestroyed()) {
      dialog.showMessageBox(mainWindow, {
        type: 'info',
        title: 'Update Ready to Install',
        message: `Version ${info.version} of Novotion Sales & Lead Portal is ready.`,
        detail: 'The update has been downloaded. Restart the app now to apply the update immediately, or choose Later to update automatically when you exit.',
        buttons: ['Restart Now', 'Later'],
        defaultId: 0,
        cancelId: 1,
      }).then(({ response }) => {
        if (response === 0) {
          setImmediate(() => autoUpdater.quitAndInstall(false, true));
        }
      }).catch((dialogErr) => {
        console.error('[AutoUpdater] Dialog prompt error:', dialogErr);
      });
    }
  });

  autoUpdater.on('error', (err) => {
    console.error('[AutoUpdater] Error occurred:', err.message);
    broadcastUpdateStatus({
      stage: 'error',
      error: err.message || 'Auto-update check failed',
    });
  });
}

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
  return { url: process.env.BACKEND_URL || 'https://novotionsalesandlead.web.app' };
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

  ipcMain.handle('save-server-config', async (_event, config) => {
    return saveServerConfig(config);
  });

  ipcMain.handle('test-server-connection', async (_event, url) => {
    const targetUrl = (url || loadServerConfig().url).replace(/\/+$/, '') + '/api/health';
    try {
      const response = await net.fetch(targetUrl, { method: 'GET' });
      return { ok: response.ok, status: response.status };
    } catch (err) {
      return { ok: false, error: err.message || 'Server unreachable' };
    }
  });

  // Auto-Update IPC Handlers
  ipcMain.handle('get-app-version', () => {
    return app.getVersion();
  });

  ipcMain.handle('check-for-updates', async () => {
    try {
      if (!app.isPackaged && process.env.CHECK_UPDATES_IN_DEV !== 'true') {
        return { ok: false, message: 'Update checks are bypassed in local development mode.' };
      }
      const result = await autoUpdater.checkForUpdates();
      return { ok: true, versionInfo: result?.updateInfo };
    } catch (err) {
      console.error('[AutoUpdater] Manual check error:', err.message);
      return { ok: false, error: err.message };
    }
  });

  ipcMain.handle('restart-and-install-update', () => {
    autoUpdater.quitAndInstall(false, true);
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
      webSecurity: false, // allows local file bundle to connect to remote APIs without CORS rejection
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

  const indexPath = possiblePaths.find((p) => fs.existsSync(p));

  if (process.env.VITE_DEV_SERVER_URL) {
    console.log('[Electron] Loading dev server URL:', process.env.VITE_DEV_SERVER_URL);
    mainWindow.loadURL(process.env.VITE_DEV_SERVER_URL);
  } else if (indexPath) {
    console.log('[Electron] Loading local frontend bundle:', indexPath);
    mainWindow.loadFile(indexPath);
  } else {
    const fallbackUrl = process.env.BACKEND_URL || 'https://novotionsalesandlead.web.app';
    console.log('[Electron] Local frontend bundle not found, falling back to:', fallbackUrl);
    mainWindow.loadURL(fallbackUrl);
  }

  mainWindow.once('ready-to-show', () => {
    mainWindow.show();

    // Check for updates in background after launch
    if (app.isPackaged || process.env.CHECK_UPDATES_IN_DEV === 'true') {
      setTimeout(() => {
        console.log('[AutoUpdater] Initiating background update check...');
        autoUpdater.checkForUpdatesAndNotify().catch((err) => {
          console.warn('[AutoUpdater] Background update check failed:', err.message);
        });
      }, 4000);
    }
  });

  mainWindow.on('closed', () => {
    mainWindow = null;
  });

  return mainWindow;
}

app.whenReady().then(() => {
  configureUpdateFeed();
  setupAutoUpdaterEvents();
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
