# Read-only health probe for the Sahayak dev stack (loopback GETs only).
# Usage: powershell -NoProfile -ExecutionPolicy Bypass -File scripts\check-status.ps1
$ErrorActionPreference = 'Continue'
$root = Split-Path -Parent $PSScriptRoot
$probes = @(
    @{ name = 'web';   url = 'http://127.0.0.1:5174/' },
    @{ name = 'css';   url = 'http://127.0.0.1:5174/src/index.css' },
    @{ name = 'proxy'; url = 'http://127.0.0.1:8787/health' }
)
foreach ($p in $probes) {
    try {
        $r = Invoke-WebRequest -Uri $p.url -UseBasicParsing -TimeoutSec 10
        $body = if ($p.name -eq 'proxy') { " $($r.Content)" } else { '' }
        Write-Host ("{0} {1}{2}" -f $p.name, $r.StatusCode, $body)
    } catch {
        Write-Host ("{0} FAIL {1}" -f $p.name, $_.Exception.Message)
    }
}
foreach ($a in @('release\Sahayak-win32-x64\Sahayak.exe', 'release\Sahayak-android-debug.apk')) {
    $f = Join-Path $root $a
    if (Test-Path $f) { $i = Get-Item $f; Write-Host ("artifact {0} {1} bytes {2}" -f $a, $i.Length, $i.LastWriteTime) }
    else { Write-Host "artifact MISSING $a" }
}
$log = Join-Path $root 'web.log'
if (Test-Path $log) {
    $hits = Get-Content $log -Tail 200 | Select-String -Pattern 'error|ENOENT| 500 '
    Write-Host ("web.log recent error lines: {0}" -f @($hits).Count)
    $hits | Select-Object -Last 3 | ForEach-Object { Write-Host "  $_" }
}
