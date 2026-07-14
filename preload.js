/* global process, require */
const { contextBridge, ipcRenderer } = require('electron');

contextBridge.exposeInMainWorld('electronAPI', {
  platform: process.platform,
  loginSuccess: () => ipcRenderer.send('login-success'),
  closeApp:     () => ipcRenderer.send('close-app'),
  minimize:     () => ipcRenderer.send('minimize-app'),
  maximize:     () => ipcRenderer.send('maximize-app'),
  getLocalIP:   () => ipcRenderer.invoke('get-local-ip'),
  sendOTPEmail: (email, otp) => ipcRenderer.invoke('send-otp-email', { email, otp }),
});
