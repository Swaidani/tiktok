const { spawn } = require('child_process');
const path = require('path');

console.log('🚀 Starting TikTok Bot Application...');

// Start the backend server
const backend = spawn('npx', ['ts-node', 'server/index.ts'], {
  stdio: 'inherit',
  cwd: process.cwd()
});

// Start the frontend development server
const frontend = spawn('npx', ['vite', '--host', '0.0.0.0', '--port', '5173'], {
  stdio: 'inherit',
  cwd: process.cwd()
});

// Handle process termination
process.on('SIGINT', () => {
  console.log('\n🛑 Shutting down TikTok Bot...');
  backend.kill();
  frontend.kill();
  process.exit(0);
});

backend.on('error', (err) => {
  console.error('Backend error:', err);
});

frontend.on('error', (err) => {
  console.error('Frontend error:', err);
});

console.log('✅ TikTok Bot servers starting...');
console.log('📱 Frontend: http://localhost:5173');
console.log('🔧 Backend API: http://localhost:3000');