module.exports = {
    makers: [
        {
            name: '@electron-forge/maker-zip',
            platforms: ['linux'],
        },
        {
            name: '@electron-forge/maker-squirrel',
            config: {
                certificateFile: './cert.pfx',
                certificatePassword: process.env.CERTIFICATE_PASSWORD
            }
        }
    ]
};