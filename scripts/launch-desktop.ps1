# Launch the packaged Sahayak desktop app detached (WMI, so no pipe handles are inherited).
# Usage: powershell -NoProfile -ExecutionPolicy Bypass -File scripts\launch-desktop.ps1
$root = Split-Path -Parent $PSScriptRoot
$exe = Join-Path $root 'release\Sahayak-win32-x64\Sahayak.exe'
if (-not (Test-Path $exe)) { Write-Host "MISSING $exe"; exit 1 }
$running = Get-Process -Name Sahayak -ErrorAction SilentlyContinue
if ($running) { Write-Host ("already running: pid {0}" -f (($running | ForEach-Object Id) -join ',')); exit 0 }
$cwd = Split-Path -Parent $exe
$r = Invoke-CimMethod -ClassName Win32_Process -MethodName Create -Arguments @{ CommandLine = "`"$exe`""; CurrentDirectory = $cwd }
Write-Host ("launch rc={0} pid={1}" -f $r.ReturnValue, $r.ProcessId)
Start-Sleep -Seconds 6
$p = Get-Process -Name Sahayak -ErrorAction SilentlyContinue
if ($p) {
    $win = $p | Where-Object { $_.MainWindowTitle } | Select-Object -First 1
    Write-Host ("processes={0} window='{1}'" -f @($p).Count, $win.MainWindowTitle)
} else { Write-Host 'NOT RUNNING after 6s' }
