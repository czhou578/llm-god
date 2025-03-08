// First, mock the electron module
jest.mock('electron', () => ({
  ipcMain: {
    on: jest.fn(),
    emit: jest.fn(),
    removeAllListeners: jest.fn()
  }
}));

// Then import it
const { ipcMain } = require("electron");
const { addBrowserView, removeBrowserView } = require("../utilities");

jest.mock("../utilities", () => ({
  addBrowserView: jest.fn(),
  removeBrowserView: jest.fn(),
}));

describe("IPC Handlers", () => {
  let mainWindow;
  let websites;
  let views;

  beforeEach(() => {
    mainWindow = { addBrowserView: jest.fn(), removeBrowserView: jest.fn() };
    websites = [];
    views = [];

    // Register the handlers
    ipcMain.on("open-perplexity", (event, prompt) => {
      addBrowserView(mainWindow, "https://www.perplexity.ai/", websites, views);
    });

    ipcMain.on("close-perplexity", (event, prompt) => {
      const view = views.find(v => v.id === "perplexity");
      if (view) {
        removeBrowserView(mainWindow, view, websites, views);
      }
    });
  });

  afterEach(() => {
    // Remove all listeners after each test to prevent interference
    ipcMain.removeAllListeners();
  });

  test("open-perplexity handler", () => {
    const event = {};
    const prompt = "open perplexity now";

    // Emit the event to trigger the handler
    ipcMain.emit("open-perplexity", event, prompt);

    expect(addBrowserView).toHaveBeenCalledWith(
      mainWindow,
      "https://www.perplexity.ai/",
      websites,
      views
    );
  });

  test("close-perplexity handler", () => {
    const event = {};
    const prompt = "close perplexity now";
    const view = { id: "perplexity" };
    views.push(view);

    // Emit the event to trigger the handler
    ipcMain.emit("close-perplexity", event, prompt);

    expect(removeBrowserView).toHaveBeenCalledWith(
      mainWindow,
      view,
      websites,
      views
    );
  });
});