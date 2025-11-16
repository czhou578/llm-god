/**
 * @jest-environment jsdom
 */

describe("Save Edited Prompt Functions", () => {
  let mockIpcRenderer: {
    send: jest.Mock;
    on: jest.Mock;
  };
  let edit_form: HTMLFormElement;
  let edit_templateContent: HTMLTextAreaElement;
  let savePromptButton: HTMLButtonElement;
  let rowSelectedCallback: ((key: string) => void) | undefined;

  beforeEach(() => {
    // Clear the DOM
    document.body.innerHTML = "";
    jest.clearAllMocks();

    // Create DOM elements
    edit_form = document.createElement("form");
    edit_form.id = "form";
    document.body.appendChild(edit_form);

    edit_templateContent = document.createElement("textarea");
    edit_templateContent.id = "template-content";
    document.body.appendChild(edit_templateContent);

    savePromptButton = document.createElement("button");
    savePromptButton.type = "submit";
    document.body.appendChild(savePromptButton);

    // Mock document methods
    document.getElementById = jest.fn((id: string) => {
      if (id === "form") return edit_form;
      if (id === "template-content") return edit_templateContent;
      return null;
    });

    document.querySelector = jest.fn((selector: string) => {
      if (selector === 'button[type="submit"]') return savePromptButton;
      return null;
    });

    // Mock console methods
    console.log = jest.fn();
    console.error = jest.fn();

    // Create mock IPC renderer
    mockIpcRenderer = {
      send: jest.fn(),
      on: jest.fn((event: string, callback: (key: string) => void) => {
        if (event === "row-selected") {
          rowSelectedCallback = callback;
        }
      }),
    };

    // Setup window.electron mock
    Object.defineProperty(global, "window", {
      value: {
        electron: {
          ipcRenderer: mockIpcRenderer,
        },
      },
      writable: true,
      configurable: true,
    });

    // Reset the callback
    rowSelectedCallback = undefined;

    // Import and initialize the module
    jest.isolateModules(() => {
      require("../src/save_edited_prompt");
    });
  });

  describe("Initialization", () => {
    test("sends edit-prompt-ready message on load", () => {
      expect(mockIpcRenderer.send).toHaveBeenCalledWith("edit-prompt-ready");
    });

    test("registers row-selected event listener", () => {
      expect(mockIpcRenderer.on).toHaveBeenCalledWith(
        "row-selected",
        expect.any(Function)
      );
    });

    test("finds form element", () => {
      expect(document.getElementById).toHaveBeenCalledWith("form");
    });

    test("finds template-content textarea", () => {
      expect(document.getElementById).toHaveBeenCalledWith("template-content");
    });

    test("finds save prompt button", () => {
      expect(document.querySelector).toHaveBeenCalledWith('button[type="submit"]');
    });
  });

  describe("Row Selection Handling", () => {
    test("stores selected key when row-selected event is received", () => {
      const testKey = "test-key-123";
      
      if (rowSelectedCallback) {
        rowSelectedCallback(testKey);
      }

      expect(console.log).toHaveBeenCalledWith(
        `Selected key received in save_edited_prompt: ${testKey}`
      );
    });

    test("logs error when empty key is received", () => {
      if (rowSelectedCallback) {
        rowSelectedCallback("");
      }

      expect(console.error).toHaveBeenCalledWith(
        "Received empty key in row-selected event."
      );
    });

    test("does not log success message when empty key is received", () => {
      if (rowSelectedCallback) {
        rowSelectedCallback("");
      }

      expect(console.log).not.toHaveBeenCalledWith(
        expect.stringContaining("Selected key received")
      );
    });

    test("handles multiple row selections", () => {
      if (rowSelectedCallback) {
        rowSelectedCallback("first-key");
        rowSelectedCallback("second-key");
        rowSelectedCallback("third-key");
      }

      expect(console.log).toHaveBeenCalledWith(
        "Selected key received in save_edited_prompt: first-key"
      );
      expect(console.log).toHaveBeenCalledWith(
        "Selected key received in save_edited_prompt: second-key"
      );
      expect(console.log).toHaveBeenCalledWith(
        "Selected key received in save_edited_prompt: third-key"
      );
    });
  });

  describe("Save Button Click Handling", () => {
    beforeEach(() => {
      // Select a key before each save test
      if (rowSelectedCallback) {
        rowSelectedCallback("test-key");
      }
      jest.clearAllMocks();
    });

    test("prevents default form submission", () => {
      const mockEvent = new MouseEvent("click", { bubbles: true });
      const preventDefaultSpy = jest.spyOn(mockEvent, "preventDefault");

      edit_templateContent.value = "Test prompt content";
      savePromptButton.dispatchEvent(mockEvent);

      expect(preventDefaultSpy).toHaveBeenCalled();
    });

    test("sends update-prompt message with correct key and value", () => {
      edit_templateContent.value = "Updated prompt text";

      savePromptButton.click();

      expect(mockIpcRenderer.send).toHaveBeenCalledWith("update-prompt", {
        key: "test-key",
        value: "Updated prompt text",
      });
    });

    test("sends close-edit-window message after successful update", () => {
      edit_templateContent.value = "Some prompt";

      savePromptButton.click();

      expect(mockIpcRenderer.send).toHaveBeenCalledWith("close-edit-window");
    });

    test("logs success message when prompt is updated", () => {
      edit_templateContent.value = "Prompt content";

      savePromptButton.click();

      expect(console.log).toHaveBeenCalledWith(
        'Sent update-prompt message with key "test-key" and value "Prompt content"'
      );
    });

    test("trims whitespace from prompt before saving", () => {
      edit_templateContent.value = "   Prompt with spaces   ";

      savePromptButton.click();

      expect(mockIpcRenderer.send).toHaveBeenCalledWith("update-prompt", {
        key: "test-key",
        value: "Prompt with spaces",
      });
    });

    test("does not send update when prompt is empty", () => {
      edit_templateContent.value = "";

      savePromptButton.click();

      expect(mockIpcRenderer.send).not.toHaveBeenCalledWith(
        "update-prompt",
        expect.any(Object)
      );
    });

    test("does not send update when prompt is only whitespace", () => {
      edit_templateContent.value = "   ";

      savePromptButton.click();

      expect(mockIpcRenderer.send).not.toHaveBeenCalledWith(
        "update-prompt",
        expect.any(Object)
      );
    });

    test("logs error when prompt is empty", () => {
      edit_templateContent.value = "";

      savePromptButton.click();

      expect(console.error).toHaveBeenCalledWith(
        "No key selected or prompt is empty."
      );
    });

    test("does not close window when prompt is empty", () => {
      edit_templateContent.value = "";

      savePromptButton.click();

      expect(mockIpcRenderer.send).not.toHaveBeenCalledWith("close-edit-window");
    });
  });

  describe("Save Without Selected Key", () => {
    test("does not send update when no key is selected", () => {
      // Don't select a key
      edit_templateContent.value = "Some prompt text";

      savePromptButton.click();

      expect(mockIpcRenderer.send).not.toHaveBeenCalledWith(
        "update-prompt",
        expect.any(Object)
      );
    });

    test("logs error when no key is selected", () => {
      edit_templateContent.value = "Some prompt text";

      savePromptButton.click();

      expect(console.error).toHaveBeenCalledWith(
        "No key selected or prompt is empty."
      );
    });

    test("does not close window when no key is selected", () => {
      edit_templateContent.value = "Some prompt text";

      savePromptButton.click();

      expect(mockIpcRenderer.send).not.toHaveBeenCalledWith("close-edit-window");
    });
  });

  describe("Edge Cases", () => {
    beforeEach(() => {
      if (rowSelectedCallback) {
        rowSelectedCallback("test-key");
      }
      jest.clearAllMocks();
    });

    test("handles very long prompt text", () => {
      const longPrompt = "A".repeat(10000);
      edit_templateContent.value = longPrompt;

      savePromptButton.click();

      expect(mockIpcRenderer.send).toHaveBeenCalledWith("update-prompt", {
        key: "test-key",
        value: longPrompt,
      });
    });

    test("handles prompt with special characters", () => {
      edit_templateContent.value = "Special: !@#$%^&*()_+-={}[]|\\:\";<>?,./";

      savePromptButton.click();

      expect(mockIpcRenderer.send).toHaveBeenCalledWith("update-prompt", {
        key: "test-key",
        value: "Special: !@#$%^&*()_+-={}[]|\\:\";<>?,./",
      });
    });

    test("handles prompt with newlines", () => {
      edit_templateContent.value = "Line 1\nLine 2\nLine 3";

      savePromptButton.click();

      expect(mockIpcRenderer.send).toHaveBeenCalledWith("update-prompt", {
        key: "test-key",
        value: "Line 1\nLine 2\nLine 3",
      });
    });

    test("handles prompt with unicode characters", () => {
      edit_templateContent.value = "Unicode: 你好 🌟 café";

      savePromptButton.click();

      expect(mockIpcRenderer.send).toHaveBeenCalledWith("update-prompt", {
        key: "test-key",
        value: "Unicode: 你好 🌟 café",
      });
    });

    test("handles multiple rapid save button clicks", () => {
      edit_templateContent.value = "Test prompt";

      savePromptButton.click();
      savePromptButton.click();
      savePromptButton.click();

      expect(mockIpcRenderer.send).toHaveBeenCalledTimes(6); // 3 update-prompt + 3 close-edit-window
    });

    test("handles key change between saves", () => {
      edit_templateContent.value = "First prompt";
      savePromptButton.click();

      jest.clearAllMocks();

      if (rowSelectedCallback) {
        rowSelectedCallback("different-key");
      }

      edit_templateContent.value = "Second prompt";
      savePromptButton.click();

      expect(mockIpcRenderer.send).toHaveBeenCalledWith("update-prompt", {
        key: "different-key",
        value: "Second prompt",
      });
    });
  });

  describe("IPC Message Order", () => {
    beforeEach(() => {
      if (rowSelectedCallback) {
        rowSelectedCallback("test-key");
      }
      jest.clearAllMocks();
    });

    test("sends update-prompt before close-edit-window", () => {
      edit_templateContent.value = "Test prompt";

      savePromptButton.click();

      const sendCalls = mockIpcRenderer.send.mock.calls;
      const updateIndex = sendCalls.findIndex(
        (call) => call[0] === "update-prompt"
      );
      const closeIndex = sendCalls.findIndex(
        (call) => call[0] === "close-edit-window"
      );

      expect(updateIndex).toBeLessThan(closeIndex);
    });

    test("sends exactly two messages on successful save", () => {
      edit_templateContent.value = "Test prompt";

      savePromptButton.click();

      expect(mockIpcRenderer.send).toHaveBeenCalledTimes(2);
      expect(mockIpcRenderer.send).toHaveBeenNthCalledWith(1, "update-prompt", {
        key: "test-key",
        value: "Test prompt",
      });
      expect(mockIpcRenderer.send).toHaveBeenNthCalledWith(
        2,
        "close-edit-window"
      );
    });
  });
});
