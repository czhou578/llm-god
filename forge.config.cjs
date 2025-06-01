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
        certificateFile: "./cert.pfx",
        certificatePassword: process.env.CERTIFICATE_PASSWORD,
      },
    },
    {
      name: "@electron-forge/maker-appx",
      config: {
        packageName: "YourAppName",
        publisher: "CN=YourPublisherName",
        windowsKit: "C:\\Program Files (x86)\\Windows Kits\\10\\bin\\x64",
        devCert: "./cert.pfx",
        certPassword: process.env.CERTIFICATE_PASSWORD,
      },
    },
  ],
  files: ["**/*"],
};
