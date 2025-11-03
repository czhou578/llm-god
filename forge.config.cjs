module.exports = {
  packagerConfig: {
    asar: true,
    icon: "./icon",
  },
  makers: [
    {
      name: "@electron-forge/maker-squirrel",
      platforms: ["win32"],
      config: {
        name: "llm-god",
        authors: "Colin Zhou",
        description:
          "A desktop application for prompting multiple LLMs at once!",
        exe: "llm-god.exe",
        setupExe: "llm-god-setup.exe",
        setupPackage: "llm-god-package.nupkg",
        setupIcon: "./icon.ico",
      },
    },
    {
      name: "@electron-forge/maker-deb",
      platforms: ["linux"],
      config: {
        options: {
          maintainer: "Colin Zhou",
          homepage: "https://github.com/czhou578/llm-god",
        },
      },
    },
    {
      name: "@electron-forge/maker-rpm",
      platforms: ["linux"],
      config: {
        options: {
          homepage: "https://github.com/czhou578/llm-god",
          license: "MIT",
        },
      },
    },
    {
      name: "@electron-forge/maker-zip",
      platforms: ["darwin", "linux"],
    },
  ],
  files: ["**/*", "!*.log"],
};
