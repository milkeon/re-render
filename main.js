const path = require('path');
const { app, BrowserWindow } = require('electron');

function createWindow() {
  const win = new BrowserWindow({
    width: 1560,
    height: 980,
    minWidth: 1180,
    minHeight: 760,
    backgroundColor: '#050816',
    title: 're:render',
    webPreferences: {
      preload: path.join(__dirname, 'preload.js'),
      contextIsolation: true,
      nodeIntegration: false,
      sandbox: false,
    },
  });

  win.removeMenu();
  win.setMenuBarVisibility(false);
  win.loadFile(path.join(__dirname, 'index.html'));

  win.webContents.once('did-finish-load', async () => {
    if (!process.env.RERENDER_DEBUG) return;
    try {
      const probe = await win.webContents.executeJavaScript(
        "({ hasBridge: !!window.__rerenderNative, hasList: !!window.__rerenderNative?.listRunningSources, hasWindowList: !!window.__rerenderNative?.listRunningWindows })",
      );
      console.log('[rerender-debug]', JSON.stringify(probe));
    } catch (error) {
      console.error('[rerender-debug] failed', error);
    }
  });
}

app.disableHardwareAcceleration();
app.whenReady().then(() => {
  createWindow();

  app.on('activate', () => {
    if (BrowserWindow.getAllWindows().length === 0) createWindow();
  });
});

app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') app.quit();
});
