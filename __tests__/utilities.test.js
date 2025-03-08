const { BrowserWindow, BrowserView } = require("electron");
const { addBrowserView, removeBrowserView } = require("../utilities");

jest.mock("electron", () => ({
  BrowserWindow: jest.fn().mockImplementation(() => ({
    addBrowserView: jest.fn(),
    removeBrowserView: jest.fn(),
    setTopBrowserView: jest.fn(),
    getBounds: jest.fn().mockReturnValue({ width: 1200, height: 800 }),
  })),
  BrowserView: jest.fn().mockImplementation(() => ({
    webContents: {
      setZoomFactor: jest.fn(),
      loadURL: jest.fn(),
    },
    setBounds: jest.fn(),
  })),
}));

describe("Utilities", () => {
  let mainWindow;
  let websites;
  let views;

  beforeEach(() => {
    mainWindow = new BrowserWindow();
    websites = [];
    views = [];
  });

  test("addBrowserView adds a new BrowserView", () => {
    const url = "https://example.com";
    addBrowserView(mainWindow, url, websites, views);

    expect(websites).toContain(url);
    expect(views.length).toBe(1);
    expect(mainWindow.addBrowserView).toHaveBeenCalled();
    expect(views[0].webContents.loadURL).toHaveBeenCalledWith(url);
  });

  test("removeBrowserView removes a BrowserView", () => {
    const url = "https://example.com";
    const view = addBrowserView(mainWindow, url, websites, views);

    removeBrowserView(mainWindow, view, websites, views);

    expect(websites).not.toContain(url);
    expect(views.length).toBe(0);
    expect(mainWindow.removeBrowserView).toHaveBeenCalledWith(view);
  });
});