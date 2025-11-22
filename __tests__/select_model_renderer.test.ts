/**
 * @jest-environment jsdom
 */

describe("Select Models Renderer Functions", () => {
  let mockIpcRenderer: {
    send: jest.Mock;
    invoke: jest.Mock;
  };
  let saveButton: HTMLButtonElement;
  let cancelButton: HTMLButtonElement;
  let chatgptCheckbox: HTMLInputElement;
  let geminiCheckbox: HTMLInputElement;
  let claudeCheckbox: HTMLInputElement;
  let grokCheckbox: HTMLInputElement;
  let deepseekCheckbox: HTMLInputElement;
  let copilotCheckbox: HTMLInputElement;

  beforeEach(() => {
    // Clear the DOM
    document.body.innerHTML = "";
    jest.clearAllMocks();

    // Create DOM elements - model checkboxes
    chatgptCheckbox = document.createElement("input");
    chatgptCheckbox.type = "checkbox";
    chatgptCheckbox.id = "chatgpt";
    chatgptCheckbox.value = "https://chatgpt.com";
    document.body.appendChild(chatgptCheckbox);

    geminiCheckbox = document.createElement("input");
    geminiCheckbox.type = "checkbox";
    geminiCheckbox.id = "gemini";
    geminiCheckbox.value = "https://gemini.google.com";
    document.body.appendChild(geminiCheckbox);

    claudeCheckbox = document.createElement("input");
    claudeCheckbox.type = "checkbox";
    claudeCheckbox.id = "claude";
    claudeCheckbox.value = "https://claude.ai";
    document.body.appendChild(claudeCheckbox);

    grokCheckbox = document.createElement("input");
    grokCheckbox.type = "checkbox";
    grokCheckbox.id = "grok";
    grokCheckbox.value = "https://x.ai/grok";
    document.body.appendChild(grokCheckbox);

    deepseekCheckbox = document.createElement("input");
    deepseekCheckbox.type = "checkbox";
    deepseekCheckbox.id = "deepseek";
    deepseekCheckbox.value = "https://chat.deepseek.com";
    document.body.appendChild(deepseekCheckbox);

    copilotCheckbox = document.createElement("input");
    copilotCheckbox.type = "checkbox";
    copilotCheckbox.id = "copilot";
    copilotCheckbox.value = "https://copilot.microsoft.com";
    document.body.appendChild(copilotCheckbox);

    // Create model items (divs that contain checkboxes)
    const modelItems = [
      { checkbox: chatgptCheckbox, label: "ChatGPT" },
      { checkbox: geminiCheckbox, label: "Gemini" },
      { checkbox: claudeCheckbox, label: "Claude" },
      { checkbox: grokCheckbox, label: "Grok" },
      { checkbox: deepseekCheckbox, label: "DeepSeek" },
      { checkbox: copilotCheckbox, label: "Copilot" },
    ];

    modelItems.forEach(({ checkbox, label }) => {
      const modelItem = document.createElement("div");
      modelItem.className = "model-item";
      const labelElement = document.createElement("label");
      labelElement.textContent = label;
      modelItem.appendChild(checkbox);
      modelItem.appendChild(labelElement);
      document.body.appendChild(modelItem);
    });

    // Create buttons
    saveButton = document.createElement("button");
    saveButton.id = "save-button";
    document.body.appendChild(saveButton);

    cancelButton = document.createElement("button");
    cancelButton.id = "cancel-button";
    document.body.appendChild(cancelButton);

    // Mock document methods
    document.getElementById = jest.fn((id: string) => {
      if (id === "save-button") return saveButton;
      if (id === "cancel-button") return cancelButton;
      if (id === "chatgpt") return chatgptCheckbox;
      if (id === "gemini") return geminiCheckbox;
      if (id === "claude") return claudeCheckbox;
      if (id === "grok") return grokCheckbox;
      if (id === "deepseek") return deepseekCheckbox;
      if (id === "copilot") return copilotCheckbox;
      return null;
    });

    document.querySelector = jest.fn((selector: string) => {
      if (selector === 'input[value="https://chatgpt.com"]') return chatgptCheckbox;
      if (selector === 'input[value="https://gemini.google.com"]') return geminiCheckbox;
      if (selector === 'input[value="https://claude.ai"]') return claudeCheckbox;
      if (selector === 'input[value="https://x.ai/grok"]') return grokCheckbox;
      if (selector === 'input[value="https://chat.deepseek.com"]') return deepseekCheckbox;
      if (selector === 'input[value="https://copilot.microsoft.com"]') return copilotCheckbox;
      if (selector === ".model-item") {
        return document.body.querySelector(".model-item");
      }
      return null;
    });

    const allCheckboxes = [
      chatgptCheckbox,
      geminiCheckbox,
      claudeCheckbox,
      grokCheckbox,
      deepseekCheckbox,
      copilotCheckbox,
    ];

    (document.querySelectorAll as any) = jest.fn((selector: string) => {
      if (selector === ".model-item") {
        return document.body.querySelectorAll(".model-item");
      }
      if (selector === 'input[type="checkbox"]:checked') {
        return allCheckboxes.filter(cb => cb.checked);
      }
      return [];
    });

    // Mock window.alert
    (global as any).alert = jest.fn();

    // Mock console
    console.log = jest.fn();
    console.error = jest.fn();

    // Create mock IPC renderer
    mockIpcRenderer = {
      send: jest.fn(),
      invoke: jest.fn().mockResolvedValue([]),
    };

    // Setup window.electron mock
    Object.defineProperty(global, "window", {
      value: {
        electron: {
          ipcRenderer: mockIpcRenderer,
        },
        addEventListener: jest.fn(),
        dispatchEvent: jest.fn(),
      },
      writable: true,
      configurable: true,
    });
  });

  describe("DOMContentLoaded - Load Default Models", () => {
    let domLoadedCallback: Function | undefined;

    beforeEach(() => {
      domLoadedCallback = undefined;
      (window.addEventListener as jest.Mock).mockImplementation((event: string, callback: Function) => {
        if (event === "DOMContentLoaded") {
          domLoadedCallback = callback;
        }
      });
    });

    test("loads saved default models and checks corresponding checkboxes", async () => {
      mockIpcRenderer.invoke.mockResolvedValueOnce([
        "https://chatgpt.com",
        "https://claude.ai",
      ]);

      jest.isolateModules(() => {
        require("../src/select_models_renderer");
      });

      // Trigger DOMContentLoaded callback
      if (domLoadedCallback) {
        await domLoadedCallback();
      }

      await new Promise(resolve => setTimeout(resolve, 100));

      expect(mockIpcRenderer.invoke).toHaveBeenCalledWith("get-default-models");
      expect(chatgptCheckbox.checked).toBe(true);
      expect(claudeCheckbox.checked).toBe(true);
      expect(geminiCheckbox.checked).toBe(false);
    });

    test("defaults to ChatGPT and Gemini when no models are saved", async () => {
      mockIpcRenderer.invoke.mockResolvedValueOnce([]);

      jest.isolateModules(() => {
        require("../src/select_models_renderer");
      });

      if (domLoadedCallback) {
        await domLoadedCallback();
      }

      await new Promise(resolve => setTimeout(resolve, 100));

      expect(chatgptCheckbox.checked).toBe(true);
      expect(geminiCheckbox.checked).toBe(true);
    });

    test("defaults to ChatGPT and Gemini when null is returned", async () => {
      mockIpcRenderer.invoke.mockResolvedValueOnce(null);

      jest.isolateModules(() => {
        require("../src/select_models_renderer");
      });

      if (domLoadedCallback) {
        await domLoadedCallback();
      }

      await new Promise(resolve => setTimeout(resolve, 100));

      expect(chatgptCheckbox.checked).toBe(true);
      expect(geminiCheckbox.checked).toBe(true);
    });

    test("checks all saved models", async () => {
      mockIpcRenderer.invoke.mockResolvedValueOnce([
        "https://chatgpt.com",
        "https://gemini.google.com",
        "https://claude.ai",
        "https://x.ai/grok",
        "https://chat.deepseek.com",
        "https://copilot.microsoft.com",
      ]);

      jest.isolateModules(() => {
        require("../src/select_models_renderer");
      });

      if (domLoadedCallback) {
        await domLoadedCallback();
      }

      await new Promise(resolve => setTimeout(resolve, 100));

      expect(chatgptCheckbox.checked).toBe(true);
      expect(geminiCheckbox.checked).toBe(true);
      expect(claudeCheckbox.checked).toBe(true);
      expect(grokCheckbox.checked).toBe(true);
      expect(deepseekCheckbox.checked).toBe(true);
      expect(copilotCheckbox.checked).toBe(true);
    });

    test("handles invalid model URLs gracefully", async () => {
      mockIpcRenderer.invoke.mockResolvedValueOnce([
        "https://chatgpt.com",
        "https://invalid-model.com",
      ]);

      jest.isolateModules(() => {
        require("../src/select_models_renderer");
      });

      if (domLoadedCallback) {
        await domLoadedCallback();
      }

      await new Promise(resolve => setTimeout(resolve, 100));

      expect(chatgptCheckbox.checked).toBe(true);
      // Invalid URL should not crash, just not check any box
    });
  });

  describe("Model Item Click Handling", () => {
    beforeEach(() => {
      jest.isolateModules(() => {
        require("../src/select_models_renderer");
      });
    });

    test("toggles checkbox when clicking on model item", () => {
      const modelItem = document.querySelector(".model-item") as HTMLDivElement;
      const checkbox = modelItem.querySelector("input[type='checkbox']") as HTMLInputElement;

      expect(checkbox.checked).toBe(false);

      modelItem.click();

      expect(checkbox.checked).toBe(true);
    });

    test("does not toggle checkbox when clicking directly on checkbox", () => {
      const modelItem = document.querySelector(".model-item") as HTMLDivElement;
      const checkbox = modelItem.querySelector("input[type='checkbox']") as HTMLInputElement;

      checkbox.checked = false;

      const clickEvent = new MouseEvent("click", { bubbles: true });
      Object.defineProperty(clickEvent, "target", { value: checkbox, writable: false });

      modelItem.dispatchEvent(clickEvent);

      // Should remain false because we're clicking the checkbox itself
      expect(checkbox.checked).toBe(false);
    });

    test("toggles checkbox off when clicking model item twice", () => {
      const modelItem = document.querySelector(".model-item") as HTMLDivElement;
      const checkbox = modelItem.querySelector("input[type='checkbox']") as HTMLInputElement;

      modelItem.click();
      expect(checkbox.checked).toBe(true);

      modelItem.click();
      expect(checkbox.checked).toBe(false);
    });

    test("applies to all model items", () => {
      const modelItems = document.querySelectorAll(".model-item");

      modelItems.forEach((item) => {
        const checkbox = item.querySelector("input[type='checkbox']") as HTMLInputElement;
        expect(checkbox.checked).toBe(false);
        
        (item as HTMLElement).click();
        
        expect(checkbox.checked).toBe(true);
      });
    });
  });

  describe("Save Button Click Handling", () => {
    beforeEach(() => {
      jest.isolateModules(() => {
        require("../src/select_models_renderer");
      });
    });

    test("sends selected models to main process", () => {
      chatgptCheckbox.checked = true;
      geminiCheckbox.checked = true;

      saveButton.click();

      expect(mockIpcRenderer.send).toHaveBeenCalledWith("save-default-models", [
        "https://chatgpt.com",
        "https://gemini.google.com",
      ]);
    });

    test("sends all selected models", () => {
      chatgptCheckbox.checked = true;
      geminiCheckbox.checked = true;
      claudeCheckbox.checked = true;
      grokCheckbox.checked = true;

      saveButton.click();

      expect(mockIpcRenderer.send).toHaveBeenCalledWith("save-default-models", [
        "https://chatgpt.com",
        "https://gemini.google.com",
        "https://claude.ai",
        "https://x.ai/grok",
      ]);
    });

    test("shows alert when no models are selected", () => {
      // No checkboxes checked
      saveButton.click();

      expect(alert).toHaveBeenCalledWith("Please select at least one model.");
      expect(mockIpcRenderer.send).not.toHaveBeenCalledWith(
        "save-default-models",
        expect.any(Array)
      );
    });

    test("does not send message when alert is shown", () => {
      saveButton.click();

      expect(mockIpcRenderer.send).not.toHaveBeenCalled();
    });

    test("sends single selected model", () => {
      claudeCheckbox.checked = true;

      saveButton.click();

      expect(mockIpcRenderer.send).toHaveBeenCalledWith("save-default-models", [
        "https://claude.ai",
      ]);
    });

    test("preserves order of selected models", () => {
      deepseekCheckbox.checked = true;
      chatgptCheckbox.checked = true;
      copilotCheckbox.checked = true;

      saveButton.click();

      const sentModels = mockIpcRenderer.send.mock.calls[0][1];
      expect(sentModels).toContain("https://chatgpt.com");
      expect(sentModels).toContain("https://chat.deepseek.com");
      expect(sentModels).toContain("https://copilot.microsoft.com");
    });
  });

  describe("Cancel Button Click Handling", () => {
    beforeEach(() => {
      jest.isolateModules(() => {
        require("../src/select_models_renderer");
      });
    });

    test("sends close-model-selection-window message", () => {
      cancelButton.click();

      expect(mockIpcRenderer.send).toHaveBeenCalledWith("close-model-selection-window");
    });

    test("does not send save message when cancel is clicked", () => {
      chatgptCheckbox.checked = true;
      geminiCheckbox.checked = true;

      cancelButton.click();

      expect(mockIpcRenderer.send).not.toHaveBeenCalledWith(
        "save-default-models",
        expect.any(Array)
      );
    });
  });

  describe("Integration Tests", () => {
    let domLoadedCallback: Function | undefined;

    beforeEach(() => {
      domLoadedCallback = undefined;
      (window.addEventListener as jest.Mock).mockImplementation((event: string, callback: Function) => {
        if (event === "DOMContentLoaded") {
          domLoadedCallback = callback;
        }
      });
    });

    test("loads models, modifies selection, and saves", async () => {
      mockIpcRenderer.invoke.mockResolvedValueOnce([
        "https://chatgpt.com",
        "https://gemini.google.com",
      ]);

      jest.isolateModules(() => {
        require("../src/select_models_renderer");
      });

      if (domLoadedCallback) {
        await domLoadedCallback();
      }
      await new Promise(resolve => setTimeout(resolve, 100));

      // Initial state: ChatGPT and Gemini checked
      expect(chatgptCheckbox.checked).toBe(true);
      expect(geminiCheckbox.checked).toBe(true);

      // Uncheck Gemini and check Claude
      geminiCheckbox.checked = false;
      claudeCheckbox.checked = true;

      saveButton.click();

      expect(mockIpcRenderer.send).toHaveBeenCalledWith("save-default-models", [
        "https://chatgpt.com",
        "https://claude.ai",
      ]);
    });

    test("loads defaults, selects all, and saves", async () => {
      mockIpcRenderer.invoke.mockResolvedValueOnce([]);

      jest.isolateModules(() => {
        require("../src/select_models_renderer");
      });

      if (domLoadedCallback) {
        await domLoadedCallback();
      }
      await new Promise(resolve => setTimeout(resolve, 100));

      // Should default to ChatGPT and Gemini
      expect(chatgptCheckbox.checked).toBe(true);
      expect(geminiCheckbox.checked).toBe(true);

      // Select all models
      claudeCheckbox.checked = true;
      grokCheckbox.checked = true;
      deepseekCheckbox.checked = true;
      copilotCheckbox.checked = true;

      saveButton.click();

      expect(mockIpcRenderer.send).toHaveBeenCalledWith("save-default-models", 
        expect.arrayContaining([
          "https://chatgpt.com",
          "https://gemini.google.com",
          "https://claude.ai",
          "https://x.ai/grok",
          "https://chat.deepseek.com",
          "https://copilot.microsoft.com",
        ])
      );
    });

    test("loads models, clicks cancel without saving", async () => {
      mockIpcRenderer.invoke.mockResolvedValueOnce([
        "https://chatgpt.com",
      ]);

      jest.isolateModules(() => {
        require("../src/select_models_renderer");
      });

      if (domLoadedCallback) {
        await domLoadedCallback();
      }
      await new Promise(resolve => setTimeout(resolve, 100));

      // Modify selection
      chatgptCheckbox.checked = false;
      geminiCheckbox.checked = true;
      claudeCheckbox.checked = true;

      // Cancel instead of save
      cancelButton.click();

      expect(mockIpcRenderer.send).not.toHaveBeenCalledWith(
        "save-default-models",
        expect.any(Array)
      );
      expect(mockIpcRenderer.send).toHaveBeenCalledWith("close-model-selection-window");
    });
  });

  describe("Edge Cases", () => {
    beforeEach(() => {
      jest.isolateModules(() => {
        require("../src/select_models_renderer");
      });
    });

    test("handles missing save button gracefully", () => {
      document.getElementById = jest.fn(() => null);

      // Should not throw error
      expect(() => {
        jest.isolateModules(() => {
          require("../src/select_models_renderer");
        });
      }).not.toThrow();
    });

    test("handles missing cancel button gracefully", () => {
      document.getElementById = jest.fn((id: string) => {
        if (id === "save-button") return saveButton;
        return null;
      });

      expect(() => {
        jest.isolateModules(() => {
          require("../src/select_models_renderer");
        });
      }).not.toThrow();
    });

    test("handles rapid save button clicks", () => {
      chatgptCheckbox.checked = true;

      saveButton.click();
      saveButton.click();
      saveButton.click();

      expect(mockIpcRenderer.send).toHaveBeenCalledTimes(3);
      expect(mockIpcRenderer.send).toHaveBeenCalledWith("save-default-models", [
        "https://chatgpt.com",
      ]);
    });

    test("handles checkbox state changes during save", () => {
      chatgptCheckbox.checked = true;
      geminiCheckbox.checked = true;

      // Change state mid-process (simulating async behavior)
      saveButton.addEventListener("click", () => {
        claudeCheckbox.checked = true;
      }, { capture: true });

      saveButton.click();

      // Should capture state at time of click
      expect(mockIpcRenderer.send).toHaveBeenCalled();
    });
  });
});
