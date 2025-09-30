# PowerShell script to kill processes on ports and start dev server
param(
    [int]$Port = 3002
)

Write-Host "🔍 Checking for processes on Real Estate ROI app ports..." -ForegroundColor Yellow

# Function to check if process is Next.js related to this project
function Is-NextJsProcess {
    param([int]$ProcessId)
    
    try {
        $process = Get-Process -Id $ProcessId -ErrorAction SilentlyContinue
        if ($process -and $process.CommandLine) {
            $cmdLine = $process.CommandLine
            # Check if it's our specific project or a generic Next.js process on our target ports
            return ($cmdLine -like "*real-estate-investment-roi-app*" -or 
                   ($cmdLine -like "*next*dev*" -and ($cmdLine -like "*3002*" -or $cmdLine -like "*3003*" -or $cmdLine -like "*3004*")))
        }
        return $false
    } catch {
        return $false
    }
}

# Function to kill process on a specific port
function Kill-ProcessOnPort {
    param([int]$PortNumber)
    
    try {
        # Find process using the port
        $process = Get-NetTCPConnection -LocalPort $PortNumber -ErrorAction SilentlyContinue | Where-Object { $_.State -eq "Listen" }
        
        if ($process) {
            $pid = $process.OwningProcess
            $processName = (Get-Process -Id $pid -ErrorAction SilentlyContinue).ProcessName
            
            # Only kill if it's related to our project or on our designated ports
            if ($PortNumber -ge 3002 -or (Is-NextJsProcess -ProcessId $pid)) {
                Write-Host "🔥 Killing process '$processName' (PID: $pid) on port $PortNumber" -ForegroundColor Red
                Stop-Process -Id $pid -Force -ErrorAction SilentlyContinue
                Start-Sleep -Seconds 1
                
                # Verify the process is killed
                $stillRunning = Get-NetTCPConnection -LocalPort $PortNumber -ErrorAction SilentlyContinue | Where-Object { $_.State -eq "Listen" }
                if (!$stillRunning) {
                    Write-Host "✅ Port $PortNumber is now free" -ForegroundColor Green
                } else {
                    Write-Host "⚠️  Port $PortNumber may still be in use" -ForegroundColor Yellow
                }
            } else {
                Write-Host "ℹ️  Skipping process on port $PortNumber (not our project)" -ForegroundColor Gray
            }
        } else {
            Write-Host "✅ Port $PortNumber is free" -ForegroundColor Green
        }
    } catch {
        Write-Host "ℹ️  No process found on port $PortNumber" -ForegroundColor Gray
    }
}

# Kill processes on our designated ports (avoiding port 3000 to not interfere with other projects)
$ports = @(3002, 3003, 3004, 3005)
foreach ($p in $ports) {
    Kill-ProcessOnPort -PortNumber $p
}

# Also kill any node processes that might be running our specific Next.js app
Write-Host "🔍 Checking for Real Estate ROI app processes..." -ForegroundColor Yellow
$nextProcesses = Get-Process -Name "node" -ErrorAction SilentlyContinue | Where-Object { 
    $_.CommandLine -like "*real-estate-investment-roi-app*" -or
    ($_.CommandLine -like "*next*dev*" -and (
        $_.CommandLine -like "*3002*" -or
        $_.CommandLine -like "*3003*" -or
        $_.CommandLine -like "*3004*" -or
        $_.CommandLine -like "*3005*"
    ))
}

if ($nextProcesses) {
    foreach ($proc in $nextProcesses) {
        Write-Host "🔥 Killing Real Estate ROI app process (PID: $($proc.Id))" -ForegroundColor Red
        Stop-Process -Id $proc.Id -Force -ErrorAction SilentlyContinue
    }
    Start-Sleep -Seconds 2
}

Write-Host "🧹 Cleaning build cache..." -ForegroundColor Yellow
if (Test-Path ".next") {
    Remove-Item -Recurse -Force ".next" -ErrorAction SilentlyContinue
    Write-Host "✅ Cleared .next cache" -ForegroundColor Green
}

Write-Host "🚀 Starting Next.js development server..." -ForegroundColor Green
Write-Host "Press Ctrl+C to stop the server" -ForegroundColor Gray

# Set preferred port
$env:PORT = $Port

# Start the development server
npm run dev