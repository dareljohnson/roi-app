#!/usr/bin/env node

const { exec, spawn } = require('child_process');
const fs = require('fs');
const path = require('path');

console.log('🔍 Checking for Real Estate ROI app processes on ports 3002-3005...');

// Function to check if process is related to our project
function isOurProject(pid, port) {
    // Only target ports 3002+ to avoid interfering with other projects on 3000/3001
    return port >= 3002;
}

// Function to kill process on port (cross-platform)
function killProcessOnPort(port) {
    return new Promise((resolve) => {
        const isWindows = process.platform === 'win32';
        
        if (isWindows) {
            // Windows: Use netstat and taskkill
            exec(`netstat -ano | findstr :${port}`, (error, stdout) => {
                if (stdout) {
                    const lines = stdout.trim().split('\n');
                    const pids = new Set();
                    
                    lines.forEach(line => {
                        const parts = line.trim().split(/\s+/);
                        if (parts.length >= 5 && parts[3].includes('LISTENING')) {
                            // Only kill processes on our designated ports
                            if (isOurProject(parts[4], port)) {
                                pids.add(parts[4]);
                            }
                        }
                    });
                    
                    if (pids.size > 0) {
                        pids.forEach(pid => {
                            console.log(`🔥 Killing process (PID: ${pid}) on port ${port}`);
                            exec(`taskkill /PID ${pid} /F`, () => {});
                        });
                        setTimeout(() => {
                            console.log(`✅ Port ${port} should now be free`);
                            resolve();
                        }, 1000);
                    } else {
                        console.log(`✅ Port ${port} is free`);
                        resolve();
                    }
                } else {
                    console.log(`✅ Port ${port} is free`);
                    resolve();
                }
            });
        } else {
            // Unix/Linux/macOS: Use lsof and kill
            exec(`lsof -ti:${port}`, (error, stdout) => {
                if (stdout && port >= 3002) {
                    const pids = stdout.trim().split('\n').filter(pid => pid);
                    pids.forEach(pid => {
                        console.log(`🔥 Killing process (PID: ${pid}) on port ${port}`);
                        exec(`kill -9 ${pid}`, () => {});
                    });
                    setTimeout(() => {
                        console.log(`✅ Port ${port} should now be free`);
                        resolve();
                    }, 1000);
                } else {
                    console.log(`✅ Port ${port} is free`);
                    resolve();
                }
            });
        }
    });
}

// Main function
async function startDev() {
    try {
        // Kill processes on our designated ports (avoiding 3000/3001 to not interfere with other projects)
        const ports = [3002, 3003, 3004, 3005];
        
        for (const port of ports) {
            await killProcessOnPort(port);
        }
        
        // Clean build cache
        console.log('🧹 Cleaning build cache...');
        const nextDir = path.join(__dirname, '..', '.next');
        if (fs.existsSync(nextDir)) {
            try {
                // Use recursive force delete with more robust error handling
                const { execSync } = require('child_process');
                const isWindows = process.platform === 'win32';
                
                if (isWindows) {
                    execSync(`rmdir /s /q "${nextDir}"`, { stdio: 'ignore' });
                } else {
                    execSync(`rm -rf "${nextDir}"`, { stdio: 'ignore' });
                }
                console.log('✅ Cleared .next cache');
            } catch (error) {
                // If that fails, try the Node.js method
                try {
                    fs.rmSync(nextDir, { recursive: true, force: true, maxRetries: 3, retryDelay: 100 });
                    console.log('✅ Cleared .next cache');
                } catch (fallbackError) {
                    console.log('⚠️ Could not clear .next cache, continuing anyway...');
                }
            }
        }
        
        // Set preferred port to 3002 to avoid conflict with other projects
        process.env.PORT = '3002';
        
        console.log('🚀 Starting Next.js development server...');
        console.log('Press Ctrl+C to stop the server');
        
        // Start development server
        const npmProcess = spawn('npm', ['run', 'dev'], {
            stdio: 'inherit',
            shell: true,
            cwd: path.join(__dirname, '..')
        });
        
        // Handle process termination
        process.on('SIGINT', () => {
            console.log('\n🛑 Shutting down development server...');
            npmProcess.kill('SIGINT');
            process.exit(0);
        });
        
        npmProcess.on('error', (error) => {
            console.error('Error starting development server:', error);
            process.exit(1);
        });
        
    } catch (error) {
        console.error('Error:', error);
        process.exit(1);
    }
}

startDev();