module.exports = {
  packagerConfig: {
    asar: true, // Enable ASAR for faster file access
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
