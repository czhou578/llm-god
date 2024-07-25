
const { app, BrowserWindow, BrowserView, ipcMain } = require('electron')

let mainWindow;
const views = [];

function createWindow() {
    mainWindow = new BrowserWindow({
        width: 1200,
        height: 800,
        webPreferences: {
            nodeIntegration: true,
            contextIsolation: false
        }
    });

    mainWindow.loadFile('index.html');

    // mainWindow.once('did-finish-load', () => {
    //     // Add a delay before sending the IPC message
    //     setTimeout(() => {
    //         mainWindow.webContents.send('log-message', 'Hello from main process!');
    //     }, 1000); // 1-second delay
    // });

    const websites = [
        'https://chat.openai.com/',
        // 'https://www.anthropic.com/',
        'https://www.perplexity.ai/'
    ];

    const viewWidth = Math.floor(mainWindow.getBounds().width / websites.length);

    websites.forEach((url, index) => {
        const view = new BrowserView({
            webPreferences: {
                nodeIntegration: false,
                contextIsolation: true
            },
            zoomFactor: 2.0
        });
        mainWindow.addBrowserView(view);
        view.setBounds({ x: index * viewWidth, y: 0, width: viewWidth, height: 600 });
        view.webContents.loadURL(url);
        // Listen for console log requests from renderer
        ipcMain.on('console-log', (event, message) => {
            view.webContents.executeJavaScript(`console.log(${JSON.stringify(message)})`);
        });
        view.webContents.openDevTools();
        views.push(view);
    });

    mainWindow.on('resize', () => {
        const { width, height } = mainWindow.getBounds();
        const viewWidth = Math.floor(width / websites.length);
        views.forEach((view, index) => {
            view.setBounds({ x: index * viewWidth, y: 0, width: viewWidth, height: height - 100 });
        });
    });
}

app.whenReady().then(createWindow);

app.on('window-all-closed', () => {
    if (process.platform !== 'darwin') app.quit();
});

ipcMain.on('enter-prompt', (event, prompt) => {
    views.forEach(view => {
        view.webContents.executeJavaScript(`
    {
        var inputElement = document.querySelector('#prompt-textarea');
        if (inputElement) {
          const inputEvent = new Event('input', { bubbles: true });
          inputElement.value = \`${prompt}\`; // must be escaped backticks to support multiline
          inputElement.dispatchEvent(inputEvent);
        }
      }
        `)
    })
})

ipcMain.on('send-prompt', (event, prompt) => {
    views.forEach(view => {
        view.webContents.executeJavaScript(`
        // var btn = document.querySelector("textarea[placeholder*='Send a message']+button"); // this one broke recently .. note that they add another div (for the file upload) in code interpreter mode
        var btn = document.querySelector('button[data-testid="send-button"]');
        if (btn) {
            btn.focus();
            btn.disabled = false;
            btn.click();
        }
    `);
    });
});