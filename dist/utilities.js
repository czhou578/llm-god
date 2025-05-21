import { WebContentsView } from "electron"; // Added WebPreferences type
/**
 * Creates and configures a new BrowserView for the main window
 * @param mainWindow - The main Electron window
 * @param url - The URL to load in the browser view
 * @param websites - Array of currently open website URLs
 * @param views - Array of currently open BrowserViews
 * @param webPreferences - Optional web preferences for the BrowserView
 * @returns The newly created BrowserView
 */
export function addBrowserView(
  mainWindow,
  url,
  websites,
  views,
  webPreferences = {},
) {
  const view = new WebContentsView({
    webPreferences: {
      nodeIntegration: false,
      contextIsolation: true,
      // offscreen: false, // offscreen is not a direct webPreferences option, but a BrowserView constructor option if needed elsewhere.
      devTools: true,
      ...webPreferences,
    },
  });
  view.id = url;
  mainWindow.contentView.addChildView(view);
  const { width, height } = mainWindow.getBounds();
  websites.push(url);
  const viewWidth = Math.floor(width / websites.length);
  views.forEach((v, index) => {
    v.setBounds({
      x: index * viewWidth,
      y: 0,
      width: viewWidth,
      height: height - 200,
    });
  });
  view.setBounds({
    x: (websites.length - 1) * viewWidth,
    y: 0,
    width: viewWidth,
    height: height - 200,
  });
  view.webContents.setZoomFactor(1.5);
  view.webContents.loadURL(url);
  views.push(view);
  // mainWindow.setTopBrowserView(view);
  // mainWindow.contentView.(view);
  return view;
}
export function removeBrowserView(
  mainWindow,
  viewToRemove, // Changed to viewToRemove for clarity
  websites,
  views,
) {
  const viewIndex = views.indexOf(viewToRemove);
  if (viewIndex === -1) return;
  mainWindow.contentView.removeChildView(viewToRemove);
  const urlIndex = websites.findIndex((url) => url === viewToRemove.id);
  if (urlIndex !== -1) {
    websites.splice(urlIndex, 1);
  }
  views.splice(viewIndex, 1);
  if (views.length === 0) return;
  const { width, height } = mainWindow.getBounds();
  const viewWidth = Math.floor(width / views.length);
  views.forEach((v, index) => {
    v.setBounds({
      x: index * viewWidth,
      y: 0,
      width: viewWidth,
      height: height - 200,
    });
  });
}
