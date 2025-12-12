module.exports = {
  apps: [
    {
      name: "accubooks-backend",
      script: "server.js",
      instances: 1,
      autorestart: true,
      watch: false,
      max_memory_restart: "1G",
      env: {
        NODE_ENV: "development",
        PORT: 3000,
      },
      env_production: {
        NODE_ENV: "production",
        PORT: process.env.PORT || 3000,
      },
      error_log: "./logs/pm2-error.log",
      out_log: "./logs/pm2-out.log",
      log_log: "./logs/pm2-combined.log",
      time: true,
    },
  ],
};
