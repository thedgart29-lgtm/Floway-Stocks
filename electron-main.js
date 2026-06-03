import { app, BrowserWindow, dialog, ipcMain, Menu } from 'electron';
import path from 'path';
import { fileURLToPath } from 'url';
import pkg from 'electron-updater';
const { autoUpdater } = pkg;

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Configure Auto Updater
autoUpdater.autoDownload = true;
autoUpdater.autoInstallOnAppQuit = true;

let win;

function createWindow() {
  const isDev = !app.isPackaged;
  
  // Disable default menu
  Menu.setApplicationMenu(null);
  
  win = new BrowserWindow({
    width: 1200,
    height: 800,
    resizable: true,
    maximizable: true,
    frame: true,
    show: false,
    title: "Pixivo.in - Industrial Accounting Suite",
    webPreferences: {
      nodeIntegration: false,
      contextIsolation: true,
      preload: path.join(__dirname, 'preload.js'),
    },
    icon: path.join(__dirname, 'public/vite.svg'),
  });

  win.once('ready-to-show', () => {
    win.maximize();
    win.show();
    win.focus();
  });

  // Basic IPC Handlers
  ipcMain.on('window-resize-main', () => {
    if (win) {
      win.maximize();
    }
  });

  ipcMain.on('close-app', () => {
    app.quit();
  });

  if (isDev) {
    win.loadURL('http://localhost:5173');
  } else {
    win.loadFile(path.join(__dirname, 'dist', 'index.html'));
  }

  // Auto Update Event Handlers
  autoUpdater.on('update-available', () => {});

  autoUpdater.on('update-downloaded', (info) => {
    dialog.showMessageBox({
      type: 'info',
      title: 'Update Available',
      message: `A new version (${info.version}) has been downloaded. Would you like to install it now and restart the app?`,
      buttons: ['Install and Restart', 'Later']
    }).then((result) => {
      if (result.response === 0) {
        autoUpdater.quitAndInstall();
      }
    });
  });

  // Check for updates on startup
  if (!isDev) {
    autoUpdater.checkForUpdatesAndNotify();
  }
}

app.whenReady().then(() => {
  createWindow();

  app.on('activate', () => {
    if (BrowserWindow.getAllWindows().length === 0) createWindow();
  });
});

app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') app.quit();
});
