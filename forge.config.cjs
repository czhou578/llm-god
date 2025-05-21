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
      config: {
        certificateFile: "./cert.pfx",
        certificatePassword: process.env.CERTIFICATE_PASSWORD,
      },
    },
  ],
  files: [
    "dist/**/*", // Include compiled TypeScript files
    "index.html", // Include the main HTML file
    "package.json", // Include the package.json file
    "src/preload.cjs", // Include the preload script
    "src/utilities.js", // Include utility functions
    "src/answer_scrapers/**/*", // Include answer scraper scripts
    "!**/__tests__/**", // Exclude test files
    "!**/*.test.*", // Exclude test files
    "!node_modules/**/*", // Exclude unnecessary dependencies
    "!**/*.map", // Exclude source maps
    "!**/*.md", // Exclude markdown files (e.g., README.md)
    "!**/*.ts", // Exclude TypeScript source files (only compiled JS is needed)
    "!**/*.cts", // Exclude CommonJS TypeScript files
    "!**/*.d.ts", // Exclude TypeScript declaration files
    "!out/**/*", // Exclude output directories
  ],
};