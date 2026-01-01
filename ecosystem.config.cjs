/**
 * PM2 Ecosystem Configuration
 * 
 * Usage:
 *   pm2 start ecosystem.config.cjs
 *   pm2 restart stripeviz
 *   pm2 logs stripeviz
 */

module.exports = {
  apps: [
    {
      name: "stripeviz",
      script: "./dist/server/node-build.mjs",
      cwd: "/home/ubuntu/StripeViz",
      
      // Environment
      env: {
        NODE_ENV: "production",
        PORT: 8080,
      },
      
      // Process management
      instances: 1,
      exec_mode: "fork",
      autorestart: true,
      watch: false,
      max_memory_restart: "500M",
      
      // Restart behavior
      min_uptime: "10s",
      max_restarts: 10,
      restart_delay: 4000,
      
      // Logging
      log_file: "/home/ubuntu/.pm2/logs/stripeviz-combined.log",
      error_file: "/home/ubuntu/.pm2/logs/stripeviz-error.log",
      out_file: "/home/ubuntu/.pm2/logs/stripeviz-out.log",
      log_date_format: "YYYY-MM-DD HH:mm:ss Z",
      merge_logs: true,
      
      // Graceful shutdown
      kill_timeout: 5000,
      wait_ready: true,
      listen_timeout: 10000,
    },
  ],
};
