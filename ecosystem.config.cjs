module.exports = {
  apps: [{
    name: 'army-recruiter-tool',
    script: 'npm',
    args: 'start',
    cwd: '/root/armyrecruitertool',
    instances: 1,
    autorestart: true,
    watch: false,
    max_memory_restart: '1G',
    env: {
      NODE_ENV: 'production',
      PORT: 5001
    },
    error_file: '/root/armyrecruitertool/logs/pm2-error.log',
    out_file: '/root/armyrecruitertool/logs/pm2-out.log',
    log_file: '/root/armyrecruitertool/logs/pm2-combined.log',
    time: true,
    merge_logs: true,
    log_date_format: 'YYYY-MM-DD HH:mm:ss Z',
    min_uptime: '10s',
    max_restarts: 10,
    restart_delay: 4000
  }]
};


