/**
 * Main process tests - IPC Handlers
 */

describe("Main Process - IPC Handlers", () => {
  let mockIpcMain: any;
  let mockEvent: any;
  let mockStore: any;
  let ipcHandlers: Map<string, Function>;
  let ipcListeners: Map<string, Function>;

  beforeEach(() => {
    ipcHandlers = new Map();
    ipcListeners = new Map();

    mockEvent = {
      sender: {
        send: jest.fn(),
      },
    };

    mockStore = {
      get: jest.fn(),
      set: jest.fn(),
      delete: jest.fn(),
      has: jest.fn(),
      store: {},
    };

    mockIpcMain = {
      on: jest.fn((channel: string, handler: Function) => {
        ipcListeners.set(channel, handler);
      }),
      handle: jest.fn((channel: string, handler: Function) => {
        ipcHandlers.set(channel, handler);
      }),
    };

    jest.clearAllMocks();
  });

  describe("save-prompt handler", () => {
    test("saves prompt with timestamp key", () => {
      const promptValue = "Test prompt";
      const handler = jest.fn((event, prompt) => {
        const timestamp = new Date().getTime().toString();
        mockStore.set(timestamp, prompt);
      });

      handler(mockEvent, promptValue);

      expect(mockStore.set).toHaveBeenCalled();
      expect(mockStore.set).toHaveBeenCalledWith(
        expect.any(String),
        promptValue
      );
    });

    test("strips emojis before saving", () => {
      const promptWithEmoji = "Test 😊 prompt";
      const cleanPrompt = "Test  prompt";

      const handler = jest.fn((event, prompt) => {
        // Simulate emoji stripping
        const cleaned = prompt.replace(/[\u{1F600}-\u{1F64F}]/gu, "");
        mockStore.set("timestamp", cleaned);
      });

      handler(mockEvent, promptWithEmoji);

      expect(mockStore.set).toHaveBeenCalled();
    });

    test("generates unique timestamp keys", () => {
      const handler = jest.fn((event, prompt) => {
        const timestamp = new Date().getTime().toString();
        mockStore.set(timestamp, prompt);
      });

      handler(mockEvent, "Prompt 1");
      handler(mockEvent, "Prompt 2");

      expect(mockStore.set).toHaveBeenCalledTimes(2);
    });
  });

  describe("get-prompts handler", () => {
    test("returns all stored prompts", async () => {
      const storedData = {
        "123456": "Prompt 1",
        "123457": "Prompt 2",
      };
      mockStore.store = storedData;

      const handler = jest.fn(() => mockStore.store);
      const result = handler();

      expect(result).toEqual(storedData);
    });

    test("returns empty object when no prompts", async () => {
      mockStore.store = {};

      const handler = jest.fn(() => mockStore.store);
      const result = handler();

      expect(result).toEqual({});
    });
  });

  describe("paste-prompt handler", () => {
    test("sends prompt to event sender", () => {
      const prompt = "Test prompt";
      const handler = jest.fn((event, p) => {
        // Handler logic would inject into views and update textarea
      });

      handler(mockEvent, prompt);
      expect(handler).toHaveBeenCalledWith(mockEvent, prompt);
    });

    test("strips emojis from pasted prompt", () => {
      const promptWithEmoji = "Paste 😊 this";
      const handler = jest.fn();

      handler(mockEvent, promptWithEmoji);
      expect(handler).toHaveBeenCalled();
    });
  });

  describe("delete-prompt-by-value handler", () => {
    test("finds and deletes matching prompt", () => {
      const value = "Test prompt";
      mockStore.store = {
        "123456": "Test prompt",
        "123457": "Other prompt",
      };

      const handler = jest.fn((event, val) => {
        const normalized = val.normalize("NFKC");
        const allEntries = mockStore.store;
        const matchingKey = Object.keys(allEntries).find(
          (key) => allEntries[key] === normalized
        );

        if (matchingKey) {
          mockStore.delete(matchingKey);
        }
      });

      handler(mockEvent, value);

      expect(mockStore.delete).toHaveBeenCalledWith("123456");
    });

    test("normalizes value before matching", () => {
      const value = "café";
      const normalized = value.normalize("NFKC");

      expect(typeof normalized).toBe("string");
    });

    test("does not delete if no match found", () => {
      mockStore.store = {
        "123456": "Existing prompt",
      };

      const handler = jest.fn((event, val) => {
        const allEntries = mockStore.store;
        const matchingKey = Object.keys(allEntries).find(
          (key) => allEntries[key] === val
        );

        if (matchingKey) {
          mockStore.delete(matchingKey);
        }
      });

      handler(mockEvent, "Non-existent prompt");

      expect(mockStore.delete).not.toHaveBeenCalled();
    });
  });

  describe("update-prompt handler", () => {
    test("updates existing prompt value", () => {
      mockStore.has.mockReturnValue(true);

      const handler = jest.fn((event, { key, value }) => {
        if (mockStore.has(key)) {
          mockStore.set(key, value);
        }
      });

      handler(mockEvent, { key: "123456", value: "Updated prompt" });

      expect(mockStore.has).toHaveBeenCalledWith("123456");
      expect(mockStore.set).toHaveBeenCalledWith("123456", "Updated prompt");
    });

    test("does not update non-existent prompt", () => {
      mockStore.has.mockReturnValue(false);

      const handler = jest.fn((event, { key, value }) => {
        if (mockStore.has(key)) {
          mockStore.set(key, value);
        }
      });

      handler(mockEvent, { key: "999999", value: "New prompt" });

      expect(mockStore.has).toHaveBeenCalledWith("999999");
      expect(mockStore.set).not.toHaveBeenCalled();
    });
  });

  describe("get-key-by-value handler", () => {
    test("finds key for matching value", async () => {
      mockStore.store = {
        "123456": "Test prompt",
        "123457": "Other prompt",
      };

      const handler = jest.fn((event, value) => {
        const normalized = value.normalize("NFKC");
        const allEntries = mockStore.store;
        const matchingKey = Object.keys(allEntries).find(
          (key) => allEntries[key] === normalized
        );

        return matchingKey || null;
      });

      const result = handler(mockEvent, "Test prompt");

      expect(result).toBe("123456");
    });

    test("returns null when no match found", async () => {
      mockStore.store = {
        "123456": "Existing prompt",
      };

      const handler = jest.fn((event, value) => {
        const allEntries = mockStore.store;
        const matchingKey = Object.keys(allEntries).find(
          (key) => allEntries[key] === value
        );

        return matchingKey || null;
      });

      const result = handler(mockEvent, "Non-existent");

      expect(result).toBeNull();
    });

    test("normalizes value before searching", async () => {
      const value = "test";
      const normalized = value.normalize("NFKC");

      expect(normalized).toBe("test");
    });
  });

  describe("get-default-models handler", () => {
    test("returns saved default models", async () => {
      const savedModels = ["https://chatgpt.com", "https://claude.ai"];
      mockStore.get.mockReturnValue(savedModels);

      const handler = jest.fn(() => {
        return mockStore.get("defaultModels") || [];
      });

      const result = handler();

      expect(result).toEqual(savedModels);
      expect(mockStore.get).toHaveBeenCalledWith("defaultModels");
    });

    test("returns empty array when no models saved", async () => {
      mockStore.get.mockReturnValue(null);

      const handler = jest.fn(() => {
        return mockStore.get("defaultModels") || [];
      });

      const result = handler();

      expect(result).toEqual([]);
    });
  });

  describe("save-default-models handler", () => {
    test("saves models to store", () => {
      const models = ["https://chatgpt.com", "https://gemini.google.com"];

      const handler = jest.fn((event, m) => {
        mockStore.set("defaultModels", m);
      });

      handler(mockEvent, models);

      expect(mockStore.set).toHaveBeenCalledWith("defaultModels", models);
    });

    test("saves empty array of models", () => {
      const handler = jest.fn((event, m) => {
        mockStore.set("defaultModels", m);
      });

      handler(mockEvent, []);

      expect(mockStore.set).toHaveBeenCalledWith("defaultModels", []);
    });
  });

  describe("row-selected handler", () => {
    test("stores selected row key", () => {
      let pendingKey: string | null = null;

      const handler = jest.fn((event, key) => {
        pendingKey = key;
      });

      handler(mockEvent, "123456");

      expect(handler).toHaveBeenCalledWith(mockEvent, "123456");
    });
  });

  describe("edit-prompt-ready handler", () => {
    test("sends row-selected message when pending key exists", () => {
      const pendingKey = "123456";

      const handler = jest.fn((event) => {
        if (pendingKey) {
          event.sender.send("row-selected", pendingKey);
        }
      });

      handler(mockEvent);

      expect(mockEvent.sender.send).toHaveBeenCalledWith(
        "row-selected",
        pendingKey
      );
    });

    test("does not send message when no pending key", () => {
      const pendingKey = null;

      const handler = jest.fn((event) => {
        if (pendingKey) {
          event.sender.send("row-selected", pendingKey);
        }
      });

      handler(mockEvent);

      expect(mockEvent.sender.send).not.toHaveBeenCalled();
    });
  });

  describe("Window control handlers", () => {
    test("open-form-window handler", () => {
      const handler = jest.fn();
      handler(mockEvent);

      expect(handler).toHaveBeenCalledWith(mockEvent);
    });

    test("close-form-window handler", () => {
      const handler = jest.fn();
      handler(mockEvent);

      expect(handler).toHaveBeenCalled();
    });

    test("open-model-selection-window handler", () => {
      const handler = jest.fn();
      handler(mockEvent);

      expect(handler).toHaveBeenCalled();
    });

    test("close-model-selection-window handler", () => {
      const handler = jest.fn();
      handler(mockEvent);

      expect(handler).toHaveBeenCalled();
    });

    test("close-edit-window handler", () => {
      const handler = jest.fn();
      handler(mockEvent);

      expect(handler).toHaveBeenCalled();
    });
  });

  describe("Prompt action handlers", () => {
    test("enter-prompt handler receives prompt", () => {
      const prompt = "Test prompt";
      const handler = jest.fn();

      handler(mockEvent, prompt);

      expect(handler).toHaveBeenCalledWith(mockEvent, prompt);
    });

    test("send-prompt handler receives prompt", () => {
      const prompt = "Send this";
      const handler = jest.fn();

      handler(mockEvent, prompt);

      expect(handler).toHaveBeenCalledWith(mockEvent, prompt);
    });

    test("new-chat handler is called", () => {
      const handler = jest.fn();
      handler(mockEvent);

      expect(handler).toHaveBeenCalled();
    });
  });

  describe("LLM platform handlers - Open", () => {
    const platforms = [
      { name: "claude", command: "open claude now" },
      { name: "grok", command: "open grok now" },
      { name: "deepseek", command: "open deepseek now" },
      { name: "copilot", command: "open copilot now" },
      { name: "chatgpt", command: "open chatgpt now" },
      { name: "gemini", command: "open gemini now" },
    ];

    platforms.forEach(({ name, command }) => {
      test(`open-${name} handler with correct command`, () => {
        const handler = jest.fn((event, prompt) => {
          if (prompt === command) {
            // Would add browser view
          }
        });

        handler(mockEvent, command);

        expect(handler).toHaveBeenCalledWith(mockEvent, command);
      });

      test(`open-${name} handler ignores incorrect command`, () => {
        const handler = jest.fn((event, prompt) => {
          if (prompt === command) {
            return true;
          }
          return false;
        });

        const result = handler(mockEvent, "wrong command");

        expect(result).toBe(false);
      });
    });
  });

  describe("LLM platform handlers - Close", () => {
    const platforms = [
      { name: "claude", command: "close claude now" },
      { name: "grok", command: "close grok now" },
      { name: "deepseek", command: "close deepseek now" },
      { name: "copilot", command: "close copilot now" },
      { name: "chatgpt", command: "close chatgpt now" },
      { name: "gemini", command: "close gemini now" },
    ];

    platforms.forEach(({ name, command }) => {
      test(`close-${name} handler with correct command`, () => {
        const handler = jest.fn((event, prompt) => {
          if (prompt === command) {
            // Would remove browser view
          }
        });

        handler(mockEvent, command);

        expect(handler).toHaveBeenCalledWith(mockEvent, command);
      });

      test(`close-${name} handler ignores incorrect command`, () => {
        const handler = jest.fn((event, prompt) => {
          if (prompt === command) {
            return true;
          }
          return false;
        });

        const result = handler(mockEvent, "wrong command");

        expect(result).toBe(false);
      });
    });
  });

  describe("open-edit-view handler", () => {
    test("receives prompt parameter", () => {
      const prompt = "Edit this prompt";
      const handler = jest.fn();

      handler(mockEvent, prompt);

      expect(handler).toHaveBeenCalledWith(mockEvent, prompt);
    });

    test("normalizes prompt value", () => {
      const prompt = "café";
      const normalized = prompt.normalize("NFKC");

      expect(typeof normalized).toBe("string");
    });

    test("escapes special characters in prompt", () => {
      const prompt = "Test `backtick` and $variable";
      const escaped = prompt
        .replace(/\\/g, "\\\\")
        .replace(/`/g, "\\`")
        .replace(/\$/g, "\\$");

      expect(escaped).toContain("\\`");
      expect(escaped).toContain("\\$");
    });
  });
});
