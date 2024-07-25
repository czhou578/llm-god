import Provider from "./provider";

export class OpenAI extends Provider {
  static handleInput(input) {
    const fullName = this.fullName;
    this.getWebview().executeJavaScript(`{
        var inputElement = document.querySelector('#prompt-textarea');
        if (inputElement) {
          const inputEvent = new Event('input', { bubbles: true });
          inputElement.value = \`${input}\`; // must be escaped backticks to support multiline
          inputElement.dispatchEvent(inputEvent);
        }
      }`);
  }

  static handleSubmit() {
    this.getWebview().executeJavaScript(`{
        // var btn = document.querySelector("textarea[placeholder*='Send a message']+button"); // this one broke recently .. note that they add another div (for the file upload) in code interpreter mode
        var btn = document.querySelector('button[data-testid="send-button"]');
        if (btn) {
            btn.focus();
            btn.disabled = false;
            btn.click();
        }
      }
      `);
  }
}
