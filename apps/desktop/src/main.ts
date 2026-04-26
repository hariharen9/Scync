import { app, BrowserWindow, shell, Menu, globalShortcut } from 'electron';
import * as path from 'path';

// Keep a global reference of the window object to prevent garbage collection
let mainWindow: BrowserWindow | null = null;

const isDev = !app.isPackaged;

function createWindow(): void {
  mainWindow = new BrowserWindow({
    width: 1280,
    height: 820,
    minWidth: 480,
    minHeight: 600,
    title: 'Scync',
    backgroundColor: '#060606',
    icon: path.join(__dirname, '..', 'assets', 'icon.png'),
    titleBarStyle: 'hiddenInset', // Clean look on macOS
    frame: true,
    show: false, // Wait until ready-to-show
    webPreferences: {
      preload: path.join(__dirname, 'preload.js'),
      nodeIntegration: false,
      contextIsolation: true,
      sandbox: false,
      webSecurity: false,
    },
  });

  // Load the pre-built web app
  if (isDev) {
    // In dev mode, try Vite dev server or fall back to pre-built files
    const devUrl = process.env.VITE_DEV_SERVER_URL || 'http://localhost:5173';
    mainWindow.loadURL(devUrl).catch(() => {
      // If dev server isn't running, load from the built web app
      const fallback = path.join(__dirname, '..', '..', 'web', 'dist', 'index.html');
      mainWindow?.loadFile(fallback);
    });
    mainWindow.webContents.openDevTools({ mode: 'detach' });
  } else {
    // In production, start a local HTTP server
    // This solves CORS and Firebase Google Auth issues by serving over http://localhost
    const possiblePaths = [
      path.join(process.resourcesPath, 'app'),
      path.join(__dirname, '..', 'app'),
      path.join(app.getAppPath(), '..', 'app')
    ];

    let webDir = '';
    const fs = require('fs');
    const http = require('http');

    for (const p of possiblePaths) {
      if (fs.existsSync(path.join(p, 'index.html'))) {
        webDir = p;
        break;
      }
    }

    if (!webDir) {
      console.error('Could not find app directory in any of:', possiblePaths);
      mainWindow.loadURL('data:text/html,<h1>Could not find app files</h1>');
    } else {
      const mimeTypes: Record<string, string> = {
        '.html': 'text/html',
        '.js': 'text/javascript',
        '.css': 'text/css',
        '.json': 'application/json',
        '.png': 'image/png',
        '.jpg': 'image/jpeg',
        '.svg': 'image/svg+xml',
        '.ico': 'image/x-icon',
        '.webmanifest': 'application/manifest+json'
      };

      const server = http.createServer((req: any, res: any) => {
        let reqPath = req.url?.split('?')[0] || '/';
        
        // SPA Routing Fallback
        if (reqPath === '/' || !reqPath.includes('.')) {
          reqPath = '/index.html';
        }

        const filePath = path.join(webDir, reqPath);

        // Security: Prevent directory traversal
        if (!filePath.startsWith(webDir)) {
          res.writeHead(403);
          res.end('Forbidden');
          return;
        }

        fs.readFile(filePath, (err: any, data: any) => {
          if (err) {
            // Second SPA fallback for client-side routes like /vault
            fs.readFile(path.join(webDir, 'index.html'), (err2: any, fallbackData: any) => {
              if (err2) {
                res.writeHead(404);
                res.end('Not found');
                return;
              }
              res.writeHead(200, { 'Content-Type': 'text/html' });
              res.end(fallbackData);
            });
            return;
          }

          const ext = path.extname(filePath).toLowerCase();
          const contentType = mimeTypes[ext] || 'application/octet-stream';
          res.writeHead(200, { 'Content-Type': contentType });
          res.end(data);
        });
      });

      server.listen(0, '127.0.0.1', () => {
        const address = server.address();
        const port = address ? (address as any).port : 0;
        mainWindow?.loadURL(`http://localhost:${port}`);
      });
    }
  }

  // Show window when content is ready (prevents white flash)
  mainWindow.once('ready-to-show', () => {
    mainWindow?.show();
  });

  // Open external links in the default browser, but allow Firebase auth popups internally
  mainWindow.webContents.setWindowOpenHandler(({ url }) => {
    // Allow Firebase Auth and Google Accounts to open in an internal popup
    if (url.includes('firebaseapp.com/__/auth') || url.includes('accounts.google.com')) {
      return { 
        action: 'allow',
        overrideBrowserWindowOptions: {
          width: 500,
          height: 700,
          titleBarStyle: 'default', // standard frame for the popup
          webPreferences: {
            nodeIntegration: false,
            contextIsolation: true,
          }
        }
      };
    }

    if (url.startsWith('https://') || url.startsWith('http://')) {
      shell.openExternal(url);
    }
    return { action: 'deny' };
  });

  mainWindow.on('closed', () => {
    mainWindow = null;
  });
}

// Build the application menu
function createMenu(): void {
  const isMac = process.platform === 'darwin';

  const template: Electron.MenuItemConstructorOptions[] = [
    ...(isMac ? [{
      label: app.name,
      submenu: [
        { role: 'about' as const },
        { type: 'separator' as const },
        { role: 'hide' as const },
        { role: 'hideOthers' as const },
        { role: 'unhide' as const },
        { type: 'separator' as const },
        { role: 'quit' as const },
      ],
    }] : []),
    {
      label: 'Edit',
      submenu: [
        { role: 'undo' },
        { role: 'redo' },
        { type: 'separator' },
        { role: 'cut' },
        { role: 'copy' },
        { role: 'paste' },
        { role: 'selectAll' },
      ],
    },
    {
      label: 'View',
      submenu: [
        { role: 'reload' },
        { role: 'forceReload' },
        { role: 'toggleDevTools' },
        { type: 'separator' },
        { role: 'resetZoom' },
        { role: 'zoomIn' },
        { role: 'zoomOut' },
        { type: 'separator' },
        { role: 'togglefullscreen' },
      ],
    },
    {
      label: 'Window',
      submenu: [
        { role: 'minimize' },
        { role: 'zoom' },
        ...(isMac ? [
          { type: 'separator' as const },
          { role: 'front' as const },
        ] : [
          { role: 'close' as const },
        ]),
      ],
    },
    {
      label: 'Help',
      submenu: [
        {
          label: 'View on GitHub',
          click: () => shell.openExternal('https://github.com/hariharen9/Scync'),
        },
        {
          label: 'Report an Issue',
          click: () => shell.openExternal('https://github.com/hariharen9/Scync/issues'),
        },
      ],
    },
  ];

  const menu = Menu.buildFromTemplate(template);
  Menu.setApplicationMenu(menu);
}

// App lifecycle
app.whenReady().then(() => {
  createMenu();
  createWindow();

  // Register a 'CommandOrControl+Shift+S' shortcut to pop open the vault
  globalShortcut.register('CommandOrControl+Shift+S', () => {
    if (mainWindow) {
      if (mainWindow.isMinimized()) mainWindow.restore();
      mainWindow.show();
      mainWindow.focus();
    } else {
      createWindow();
    }
  });

  // macOS: re-create window when clicking dock icon if none exist
  app.on('activate', () => {
    if (BrowserWindow.getAllWindows().length === 0) {
      createWindow();
    }
  });
});

app.on('will-quit', () => {
  // Unregister all shortcuts when the app quits
  globalShortcut.unregisterAll();
});

// Quit when all windows are closed (except on macOS)
app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') {
    app.quit();
  }
});

// Security: prevent new window creation & spoof User Agent for Google Auth
app.on('web-contents-created', (_, contents) => {
  // Spoof User Agent to prevent Google Auth from blocking the internal Electron popup
  // By removing "Electron/xx.x.x" and "Scync/x.x.x" it looks like a standard Chrome browser.
  try {
    if (typeof contents.getUserAgent === 'function') {
      const currentUA = contents.getUserAgent();
      const customUserAgent = currentUA
        .replace(/Electron\/\S*\s/, '')
        .replace(/Scync\/\S*\s/, '');
      contents.setUserAgent(customUserAgent);
    }
  } catch (e) {
    console.error('Error spoofing User Agent:', e);
  }

  contents.on('will-navigate', (event, url) => {
    // Allow navigation within the app or Google Auth
    const isAuth = url.includes('firebaseapp.com') || url.includes('accounts.google.com');
    if (!url.startsWith('file://') && !url.startsWith('http://localhost') && !isAuth) {
      event.preventDefault();
      shell.openExternal(url);
    }
  });
});
