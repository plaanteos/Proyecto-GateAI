module.exports = {
  apps: [
    {
      name: 'uniontech-prod',
      script: './main-server.js',
      instances: 'max',
      exec_mode: 'cluster',
      env: {
        NODE_ENV: 'development',
        PORT: 3000
      },
      env_production: {
        NODE_ENV: 'production',
        PORT: 3000,
        JWT_SECRET: 'uniontech_production_secret_change_this',
        LOG_LEVEL: 'info'
      },
      error_file: './logs/err.log',
      out_file: './logs/out.log',
      log_file: './logs/combined.log',
      time: true,
      max_memory_restart: '1G',
      node_args: '--max_old_space_size=1024',
      watch: false,
      ignore_watch: ['node_modules', 'logs', 'data'],
      restart_delay: 4000,
      max_restarts: 10,
      min_uptime: '10s'
    },
    {
      name: 'uniontech-dev',
      script: './main-server.js',
      instances: 1,
      exec_mode: 'fork',
      env: {
        NODE_ENV: 'development',
        PORT: 3001,
        LOG_LEVEL: 'debug'
      },
      watch: true,
      ignore_watch: ['node_modules', 'logs', 'data', '.git'],
      restart_delay: 1000
    }
  ],
  
  deploy: {
    production: {
      user: 'uniontech',
      host: 'tu-servidor.com',
      ref: 'origin/main',
      repo: 'git@github.com:tu-usuario/uniontech.git',
      path: '/opt/uniontech',
      'pre-deploy-local': '',
      'post-deploy': 'npm install --production && pm2 reload ecosystem.config.js --env production',
      'pre-setup': ''
    }
  }
};