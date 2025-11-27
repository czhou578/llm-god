import { spawn } from 'child_process';

console.log('🚀 Starting development mode with auto-restart...\n');

let shouldRestart = true;

// Handle Ctrl+C gracefully
process.on('SIGINT', () => {
  console.log('\n\n👋 Stopping development mode...');
  shouldRestart = false;
  process.exit(0);
});

function runApp() {
  console.log('📦 Building TypeScript...');

  // First build the TypeScript
  const buildProcess = spawn('npm', ['run', 'build'], {
    stdio: 'inherit',
    shell: true
  });

  buildProcess.on('close', (code) => {
  if (code !== 0) {
      console.error('❌ Build failed!');
      process.exit(1);
    }

    console.log('✅ Build complete! Starting Electron...\n');

    // Then run electron
    const electronProcess = spawn('electron', ['.'], {
      stdio: 'inherit',
      shell: true
    });

    electronProcess.on('close', (code) => {
      if (!shouldRestart) {
        // User pressed Ctrl+C in terminal
        process.exit(code);
      } else if (code === 42) {
        // Special exit code 42 = intentional restart (model change)
        console.log('\n🔄 Model configuration changed. Restarting app...\n');
        setTimeout(() => runApp(), 1000); // Wait 1 second before restart
      } else {
        // Normal close (user closed window) - don't restart
        console.log('\n👋 App closed normally. Exiting...');
        process.exit(0);
      }
    });

    electronProcess.on('error', (err) => {
      console.error('❌ Failed to start Electron:', err);
      process.exit(1);
    });
  });

  buildProcess.on('error', (err) => {
    console.error('❌ Failed to build:', err);
    process.exit(1);
  });
}

// Start the app
runApp();
