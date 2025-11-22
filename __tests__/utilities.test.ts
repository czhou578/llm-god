import {
  addBrowserView,
  removeBrowserView,
  stripEmojis,
  openNewChatInView,
  injectPromptIntoView,
  sendPromptInView,
} from "../src/utilities";
import { BrowserWindow, WebContentsView } from "electron";

// Mock Electron modules
jest.mock("electron", () => ({
  BrowserWindow: jest.fn(),
  WebContentsView: jest.fn(),
}));

describe("Utilities Functions", () => {
  describe("stripEmojis", () => {
    test("removes emoticons", () => {
      const text = "Hello 😀😃😄 World";
      expect(stripEmojis(text)).toBe("Hello  World");
    });

    test("removes misc symbols and pictographs", () => {
      const text = "Weather ☀️🌙⛅ symbols";
      expect(stripEmojis(text)).toBe("Weather  symbols");
    });

    test("removes transport and map symbols", () => {
      const text = "Transport 🚗🚕🚙 symbols";
      expect(stripEmojis(text)).toBe("Transport  symbols");
    });

    test("removes flags", () => {
      const text = "Flags 🇺🇸🇬🇧🇫🇷 here";
      expect(stripEmojis(text)).toBe("Flags  here");
    });

    test("removes dingbats", () => {
      const text = "Dingbats ✂️✏️✒️ here";
      expect(stripEmojis(text)).toBe("Dingbats  here");
    });

    test("removes supplemental symbols", () => {
      const text = "Symbols 🤣🤔🤗 here";
      expect(stripEmojis(text)).toBe("Symbols  here");
    });

    test("removes variation selectors", () => {
      const text = "Text with\uFE0F variations";
      expect(stripEmojis(text)).toBe("Text with variations");
    });

    test("removes zero width joiner", () => {
      const text = "Text\u200Dwith\u200Dzwj";
      expect(stripEmojis(text)).toBe("Textwithzwj");
    });

    test("trims whitespace after emoji removal", () => {
      const text = "  😀 Test 😃  ";
      expect(stripEmojis(text)).toBe("Test");
    });

    test("handles text without emojis", () => {
      const text = "Plain text without emojis";
      expect(stripEmojis(text)).toBe("Plain text without emojis");
    });

    test("handles empty string", () => {
      expect(stripEmojis("")).toBe("");
    });

    test("handles string with only emojis", () => {
      const text = "😀😃😄😁";
      expect(stripEmojis(text)).toBe("");
    });

    test("preserves regular text with special characters", () => {
      const text = "Test@#$%^&*()_+-=[]{}|;':\",./<>?";
      expect(stripEmojis(text)).toBe("Test@#$%^&*()_+-=[]{}|;':\",./<>?");
    });

    test("handles mixed content", () => {
      const text = "Hello 👋 World 🌍! How are you? 😊";
      expect(stripEmojis(text)).toBe("Hello  World ! How are you?");
    });

    test("handles multi-line text with emojis", () => {
      const text = "Line 1 😀\nLine 2 😃\nLine 3 😄";
      expect(stripEmojis(text)).toBe("Line 1 \nLine 2 \nLine 3");
    });
  });

  describe("addBrowserView", () => {
    let mockMainWindow: any;
    let mockContentView: any;
    let mockWebContents: any;
    let mockView: any;
    let websites: string[];
    let views: any[];

    beforeEach(() => {
      websites = [];
      views = [];

      mockWebContents = {
        setZoomFactor: jest.fn(),
        loadURL: jest.fn(),
        executeJavaScript: jest.fn(),
      };

      mockView = {
        setBackgroundColor: jest.fn(),
        setBounds: jest.fn(),
        webContents: mockWebContents,
        id: undefined,
      };

      mockContentView = {
        addChildView: jest.fn(),
        removeChildView: jest.fn(),
      };

      mockMainWindow = {
        contentView: mockContentView,
        getBounds: jest.fn(() => ({ width: 1200, height: 800 })),
      };

      (WebContentsView as any).mockImplementation(() => mockView);
    });

    test("creates a new WebContentsView with correct preferences", () => {
      const url = "https://chatgpt.com";

      addBrowserView(mockMainWindow, url, websites, views);

      expect(WebContentsView).toHaveBeenCalledWith({
        webPreferences: {
          nodeIntegration: false,
          contextIsolation: true,
          devTools: true,
        },
      });
    });

    test("merges custom web preferences", () => {
      const url = "https://chatgpt.com";
      const customPrefs = { preload: "/path/to/preload.js" };

      addBrowserView(mockMainWindow, url, websites, views, customPrefs);

      expect(WebContentsView).toHaveBeenCalledWith({
        webPreferences: {
          nodeIntegration: false,
          contextIsolation: true,
          devTools: true,
          preload: "/path/to/preload.js",
        },
      });
    });

    test("sets background color to black", () => {
      const url = "https://chatgpt.com";

      addBrowserView(mockMainWindow, url, websites, views);

      expect(mockView.setBackgroundColor).toHaveBeenCalledWith("#000000");
    });

    test("assigns URL as view id", () => {
      const url = "https://chatgpt.com";

      const view = addBrowserView(mockMainWindow, url, websites, views);

      expect(view.id).toBe(url);
    });

    test("adds view to main window", () => {
      const url = "https://chatgpt.com";

      addBrowserView(mockMainWindow, url, websites, views);

      expect(mockContentView.addChildView).toHaveBeenCalledWith(mockView);
    });

    test("adds URL to websites array", () => {
      const url = "https://chatgpt.com";

      addBrowserView(mockMainWindow, url, websites, views);

      expect(websites).toContain(url);
      expect(websites.length).toBe(1);
    });

    test("sets bounds for single view", () => {
      const url = "https://chatgpt.com";

      addBrowserView(mockMainWindow, url, websites, views);

      expect(mockView.setBounds).toHaveBeenCalledWith({
        x: 0,
        y: 0,
        width: 1200,
        height: 565, // 800 - 235
      });
    });

    test("redistributes bounds for multiple views", () => {
      const url1 = "https://chatgpt.com";
      const url2 = "https://gemini.google.com";

      const view1 = addBrowserView(mockMainWindow, url1, websites, views);
      const view2 = addBrowserView(mockMainWindow, url2, websites, views);

      // Second view should be positioned at x: 600 (half of 1200)
      expect(view2.setBounds).toHaveBeenCalledWith({
        x: 600,
        y: 0,
        width: 600,
        height: 565,
      });
    });

    test("sets zoom factor to 1.5", () => {
      const url = "https://chatgpt.com";

      addBrowserView(mockMainWindow, url, websites, views);

      expect(mockWebContents.setZoomFactor).toHaveBeenCalledWith(1.5);
    });

    test("loads URL in view", () => {
      const url = "https://chatgpt.com";

      addBrowserView(mockMainWindow, url, websites, views);

      expect(mockWebContents.loadURL).toHaveBeenCalledWith(url);
    });

    test("adds view to views array", () => {
      const url = "https://chatgpt.com";

      addBrowserView(mockMainWindow, url, websites, views);

      expect(views.length).toBe(1);
      expect(views[0]).toBe(mockView);
    });

    test("returns the created view", () => {
      const url = "https://chatgpt.com";

      const result = addBrowserView(mockMainWindow, url, websites, views);

      expect(result).toBe(mockView);
    });

    test("handles three views with correct bounds", () => {
      mockMainWindow.getBounds.mockReturnValue({ width: 1500, height: 900 });

      addBrowserView(mockMainWindow, "https://chatgpt.com", websites, views);
      addBrowserView(mockMainWindow, "https://gemini.google.com", websites, views);
      const view3 = addBrowserView(mockMainWindow, "https://claude.ai", websites, views);

      // Each view should be 500px wide (1500 / 3)
      expect(view3.setBounds).toHaveBeenCalledWith({
        x: 1000, // 2 * 500
        y: 0,
        width: 500,
        height: 665, // 900 - 235
      });
    });
  });

  describe("removeBrowserView", () => {
    let mockMainWindow: any;
    let mockContentView: any;
    let websites: string[];
    let views: any[];
    let view1: any;
    let view2: any;
    let view3: any;

    beforeEach(() => {
      websites = ["https://chatgpt.com", "https://gemini.google.com", "https://claude.ai"];
      
      view1 = {
        id: "https://chatgpt.com",
        setBounds: jest.fn(),
      };
      view2 = {
        id: "https://gemini.google.com",
        setBounds: jest.fn(),
      };
      view3 = {
        id: "https://claude.ai",
        setBounds: jest.fn(),
      };

      views = [view1, view2, view3];

      mockContentView = {
        removeChildView: jest.fn(),
      };

      mockMainWindow = {
        contentView: mockContentView,
        getBounds: jest.fn(() => ({ width: 1200, height: 800 })),
      };
    });

    test("removes view from main window", () => {
      removeBrowserView(mockMainWindow, view2, websites, views);

      expect(mockContentView.removeChildView).toHaveBeenCalledWith(view2);
    });

    test("removes URL from websites array", () => {
      removeBrowserView(mockMainWindow, view2, websites, views);

      expect(websites).not.toContain("https://gemini.google.com");
      expect(websites.length).toBe(2);
    });

    test("removes view from views array", () => {
      removeBrowserView(mockMainWindow, view2, websites, views);

      expect(views).not.toContain(view2);
      expect(views.length).toBe(2);
    });

    test("redistributes bounds for remaining views", () => {
      removeBrowserView(mockMainWindow, view2, websites, views);

      // Two views remaining, each should be 600px wide
      expect(view1.setBounds).toHaveBeenCalledWith({
        x: 0,
        y: 0,
        width: 600,
        height: 565,
      });
      expect(view3.setBounds).toHaveBeenCalledWith({
        x: 600,
        y: 0,
        width: 600,
        height: 565,
      });
    });

    test("does nothing if view not found in array", () => {
      const unknownView: any = { id: "https://unknown.com", setBounds: jest.fn() };

      removeBrowserView(mockMainWindow, unknownView, websites, views);

      expect(mockContentView.removeChildView).not.toHaveBeenCalled();
      expect(views.length).toBe(3);
      expect(websites.length).toBe(3);
    });

    test("handles removing last remaining view", () => {
      const singleView: any = { id: "https://chatgpt.com", setBounds: jest.fn() };
      const singleWebsites = ["https://chatgpt.com"];
      const singleViews = [singleView];

      removeBrowserView(mockMainWindow, singleView, singleWebsites, singleViews);

      expect(mockContentView.removeChildView).toHaveBeenCalledWith(singleView);
      expect(singleViews.length).toBe(0);
      expect(singleWebsites.length).toBe(0);
    });

    test("does not redistribute bounds when no views remain", () => {
      const singleView: any = { id: "https://chatgpt.com", setBounds: jest.fn() };
      const singleWebsites = ["https://chatgpt.com"];
      const singleViews = [singleView];

      removeBrowserView(mockMainWindow, singleView, singleWebsites, singleViews);

      expect(singleView.setBounds).not.toHaveBeenCalled();
    });

    test("handles view with id not in websites array", () => {
      const viewWithDifferentId: any = {
        id: "https://different.com",
        setBounds: jest.fn(),
      };
      views[1] = viewWithDifferentId;

      removeBrowserView(mockMainWindow, viewWithDifferentId, websites, views);

      expect(mockContentView.removeChildView).toHaveBeenCalledWith(viewWithDifferentId);
      expect(views.length).toBe(2);
      // Original websites array should be unchanged for this URL
      expect(websites.length).toBe(3);
    });
  });

  describe("openNewChatInView", () => {
    let mockView: any;

    beforeEach(() => {
      mockView = {
        id: "",
        webContents: {
          executeJavaScript: jest.fn().mockResolvedValue(undefined),
        },
      };
    });

    test("executes JavaScript for ChatGPT", () => {
      mockView.id = "https://chatgpt.com";

      openNewChatInView(mockView);

      expect(mockView.webContents.executeJavaScript).toHaveBeenCalled();
      const jsCode = mockView.webContents.executeJavaScript.mock.calls[0][0];
      expect(jsCode).toContain('a[aria-label="New chat"]');
    });

    test("executes JavaScript for Gemini", () => {
      mockView.id = "https://gemini.google.com";

      openNewChatInView(mockView);

      expect(mockView.webContents.executeJavaScript).toHaveBeenCalled();
      const jsCode = mockView.webContents.executeJavaScript.mock.calls[0][0];
      expect(jsCode).toContain('nowy czat');
    });

    test("executes JavaScript for Bard (legacy)", () => {
      mockView.id = "https://bard.google.com";

      openNewChatInView(mockView);

      expect(mockView.webContents.executeJavaScript).toHaveBeenCalled();
      const jsCode = mockView.webContents.executeJavaScript.mock.calls[0][0];
      expect(jsCode).toContain('nowy czat');
    });

    test("executes JavaScript for Claude", () => {
      mockView.id = "https://claude.ai";

      openNewChatInView(mockView);

      expect(mockView.webContents.executeJavaScript).toHaveBeenCalled();
      const jsCode = mockView.webContents.executeJavaScript.mock.calls[0][0];
      expect(jsCode).toContain('New chat');
    });

    test("executes JavaScript for Grok", () => {
      mockView.id = "https://grok.com";

      openNewChatInView(mockView);

      expect(mockView.webContents.executeJavaScript).toHaveBeenCalled();
      const jsCode = mockView.webContents.executeJavaScript.mock.calls[0][0];
      expect(jsCode).toContain('strona główna');
    });

    test("executes JavaScript for DeepSeek", () => {
      mockView.id = "https://chat.deepseek.com";

      openNewChatInView(mockView);

      expect(mockView.webContents.executeJavaScript).toHaveBeenCalled();
      const jsCode = mockView.webContents.executeJavaScript.mock.calls[0][0];
      expect(jsCode).toContain('ds-icon-button');
    });

    test("executes JavaScript for Copilot", () => {
      mockView.id = "https://copilot.microsoft.com";

      openNewChatInView(mockView);

      expect(mockView.webContents.executeJavaScript).toHaveBeenCalled();
      const jsCode = mockView.webContents.executeJavaScript.mock.calls[0][0];
      expect(jsCode).toContain('Start new chat');
    });

    test("does not execute for unknown platform", () => {
      mockView.id = "https://unknown.com";

      openNewChatInView(mockView);

      expect(mockView.webContents.executeJavaScript).not.toHaveBeenCalled();
    });

    test("does not execute when view has no id", () => {
      mockView.id = undefined;

      openNewChatInView(mockView);

      expect(mockView.webContents.executeJavaScript).not.toHaveBeenCalled();
    });
  });

  describe("injectPromptIntoView", () => {
    let mockView: any;

    beforeEach(() => {
      mockView = {
        id: "",
        webContents: {
          executeJavaScript: jest.fn().mockResolvedValue(undefined),
        },
      };
    });

    test("strips emojis before injection", () => {
      mockView.id = "https://chatgpt.com";
      const prompt = "Hello 😀 World";

      injectPromptIntoView(mockView, prompt);

      const jsCode = mockView.webContents.executeJavaScript.mock.calls[0][0];
      expect(jsCode).toContain("Hello  World");
      expect(jsCode).not.toContain("😀");
    });

    test("escapes special characters for ChatGPT", () => {
      mockView.id = "https://chatgpt.com";
      const prompt = "Test `backtick` and $dollar";

      injectPromptIntoView(mockView, prompt);

      const jsCode = mockView.webContents.executeJavaScript.mock.calls[0][0];
      expect(jsCode).toContain("\\`");
      expect(jsCode).toContain("\\$");
    });

    test("injects prompt into ChatGPT", () => {
      mockView.id = "https://chatgpt.com";
      const prompt = "Test prompt";

      injectPromptIntoView(mockView, prompt);

      expect(mockView.webContents.executeJavaScript).toHaveBeenCalled();
      const jsCode = mockView.webContents.executeJavaScript.mock.calls[0][0];
      expect(jsCode).toContain("#prompt-textarea > p");
      expect(jsCode).toContain("Test prompt");
    });

    test("injects prompt into Gemini", () => {
      mockView.id = "https://gemini.google.com";
      const prompt = "Test prompt";

      injectPromptIntoView(mockView, prompt);

      expect(mockView.webContents.executeJavaScript).toHaveBeenCalled();
      const jsCode = mockView.webContents.executeJavaScript.mock.calls[0][0];
      expect(jsCode).toContain(".ql-editor.textarea");
      expect(jsCode).toContain("Test prompt");
    });

    test("injects prompt into Bard (legacy)", () => {
      mockView.id = "https://bard.google.com";
      const prompt = "Test prompt";

      injectPromptIntoView(mockView, prompt);

      expect(mockView.webContents.executeJavaScript).toHaveBeenCalled();
      const jsCode = mockView.webContents.executeJavaScript.mock.calls[0][0];
      expect(jsCode).toContain(".ql-editor.textarea");
    });

    test("injects prompt into Claude", () => {
      mockView.id = "https://claude.ai";
      const prompt = "Test prompt";

      injectPromptIntoView(mockView, prompt);

      expect(mockView.webContents.executeJavaScript).toHaveBeenCalled();
      const jsCode = mockView.webContents.executeJavaScript.mock.calls[0][0];
      expect(jsCode).toContain("div.ProseMirror");
      expect(jsCode).toContain("Test prompt");
    });

    test("injects prompt into Grok", () => {
      mockView.id = "https://grok.com";
      const prompt = "Test prompt";

      injectPromptIntoView(mockView, prompt);

      expect(mockView.webContents.executeJavaScript).toHaveBeenCalled();
      const jsCode = mockView.webContents.executeJavaScript.mock.calls[0][0];
      expect(jsCode).toContain("textarea");
      expect(jsCode).toContain("Test prompt");
    });

    test("injects prompt into DeepSeek", () => {
      mockView.id = "https://chat.deepseek.com";
      const prompt = "Test prompt";

      injectPromptIntoView(mockView, prompt);

      expect(mockView.webContents.executeJavaScript).toHaveBeenCalled();
      const jsCode = mockView.webContents.executeJavaScript.mock.calls[0][0];
      expect(jsCode).toContain("textarea");
      expect(jsCode).toContain("Test prompt");
    });

    test("injects prompt into Copilot", () => {
      mockView.id = "https://copilot.microsoft.com";
      const prompt = "Test prompt";

      injectPromptIntoView(mockView, prompt);

      expect(mockView.webContents.executeJavaScript).toHaveBeenCalled();
      const jsCode = mockView.webContents.executeJavaScript.mock.calls[0][0];
      expect(jsCode).toContain("Ask me anything...");
      expect(jsCode).toContain("Test prompt");
    });

    test("handles newlines in prompt", () => {
      mockView.id = "https://chatgpt.com";
      const prompt = "Line 1\nLine 2\nLine 3";

      injectPromptIntoView(mockView, prompt);

      const jsCode = mockView.webContents.executeJavaScript.mock.calls[0][0];
      expect(jsCode).toContain("\\n");
    });

    test("handles backslashes in prompt", () => {
      mockView.id = "https://chatgpt.com";
      const prompt = "Path: C:\\Users\\test";

      injectPromptIntoView(mockView, prompt);

      const jsCode = mockView.webContents.executeJavaScript.mock.calls[0][0];
      expect(jsCode).toContain("\\\\");
    });

    test("handles tabs in prompt", () => {
      mockView.id = "https://chatgpt.com";
      const prompt = "Column1\tColumn2\tColumn3";

      injectPromptIntoView(mockView, prompt);

      const jsCode = mockView.webContents.executeJavaScript.mock.calls[0][0];
      expect(jsCode).toContain("\\t");
    });

    test("does not execute for unknown platform", () => {
      mockView.id = "https://unknown.com";

      injectPromptIntoView(mockView, "Test");

      expect(mockView.webContents.executeJavaScript).not.toHaveBeenCalled();
    });
  });

  describe("sendPromptInView", () => {
    let mockView: any;

    beforeEach(() => {
      mockView = {
        id: "",
        webContents: {
          executeJavaScript: jest.fn().mockResolvedValue(undefined),
        },
      };
    });

    test("sends prompt for ChatGPT", () => {
      mockView.id = "https://chatgpt.com";

      sendPromptInView(mockView);

      expect(mockView.webContents.executeJavaScript).toHaveBeenCalled();
      const jsCode = mockView.webContents.executeJavaScript.mock.calls[0][0];
      expect(jsCode).toContain('button[data-testid="send-button"]');
    });

    test("sends prompt for Gemini", () => {
      mockView.id = "https://gemini.google.com";

      sendPromptInView(mockView);

      expect(mockView.webContents.executeJavaScript).toHaveBeenCalled();
      const jsCode = mockView.webContents.executeJavaScript.mock.calls[0][0];
      expect(jsCode).toContain('Send message');
    });

    test("sends prompt for Bard (legacy)", () => {
      mockView.id = "https://bard.google.com";

      sendPromptInView(mockView);

      expect(mockView.webContents.executeJavaScript).toHaveBeenCalled();
      const jsCode = mockView.webContents.executeJavaScript.mock.calls[0][0];
      expect(jsCode).toContain('Send message');
    });

    test("sends prompt for Claude", () => {
      mockView.id = "https://claude.ai";

      sendPromptInView(mockView);

      expect(mockView.webContents.executeJavaScript).toHaveBeenCalled();
      const jsCode = mockView.webContents.executeJavaScript.mock.calls[0][0];
      expect(jsCode).toContain('Send message');
    });

    test("sends prompt for Grok", () => {
      mockView.id = "https://grok.com";

      sendPromptInView(mockView);

      expect(mockView.webContents.executeJavaScript).toHaveBeenCalled();
      const jsCode = mockView.webContents.executeJavaScript.mock.calls[0][0];
      expect(jsCode).toContain('Submit');
    });

    test("sends prompt for DeepSeek", () => {
      mockView.id = "https://chat.deepseek.com";

      sendPromptInView(mockView);

      expect(mockView.webContents.executeJavaScript).toHaveBeenCalled();
      const jsCode = mockView.webContents.executeJavaScript.mock.calls[0][0];
      expect(jsCode).toContain('ds-icon-button');
    });

    test("sends prompt for Copilot", () => {
      mockView.id = "https://copilot.microsoft.com";

      sendPromptInView(mockView);

      expect(mockView.webContents.executeJavaScript).toHaveBeenCalled();
      const jsCode = mockView.webContents.executeJavaScript.mock.calls[0][0];
      expect(jsCode).toContain('submit');
    });

    test("does not execute for unknown platform", () => {
      mockView.id = "https://unknown.com";

      sendPromptInView(mockView);

      expect(mockView.webContents.executeJavaScript).not.toHaveBeenCalled();
    });

    test("does not execute when view has no id", () => {
      mockView.id = undefined;

      sendPromptInView(mockView);

      expect(mockView.webContents.executeJavaScript).not.toHaveBeenCalled();
    });
  });
});
