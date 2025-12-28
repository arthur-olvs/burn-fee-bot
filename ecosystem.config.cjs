module.exports = {
  apps: [
    {
      name: "clanker-fee-bot",
      script: "dist/index.js",
      time: true,
      autorestart: true,
      max_restarts: 20,
      env: {
        NODE_ENV: "production"
      }
    }
  ]
};
