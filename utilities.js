const { BrowserWindow, BrowserView } = require("electron");

/**
 * Creates and configures a new BrowserView for the main window
 * @param {BrowserWindow} mainWindow - The main Electron window
 * @param {string} url - The URL to load in the browser view
 * @param {Array} websites - Array of currently open website URLs
 * @param {Array} views - Array of currently open BrowserViews
 * @param {Object} webPreferences - Optional web preferences for the BrowserView
 * @returns {BrowserView} The newly created BrowserView
 */
function addBrowserView(mainWindow, url, websites, views, webPreferences = {}) {
  // Create a new BrowserView with provided or default preferences
  const view = new BrowserView({
    webPreferences: {
      nodeIntegration: false,
      contextIsolation: true,
      offscreen: false,
      devTools: true,
      ...webPreferences,
    },
  });

  view.id = url;
  mainWindow.addBrowserView(view);

  // Recalculate view dimensions
  const { width, height } = mainWindow.getBounds();

  // Add URL to websites array
  websites.push(url);
  const viewWidth = Math.floor(width / websites.length);

  // Update bounds for all existing views
  views.forEach((v, index) => {
    v.setBounds({
      x: index * viewWidth,
      y: 0,
      width: viewWidth,
      height: height - 200,
    });
  });

  // Set bounds for new view
  view.setBounds({
    x: (websites.length - 1) * viewWidth,
    y: 0,
    width: viewWidth,
    height: height - 200,
  });

  // Configure and load the view
  view.webContents.setZoomFactor(1.5);
  view.webContents.loadURL(url);

  // Add view to views array
  views.push(view);

  // Bring the new view to the front
  mainWindow.setTopBrowserView(view);

  return view;
}

function removeBrowserView(mainWindow, view, websites, views) {
  // Find the index of the view to remove
  const viewIndex = views.indexOf(view);
  if (viewIndex === -1) return; // View not found

  // Remove the view from the window
  mainWindow.removeBrowserView(view);

  // Remove the URL from the websites array - use splice to modify the original array
  const urlIndex = websites.findIndex((url) => url === view.id);
  if (urlIndex !== -1) {
    websites.splice(urlIndex, 1);
  }

  // Remove the view from the views array - use splice to modify the original array
  views.splice(viewIndex, 1);

  // If there are no more views, return early
  if (views.length === 0) return;

  // Recalculate view dimensions
  const { width, height } = mainWindow.getBounds();
  const viewWidth = Math.floor(width / views.length); // Use views.length instead of websites.length

  // Update bounds for all remaining views to expand and fill the space
  views.forEach((v, index) => {
    v.setBounds({
      x: index * viewWidth,
      y: 0,
      width: viewWidth,
      height: height - 200,
    });
  });
}

module.exports = {
  addBrowserView,
  removeBrowserView,
};
