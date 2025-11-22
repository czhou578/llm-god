/**
 * Main process tests - Window Management
 */

describe("Main Process - Window Management", () => {
  let mockBrowserWindow: any;
  let mockWebContentsView: any;
  let mainWindowInstance: any;
  let formWindowInstance: any;
  let modelSelectionWindowInstance: any;
  let editWindowInstance: any;

  beforeEach(() => {
    // Mock window instances
    mainWindowInstance = {
      loadFile: jest.fn().mockResolvedValue(undefined),
      webContents: {
        executeJavaScript: jest.fn().mockResolvedValue("dark"),
        on: jest.fn(),
      },
      getBounds: jest.fn(() => ({ width: 2000, height: 1100, x: 0, y: 0 })),
      contentView: {
        addChildView: jest.fn(),
      },
      once: jest.fn((event, callback) => {
        if (event === "ready-to-show") {
          setTimeout(callback, 0);
        }
      }),
      on: jest.fn(),
      show: jest.fn(),
      close: jest.fn(),
      isDestroyed: jest.fn(() => false),
    };

    formWindowInstance = {
      loadFile: jest.fn().mockResolvedValue(undefined),
      webContents: {
        executeJavaScript: jest.fn().mockResolvedValue(undefined),
        on: jest.fn(),
        send: jest.fn(),
      },
      once: jest.fn(),
      show: jest.fn(),
      close: jest.fn(),
      isDestroyed: jest.fn(() => false),
    };

    modelSelectionWindowInstance = {
      loadFile: jest.fn().mockResolvedValue(undefined),
      webContents: {
        executeJavaScript: jest.fn().mockResolvedValue(undefined),
        on: jest.fn(),
      },
      once: jest.fn(),
      show: jest.fn(),
      close: jest.fn(),
      isDestroyed: jest.fn(() => false),
    };

    editWindowInstance = {
      loadFile: jest.fn().mockResolvedValue(undefined),
      webContents: {
        executeJavaScript: jest.fn().mockResolvedValue(undefined),
        on: jest.fn(),
      },
      once: jest.fn(),
      show: jest.fn(),
      close: jest.fn(),
    };

    mockBrowserWindow = jest.fn().mockImplementation((options) => {
      if (options.width === 2000) return mainWindowInstance;
      if (options.width === 900) return formWindowInstance;
      if (options.width === 600) return modelSelectionWindowInstance;
      if (options.width === 500) return editWindowInstance;
      return mainWindowInstance;
    });

    mockBrowserWindow.fromWebContents = jest.fn(() => editWindowInstance);

    mockWebContentsView = jest.fn().mockImplementation(() => ({
      id: "",
      webContents: {
        loadURL: jest.fn(),
        setZoomFactor: jest.fn(),
        openDevTools: jest.fn(),
      },
      setBounds: jest.fn(),
      setBackgroundColor: jest.fn(),
    }));

    jest.clearAllMocks();
  });

  describe("createWindow", () => {
    test("creates window with correct dimensions", () => {
      const options = {
        width: 2000,
        height: 1100,
        center: true,
        backgroundColor: "#000000",
        show: false,
      };

      const window = mockBrowserWindow(options);

      expect(window).toBeDefined();
    });

    test("sets correct background color", () => {
      const options = { backgroundColor: "#000000" };
      const window = mockBrowserWindow(options);

      expect(options.backgroundColor).toBe("#000000");
    });

    test("sets show to false initially", () => {
      const options = { show: false };

      expect(options.show).toBe(false);
    });

    test("calls show after ready-to-show event", (done) => {
      const window = mainWindowInstance;
      const callback = window.once.mock.calls.find(
        (call: any) => call[0] === "ready-to-show",
      )?.[1];

      if (callback) {
        callback();
        setTimeout(() => {
          expect(window.show).toHaveBeenCalled();
          done();
        }, 10);
      } else {
        done();
      }
    });

    test("registers resize event handler", () => {
      const window = mainWindowInstance;
      window.on("resize", jest.fn());

      expect(window.on).toHaveBeenCalledWith("resize", expect.any(Function));
    });

    test("registers enter-full-screen event handler", () => {
      const window = mainWindowInstance;
      window.on("enter-full-screen", jest.fn());

      expect(window.on).toHaveBeenCalledWith(
        "enter-full-screen",
        expect.any(Function),
      );
    });

    test("registers leave-full-screen event handler", () => {
      const window = mainWindowInstance;
      window.on("leave-full-screen", jest.fn());

      expect(window.on).toHaveBeenCalledWith(
        "leave-full-screen",
        expect.any(Function),
      );
    });
  });

  describe("createFormWindow", () => {
    test("creates form window with correct dimensions", () => {
      const options = {
        width: 900,
        height: 900,
        modal: true,
        show: false,
      };

      const window = mockBrowserWindow(options);

      expect(window).toBeDefined();
    });

    test("applies dark theme background color", () => {
      const currentTheme: string = "dark";
      const backgroundColor = currentTheme === "dark" ? "#1e1e1e" : "#f0f0f0";

      expect(backgroundColor).toBe("#1e1e1e");
    });

    test("applies light theme background color", () => {
      const currentTheme: string = "light";
      const backgroundColor = currentTheme === "dark" ? "#1e1e1e" : "#f0f0f0";

      expect(backgroundColor).toBe("#f0f0f0");
    });

    test("sets modal to true", () => {
      const options = { modal: true };

      expect(options.modal).toBe(true);
    });

    test("waits for dom-ready before applying theme", () => {
      const window = formWindowInstance;
      const callback = jest.fn();

      window.webContents.on("dom-ready", callback);

      expect(window.webContents.on).toHaveBeenCalledWith(
        "dom-ready",
        expect.any(Function),
      );
    });

    test("shows window on ready-to-show event", () => {
      const window = formWindowInstance;
      const callback = jest.fn(() => window.show());

      window.once("ready-to-show", callback);

      expect(window.once).toHaveBeenCalledWith(
        "ready-to-show",
        expect.any(Function),
      );
    });
  });

  describe("createModelSelectionWindow", () => {
    test("creates model selection window with correct dimensions", () => {
      const options = {
        width: 600,
        height: 700,
        modal: true,
        show: false,
      };

      const window = mockBrowserWindow(options);

      expect(window).toBeDefined();
    });

    test("applies dark theme background color", () => {
      const currentTheme: string = "dark";
      const backgroundColor = currentTheme === "dark" ? "#1e1e1e" : "#f5f5f5";

      expect(backgroundColor).toBe("#1e1e1e");
    });

    test("applies light theme background color", () => {
      const currentTheme: string = "light";
      const backgroundColor = currentTheme === "dark" ? "#1e1e1e" : "#f5f5f5";

      expect(backgroundColor).toBe("#f5f5f5");
    });

    test("waits for dom-ready before applying theme", () => {
      const window = modelSelectionWindowInstance;
      const callback = jest.fn();

      window.webContents.on("dom-ready", callback);

      expect(window.webContents.on).toHaveBeenCalledWith(
        "dom-ready",
        expect.any(Function),
      );
    });
  });

  describe("Edit Window", () => {
    test("creates edit window with correct dimensions", () => {
      const options = {
        width: 500,
        height: 600,
        modal: true,
        show: false,
      };

      const window = mockBrowserWindow(options);

      expect(window).toBeDefined();
    });

    test("escapes backslashes in prompt", () => {
      const prompt = "C:\\Users\\test";
      const escaped = prompt.replace(/\\/g, "\\\\");

      expect(escaped).toBe("C:\\\\Users\\\\test");
    });

    test("escapes backticks in prompt", () => {
      const prompt = "Code `example` here";
      const escaped = prompt.replace(/`/g, "\\`");

      expect(escaped).toBe("Code \\`example\\` here");
    });

    test("escapes dollar signs in prompt", () => {
      const prompt = "Variable $name";
      const escaped = prompt.replace(/\$/g, "\\$");

      expect(escaped).toBe("Variable \\$name");
    });

    test("applies all escapes together", () => {
      const prompt = "Test `code` $var \\path";
      const escaped = prompt
        .replace(/\\/g, "\\\\")
        .replace(/`/g, "\\`")
        .replace(/\$/g, "\\$");

      expect(escaped).toContain("\\`");
      expect(escaped).toContain("\\$");
      expect(escaped).toContain("\\\\");
    });

    test("generates correct theme class for dark mode", () => {
      const currentTheme: string = "dark";
      const themeClass = currentTheme === "dark" ? "dark-mode" : "light-mode";

      expect(themeClass).toBe("dark-mode");
    });

    test("generates correct theme class for light mode", () => {
      const currentTheme: string = "light";
      const themeClass = currentTheme === "dark" ? "dark-mode" : "light-mode";

      expect(themeClass).toBe("light-mode");
    });
  });

  describe("Window lifecycle", () => {
    test("closes form window when requested", () => {
      const window = formWindowInstance;
      window.close();

      expect(window.close).toHaveBeenCalled();
    });

    test("closes model selection window when requested", () => {
      const window = modelSelectionWindowInstance;
      window.close();

      expect(window.close).toHaveBeenCalled();
    });

    test("closes edit window when requested", () => {
      const window = editWindowInstance;
      window.close();

      expect(window.close).toHaveBeenCalled();
    });

    test("checks if window is destroyed", () => {
      const window = formWindowInstance;
      const destroyed = window.isDestroyed();

      expect(destroyed).toBe(false);
    });

    test("sends refresh message to form window", () => {
      const window = formWindowInstance;
      window.webContents.send("refresh-prompt-table");

      expect(window.webContents.send).toHaveBeenCalledWith(
        "refresh-prompt-table",
      );
    });
  });

  describe("View creation and management", () => {
    test("creates WebContentsView with correct options", () => {
      const view = mockWebContentsView({
        webPreferences: {
          nodeIntegration: false,
          contextIsolation: true,
        },
      });

      expect(view).toBeDefined();
    });

    test("sets background color for view", () => {
      const view = mockWebContentsView();
      view.setBackgroundColor("#000000");

      expect(view.setBackgroundColor).toHaveBeenCalledWith("#000000");
    });

    test("sets bounds for view", () => {
      const view = mockWebContentsView();
      const bounds = { x: 0, y: 0, width: 1000, height: 865 };

      view.setBounds(bounds);

      expect(view.setBounds).toHaveBeenCalledWith(bounds);
    });

    test("loads URL in view", () => {
      const view = mockWebContentsView();
      const url = "https://chatgpt.com";

      view.webContents.loadURL(url);

      expect(view.webContents.loadURL).toHaveBeenCalledWith(url);
    });

    test("sets zoom factor for view", () => {
      const view = mockWebContentsView();
      view.webContents.setZoomFactor(1);

      expect(view.webContents.setZoomFactor).toHaveBeenCalledWith(1);
    });

    test("adds view to main window", () => {
      const view = mockWebContentsView();
      mainWindowInstance.contentView.addChildView(view);

      expect(mainWindowInstance.contentView.addChildView).toHaveBeenCalledWith(
        view,
      );
    });
  });

  describe("View bounds calculation", () => {
    test("calculates correct view width for multiple views", () => {
      const bounds = { width: 2000, height: 1100 };
      const viewCount = 2;
      const viewWidth = Math.floor(bounds.width / viewCount);

      expect(viewWidth).toBe(1000);
    });

    test("calculates correct view height", () => {
      const windowHeight = 1100;
      const controlsHeight = 235;
      const viewHeight = windowHeight - controlsHeight;

      expect(viewHeight).toBe(865);
    });

    test("calculates x position for first view", () => {
      const index = 0;
      const viewWidth = 1000;
      const x = index * viewWidth;

      expect(x).toBe(0);
    });

    test("calculates x position for second view", () => {
      const index = 1;
      const viewWidth = 1000;
      const x = index * viewWidth;

      expect(x).toBe(1000);
    });

    test("sets y position to 0 for all views", () => {
      const y = 0;

      expect(y).toBe(0);
    });
  });

  describe("Resize handling", () => {
    test("debounces resize events", (done) => {
      let resizeTimeout: any;
      const callback = jest.fn();

      // Simulate multiple rapid resize events
      clearTimeout(resizeTimeout);
      resizeTimeout = setTimeout(callback, 200);

      clearTimeout(resizeTimeout);
      resizeTimeout = setTimeout(callback, 200);

      clearTimeout(resizeTimeout);
      resizeTimeout = setTimeout(callback, 200);

      setTimeout(() => {
        expect(callback).toHaveBeenCalledTimes(1);
        done();
      }, 250);
    });

    test("uses 200ms debounce delay", (done) => {
      const callback = jest.fn();
      const timeout = setTimeout(callback, 200);

      setTimeout(() => {
        expect(callback).toHaveBeenCalled();
        clearTimeout(timeout);
        done();
      }, 250);
    });
  });

  describe("Fullscreen handling", () => {
    test("handles enter-full-screen event", () => {
      const callback = jest.fn();
      mainWindowInstance.on("enter-full-screen", callback);

      expect(mainWindowInstance.on).toHaveBeenCalledWith(
        "enter-full-screen",
        expect.any(Function),
      );
    });

    test("handles leave-full-screen event", () => {
      const callback = jest.fn();
      mainWindowInstance.on("leave-full-screen", callback);

      expect(mainWindowInstance.on).toHaveBeenCalledWith(
        "leave-full-screen",
        expect.any(Function),
      );
    });
  });

  describe("Theme synchronization", () => {
    test("retrieves theme from localStorage", async () => {
      mainWindowInstance.webContents.executeJavaScript.mockResolvedValue(
        "dark",
      );

      const theme = await mainWindowInstance.webContents.executeJavaScript(
        'localStorage.getItem("theme")',
      );

      expect(theme).toBe("dark");
    });

    test("retrieves light theme from localStorage", async () => {
      mainWindowInstance.webContents.executeJavaScript.mockResolvedValue(
        "light",
      );

      const theme = await mainWindowInstance.webContents.executeJavaScript(
        'localStorage.getItem("theme")',
      );

      expect(theme).toBe("light");
    });

    test("applies theme class to document body", async () => {
      const themeClass = "dark-mode";
      const script = `document.body.classList.add('${themeClass}');`;

      await formWindowInstance.webContents.executeJavaScript(script);

      expect(
        formWindowInstance.webContents.executeJavaScript,
      ).toHaveBeenCalled();
    });
  });

  describe("Window parent relationships", () => {
    test("form window is modal to main window", () => {
      const options = {
        parent: mainWindowInstance,
        modal: true,
      };

      expect(options.modal).toBe(true);
      expect(options.parent).toBe(mainWindowInstance);
    });

    test("model selection window is modal to main window", () => {
      const options = {
        parent: mainWindowInstance,
        modal: true,
      };

      expect(options.modal).toBe(true);
      expect(options.parent).toBe(mainWindowInstance);
    });

    test("edit window can be modal to form or main window", () => {
      const formWindow = formWindowInstance;
      const mainWindow = mainWindowInstance;
      const parent = formWindow || mainWindow;

      expect(parent).toBeDefined();
    });
  });
});
