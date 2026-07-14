/* global process */
import 'dotenv/config';
import { app, BrowserWindow, dialog, ipcMain, Menu } from 'electron';
import path from 'path';
import { fileURLToPath } from 'url';
import pkg from 'electron-updater';
import os from 'os';
import nodemailer from 'nodemailer';

const { autoUpdater } = pkg;

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Configure Auto Updater
autoUpdater.autoDownload = true;
autoUpdater.autoInstallOnAppQuit = true;

let loginWin = null;
let mainWin  = null;

// ─── LOGIN WINDOW ────────────────────────────────────────────────────────────
function createLoginWindow() {
  const isDev = !app.isPackaged;

  Menu.setApplicationMenu(null);

  loginWin = new BrowserWindow({
    width: 480,
    height: 560,
    resizable: false,
    maximizable: false,
    minimizable: false,
    frame: false,
    transparent: true,
    backgroundColor: '#00000000',
    alwaysOnTop: false,
    center: true,
    show: false,
    title: 'Floway Stock – Login',
    webPreferences: {
      nodeIntegration: false,
      contextIsolation: true,
      preload: path.join(__dirname, 'preload.js'),
    },
    icon: path.join(__dirname, 'public/icon.ico'),
  });

  loginWin.once('ready-to-show', () => {
    loginWin.show();
    loginWin.focus();
  });

  // ESC closes login window (app quits)
  loginWin.webContents.on('before-input-event', (_event, input) => {
    if (input.type === 'keyDown' && input.key === 'Escape') {
      app.quit();
    }
  });

  if (isDev) {
    loginWin.loadURL('http://localhost:5173?window=login');
  } else {
    loginWin.loadFile(path.join(__dirname, 'dist', 'index.html'), {
      query: { window: 'login' }
    });
  }
}

// ─── MAIN WINDOW ─────────────────────────────────────────────────────────────
function createMainWindow() {
  const isDev = !app.isPackaged;

  mainWin = new BrowserWindow({
    width: 1200,
    height: 800,
    resizable: true,
    maximizable: true,
    frame: false,
    show: false,
    title: 'Floway Stock',
    webPreferences: {
      nodeIntegration: false,
      contextIsolation: true,
      preload: path.join(__dirname, 'preload.js'),
    },
    icon: path.join(__dirname, 'public/vite.svg'),
  });

  mainWin.once('ready-to-show', () => {
    mainWin.maximize();
    mainWin.show();
    mainWin.focus();
  });

  ipcMain.on('minimize-app', () => { if (mainWin) mainWin.minimize(); });
  ipcMain.on('maximize-app', () => {
    if (mainWin) {
      if (mainWin.isMaximized()) mainWin.unmaximize();
      else mainWin.maximize();
    }
  });
  ipcMain.on('close-app', () => app.quit());

  ipcMain.on('window-resize-main', () => { if (mainWin) mainWin.maximize(); });

  if (isDev) {
    mainWin.loadURL('http://localhost:5173?window=main');
  } else {
    mainWin.loadFile(path.join(__dirname, 'dist', 'index.html'), {
      query: { window: 'main' }
    });
  }

  // Auto Update Event Listeners
  autoUpdater.on('checking-for-update', () => {
    console.log('Checking for update...');
  });
  autoUpdater.on('update-available', (info) => {
    console.log('Update available. Downloading...', info);
  });
  autoUpdater.on('update-not-available', (info) => {
    console.log('Update not available.');
  });
  autoUpdater.on('error', (err) => {
    console.error('Error in auto-updater:', err);
  });
  autoUpdater.on('download-progress', (progressObj) => {
    console.log(`Download progress: ${progressObj.percent}%`);
  });
  autoUpdater.on('update-downloaded', (info) => {
    console.log('Update downloaded successfully');
    dialog.showMessageBox({
      type: 'info',
      title: 'Update Available',
      message: `A new version (${info.version}) has been downloaded. Would you like to install it now?`,
      buttons: ['Install and Restart', 'Later']
    }).then((result) => {
      if (result.response === 0) autoUpdater.quitAndInstall();
    });
  });

  if (!isDev) autoUpdater.checkForUpdatesAndNotify();
}

// ─── IPC: Login Success → open main window ───────────────────────────────────
ipcMain.on('login-success', () => {
  createMainWindow();
  if (loginWin) {
    loginWin.destroy();
    loginWin = null;
  }
});

// ─── IPC: get local IP ───────────────────────────────────────────────────────
ipcMain.handle('get-local-ip', () => {
  try {
    const interfaces = os.networkInterfaces();
    for (const name of Object.keys(interfaces)) {
      for (const iface of interfaces[name]) {
        if (iface.family === 'IPv4' && !iface.internal) return iface.address;
      }
    }
  } catch { /* fallback */ }
  return '127.0.0.1';
});

// ─── IPC: send OTP Email (SMTP) ────────────────────────────────────────────────
ipcMain.handle('send-otp-email', async (event, { email, otp }) => {
  const gmailUser = process.env.GMAIL_USER || 'pixivo.in@gmail.com';
  const gmailPass = process.env.GMAIL_APP_PASS || 'mhfz pjis iqqx dobw';

  if (!gmailUser || !gmailPass) {
    console.error('SMTP credentials missing');
    return { success: false, error: 'SMTP credentials missing' };
  }

  try {
    const transporter = nodemailer.createTransport({
      service: 'gmail',
      auth: {
        user: gmailUser,
        pass: gmailPass,
      },
    });

    await transporter.sendMail({
      from: `"Floway Stock" <${gmailUser}>`,
      to: email,
      subject: 'Verification OTP - Floway Stock Management',
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 480px; margin: auto; padding: 32px; border-radius: 12px; border: 1px solid #e5e5e7; background: #f9f9fb;">
          <h2 style="color: #6366f1; margin-bottom: 8px;">Registration Verification OTP</h2>
          <p style="color: #555; font-size: 15px;">Use the following OTP to complete your company setup:</p>
          <div style="font-size: 42px; font-weight: 900; letter-spacing: 12px; color: #111827; text-align: center; padding: 24px; background: white; border-radius: 8px; border: 2px dashed #6366f1; margin: 24px 0;">${otp}</div>
          <p style="color: #888; font-size: 13px;">⏱ Valid for <strong>10 minutes</strong>. Do not share this OTP with anyone.</p>
          <hr style="border: none; border-top: 1px solid #e5e5e7; margin: 24px 0;">
          <p style="color: #aaa; font-size: 11px;">Floway Stock Management System</p>
        </div>
      `,
    });

    console.log(`✅ SMTP OTP email successfully sent to ${email}`);
    return { success: true };
  } catch (err) {
    console.error('❌ Failed to send SMTP OTP email:', err);
    return { success: false, error: err.message };
  }
});

// ─── App Ready ───────────────────────────────────────────────────────────────
app.whenReady().then(() => {
  createLoginWindow();

  app.on('activate', () => {
    if (BrowserWindow.getAllWindows().length === 0) createLoginWindow();
  });
});

app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') app.quit();
});
