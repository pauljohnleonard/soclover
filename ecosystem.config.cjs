/** PM2 app for ThinkCentre — do not rename; other apps use different names. */
module.exports = {
  apps: [
    {
      name: 'soclover',
      cwd: __dirname + '/server',
      script: 'main.js',
      exec_mode: 'fork',
      instances: 1,
      autorestart: true,
      max_restarts: 20,
      time: true,
      env: {
        NODE_ENV: 'production',
        PORT: '3055',
        MONGODB_URI: 'mongodb://127.0.0.1:27017/soclover',
      },
    },
  ],
};
