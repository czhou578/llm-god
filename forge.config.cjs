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
    },
  ],
  files: ["**/*", "!*.log"],
};
