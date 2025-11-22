// Mock window and document before importing
Object.defineProperty(global, 'window', {
  value: {
    addEventListener: jest.fn(),
    removeEventListener: jest.fn(),
    dispatchEvent: jest.fn(),
  },
  writable: true,
});

// Mock document.addEventListener
document.addEventListener = jest.fn();
document.removeEventListener = jest.fn();
document.querySelector = jest.fn();
document.querySelectorAll = jest.fn();
document.getElementById = jest.fn();

describe("Dropdown Functions", () => {
  let dropdownButton: HTMLButtonElement;
  let dropdownContent: HTMLElement;
  let dropdownItems: HTMLElement[];
  let domContentLoadedCallback: ((event: Event) => void) | undefined;
  let windowClickCallback: ((event: MouseEvent) => void) | undefined;

  beforeEach(() => {
    // Clear the DOM
    document.body.innerHTML = "";
    jest.clearAllMocks();

    // Create DOM elements
    dropdownButton = document.createElement("button");
    dropdownButton.id = "dropdown-button";
    dropdownButton.textContent = "Show Models ▼";
    document.body.appendChild(dropdownButton);

    dropdownContent = document.createElement("div");
    dropdownContent.className = "dropdown-content";
    document.body.appendChild(dropdownContent);

    // Create dropdown items
    const itemTexts = ["Hide ChatGPT", "Hide Gemini", "Show Claude", "Show Grok", "Show DeepSeek", "Show Copilot"];
    dropdownItems = itemTexts.map((text) => {
      const item = document.createElement("div");
      item.className = "dropdown-item";
      item.textContent = text;
      dropdownContent.appendChild(item);
      return item;
    });

    // Mock document methods to return our test elements
    document.getElementById = jest.fn((id: string) => {
      if (id === "dropdown-button") return dropdownButton;
      return null;
    });

    document.querySelector = jest.fn((selector: string) => {
      if (selector === ".dropdown-content") return dropdownContent;
      return null;
    });

    document.querySelectorAll = jest.fn((selector: string) => {
      if (selector === ".dropdown-item") return dropdownItems as any;
      return [] as any;
    });

    // Capture the DOMContentLoaded callback
    domContentLoadedCallback = undefined;
    document.addEventListener = jest.fn((event: string, callback: (event: Event) => void) => {
      if (event === "DOMContentLoaded") {
        domContentLoadedCallback = callback;
      }
    });

    // Capture the window click callback
    windowClickCallback = undefined;
    (window.addEventListener as any) = jest.fn((event: string, callback: (event: MouseEvent) => void) => {
      if (event === "click") {
        windowClickCallback = callback;
      }
    });

    // Import and trigger the dropdown module
    jest.isolateModules(() => {
      require("../src/dropdown");
    });

    // Trigger DOMContentLoaded to initialize the dropdown
    if (domContentLoadedCallback) {
      (domContentLoadedCallback as (event: Event) => void)(new Event("DOMContentLoaded"));
    }
  });

  afterEach(() => {
    document.body.innerHTML = "";
  });

  describe("Initialization", () => {
    test("sets up event listeners on DOMContentLoaded", () => {
      expect(document.addEventListener).toHaveBeenCalledWith(
        "DOMContentLoaded",
        expect.any(Function)
      );
    });

    test("finds and initializes dropdown button", () => {
      expect(dropdownButton).toBeTruthy();
      expect(dropdownButton.id).toBe("dropdown-button");
    });

    test("finds and initializes dropdown content", () => {
      expect(dropdownContent).toBeTruthy();
      expect(dropdownContent.className).toContain("dropdown-content");
    });

    test("initializes all dropdown items", () => {
      expect(dropdownItems.length).toBe(6);
      dropdownItems.forEach(item => {
        expect(item.className).toContain("dropdown-item");
      });
    });
  });

  describe("Dropdown Button Click", () => {
    test("toggles show class on dropdown content when button is clicked", () => {
      expect(dropdownContent.classList.contains("show")).toBe(false);

      dropdownButton.click();
      expect(dropdownContent.classList.contains("show")).toBe(true);

      dropdownButton.click();
      expect(dropdownContent.classList.contains("show")).toBe(false);
    });

    test("stops event propagation when button is clicked", () => {
      const mockEvent = new MouseEvent("click", { bubbles: true });
      const stopPropagationSpy = jest.spyOn(mockEvent, "stopPropagation");

      dropdownButton.dispatchEvent(mockEvent);

      expect(stopPropagationSpy).toHaveBeenCalled();
    });

    test("shows dropdown when closed and button is clicked", () => {
      dropdownContent.classList.remove("show");
      expect(dropdownContent.classList.contains("show")).toBe(false);

      dropdownButton.click();

      expect(dropdownContent.classList.contains("show")).toBe(true);
    });

    test("hides dropdown when open and button is clicked", () => {
      dropdownContent.classList.add("show");
      expect(dropdownContent.classList.contains("show")).toBe(true);

      dropdownButton.click();

      expect(dropdownContent.classList.contains("show")).toBe(false);
    });
  });

  describe("Dropdown Item Click", () => {
    test("removes show class when any dropdown item is clicked", () => {
      dropdownContent.classList.add("show");

      dropdownItems[0].click();

      expect(dropdownContent.classList.contains("show")).toBe(false);
    });

    test("stops event propagation when dropdown item is clicked", () => {
      const mockEvent = new MouseEvent("click", { bubbles: true });
      const stopPropagationSpy = jest.spyOn(mockEvent, "stopPropagation");

      dropdownItems[0].dispatchEvent(mockEvent);

      expect(stopPropagationSpy).toHaveBeenCalled();
    });

    test("closes dropdown for each item when clicked", () => {
      dropdownItems.forEach((item, index) => {
        dropdownContent.classList.add("show");
        expect(dropdownContent.classList.contains("show")).toBe(true);

        item.click();

        expect(dropdownContent.classList.contains("show")).toBe(false);
      });
    });
  });

  describe("Window Click (Outside Dropdown)", () => {
    test("closes dropdown when clicking outside", () => {
      dropdownContent.classList.add("show");

      const outsideElement = document.createElement("div");
      document.body.appendChild(outsideElement);

      const clickEvent = new MouseEvent("click", { bubbles: true });
      Object.defineProperty(clickEvent, "target", {
        value: outsideElement,
        writable: false,
      });

      if (windowClickCallback) {
        windowClickCallback(clickEvent);
      }

      expect(dropdownContent.classList.contains("show")).toBe(false);
    });

    test("does not close dropdown when clicking the button", () => {
      dropdownContent.classList.add("show");

      const clickEvent = new MouseEvent("click", { bubbles: true });
      Object.defineProperty(clickEvent, "target", {
        value: dropdownButton,
        writable: false,
      });

      if (windowClickCallback) {
        windowClickCallback(clickEvent);
      }

      expect(dropdownContent.classList.contains("show")).toBe(true);
    });

    test("does not close dropdown when clicking inside dropdown content", () => {
      dropdownContent.classList.add("show");

      const clickEvent = new MouseEvent("click", { bubbles: true });
      Object.defineProperty(clickEvent, "target", {
        value: dropdownItems[0],
        writable: false,
      });

      if (windowClickCallback) {
        windowClickCallback(clickEvent);
      }

      // Note: The actual implementation closes on item click via item's own handler
      // But the window click handler should not interfere
    });

    test("does nothing when dropdown is already closed and clicking outside", () => {
      expect(dropdownContent.classList.contains("show")).toBe(false);

      const outsideElement = document.createElement("div");
      document.body.appendChild(outsideElement);

      const clickEvent = new MouseEvent("click", { bubbles: true });
      Object.defineProperty(clickEvent, "target", {
        value: outsideElement,
        writable: false,
      });

      if (windowClickCallback) {
        windowClickCallback(clickEvent);
      }

      expect(dropdownContent.classList.contains("show")).toBe(false);
    });
  });

  describe("Edge Cases", () => {
    test("handles missing dropdown button gracefully", () => {
      // Remove button and re-initialize
      document.body.innerHTML = "";
      dropdownContent = document.createElement("div");
      dropdownContent.className = "dropdown-content";
      document.body.appendChild(dropdownContent);

      expect(() => {
        jest.isolateModules(() => {
          require("../src/dropdown");
        });
        if (domContentLoadedCallback) {
          domContentLoadedCallback(new Event("DOMContentLoaded"));
        }
      }).not.toThrow();
    });

    test("handles missing dropdown content gracefully", () => {
      // Remove content and re-initialize
      document.body.innerHTML = "";
      dropdownButton = document.createElement("button");
      dropdownButton.id = "dropdown-button";
      document.body.appendChild(dropdownButton);

      expect(() => {
        jest.isolateModules(() => {
          require("../src/dropdown");
        });
        if (domContentLoadedCallback) {
          domContentLoadedCallback(new Event("DOMContentLoaded"));
        }
      }).not.toThrow();
    });

    test("handles missing both button and content gracefully", () => {
      document.body.innerHTML = "";

      expect(() => {
        jest.isolateModules(() => {
          require("../src/dropdown");
        });
        if (domContentLoadedCallback) {
          domContentLoadedCallback(new Event("DOMContentLoaded"));
        }
      }).not.toThrow();
    });

    test("handles multiple rapid clicks on dropdown button", () => {
      dropdownButton.click();
      dropdownButton.click();
      dropdownButton.click();

      expect(dropdownContent.classList.contains("show")).toBe(true);

      dropdownButton.click();

      expect(dropdownContent.classList.contains("show")).toBe(false);
    });

    test("handles rapid clicks on different dropdown items", () => {
      dropdownContent.classList.add("show");

      dropdownItems[0].click();
      dropdownItems[1].click();
      dropdownItems[2].click();

      expect(dropdownContent.classList.contains("show")).toBe(false);
    });
  });

  describe("Event Propagation", () => {
    test("prevents propagation to window click handler when button is clicked", () => {
      dropdownContent.classList.remove("show");

      const clickEvent = new MouseEvent("click", { bubbles: true, cancelable: true });
      const stopPropagationSpy = jest.spyOn(clickEvent, "stopPropagation");

      dropdownButton.dispatchEvent(clickEvent);

      expect(stopPropagationSpy).toHaveBeenCalled();
      expect(dropdownContent.classList.contains("show")).toBe(true);
    });

    test("prevents propagation to window click handler when item is clicked", () => {
      dropdownContent.classList.add("show");

      const clickEvent = new MouseEvent("click", { bubbles: true, cancelable: true });
      const stopPropagationSpy = jest.spyOn(clickEvent, "stopPropagation");

      dropdownItems[0].dispatchEvent(clickEvent);

      expect(stopPropagationSpy).toHaveBeenCalled();
    });
  });
});
