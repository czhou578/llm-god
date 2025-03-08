const { ipcRenderer } = require("electron");
const {
  openClaudeMessage,
  closeClaudeMessage,
  openPerplexityMessage,
  closePerplexityMessage,
  logToWebPage,
} = require("../renderer");

jest.mock("electron", () => ({
  ipcRenderer: {
    send: jest.fn(),
  },
}));

describe("Renderer Functions", () => {
  let textArea;
  let openClaude;
  let openPerplexity;
  let openGrok;
  let openDeepSeek;

  beforeEach(() => {
    // Mock DOM elements
    textArea = document.createElement("textarea");
    textArea.id = "prompt-input";
    document.body.appendChild(textArea);

    openClaude = document.createElement("button");
    openClaude.id = "showClaude";
    document.body.appendChild(openClaude);

    openPerplexity = document.createElement("button");
    openPerplexity.id = "showPerplexity";
    document.body.appendChild(openPerplexity);

    openGrok = document.createElement("button");
    openGrok.id = "showGrok";
    document.body.appendChild(openGrok);

    openDeepSeek = document.createElement("button");
    openDeepSeek.id = "showDeepSeek";
    document.body.appendChild(openDeepSeek);
  });

  afterEach(() => {
    // Clean up DOM elements
    document.body.innerHTML = "";
  });

  test("openClaudeMessage sends correct IPC message", () => {
    openClaudeMessage("open claude now");
    expect(ipcRenderer.send).toHaveBeenCalledWith(
      "open-claude",
      "open claude now",
    );
  });

  test("closeClaudeMessage sends correct IPC message", () => {
    closeClaudeMessage("close claude now");
    expect(ipcRenderer.send).toHaveBeenCalledWith(
      "close-claude",
      "close claude now",
    );
  });

  test("openPerplexityMessage sends correct IPC message", () => {
    openPerplexityMessage("open perplexity now");
    expect(ipcRenderer.send).toHaveBeenCalledWith(
      "open-perplexity",
      "open perplexity now",
    );
  });

  test("closePerplexityMessage sends correct IPC message", () => {
    closePerplexityMessage("close perplexity now");
    expect(ipcRenderer.send).toHaveBeenCalledWith(
      "close-perplexity",
      "close perplexity now",
    );
  });

  test("logToWebPage sends correct IPC message", () => {
    logToWebPage("test message");
    expect(ipcRenderer.send).toHaveBeenCalledWith(
      "enter-prompt",
      "test message",
    );
  });

  // Add more tests for event listeners if needed
});
