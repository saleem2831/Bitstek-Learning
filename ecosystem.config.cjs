module.exports = { apps: [{
 name: 'bitstek-learning-api', cwd: './server', script: 'src/index.js',
 instances: 1, exec_mode: 'fork', autorestart: true, watch: false,
 min_uptime: '10s', max_restarts: 20, restart_delay: 5000,
 exp_backoff_restart_delay: 2000, max_memory_restart: '350M',
 env: { NODE_ENV: 'production' }
}]};
