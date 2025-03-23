# LLM-God

This is a desktop app for Windows machines only (currently) that allows users to simultaneously prompt multiple LLM's at once in one environment.

Currently, the following LLM web interfaces are supported:

- ChatGPT
- Google Gemini
- Meta Llama
- Anthropic Claude
- Perplexity
- X.ai Grok
- DeepSeek

## How to Use the App

### Selecting the Model

Use the dropdown at the bottom right corner to add and remove LLM web consoles. By default, ChatGPT, Gemini, and Llama are there by default and cannot be changed.

Note that if you are on free tier, then you will face the typical usage limits as specified by the LLM provider.

If you want to close the app, press Ctrl + W on your keyboard.

## Disclaimer

I did find out about the [GodMode](https://github.com/smol-ai/GodMode) project, but I felt that people needed an app that just provided the models from the few big companies like OpenAI and Anthropic. Many of the other smaller models are not very useful. In addition, that project doesn't seem to be very well maintained anymore and doesn't have some of the new models like Grok.

## Screenshot

![Screenshot](./image.png)

## Contributing

New contributions are welcome!

1. Clone the project and navigate to root directory

```
git clone https://github.com/czhou578/llm-god.git
cd llm-god
```

2. Install all dependencies

```
npm install
```

3. Start the app, which will create the shortcut that will also appear on your computer

```
npm run start
```

4. Make sure to run the code formatter Prettier for all the files by running the following in the project root folder

```
npm run prettier
```

## Debugging Tools

While developing, I liked to have the devtools of the app be visible and also have the option to have hot reloading on every save. Uncomment the following two lines to do so:

```
 mainWindow.webContents.openDevTools({ mode: "detach" });
 require("electron-reload")(path.join(__dirname, "."));
```

Please check out the Issues tab for existing issues to tackle, and feel free to suggest new issues as well! Make a pull request to this repo once a feature or bug fix is done.
