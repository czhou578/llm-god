module.exports = {
  packagerConfig: {
    asar: true,
  },
  makers: [
    {
      name: "@electron-forge/maker-zip",
      platforms: ["linux"],
    },
    {
      name: "@electron-forge/maker-squirrel",
      config: {
        name: "llm-god",
        authors: "Colin Zhou",
        description: "A desktop application for prompting multiple LLMs at once!",
        exe: "llm-god.exe",
        setupExe: "llm-god-setup.exe",
        setupPackage: "llm-god-package.nupkg",
      }
    },
  ],
  files: ["**/*", "!*.log"],
};
