# Build the Sahayak Android debug APK (Capacitor 7).
# Usage: powershell -NoProfile -ExecutionPolicy Bypass -File scripts\build-android.ps1
# 'Continue': in PS5, native stderr merged via 2>&1 becomes an ErrorRecord and 'Stop' would abort.
$ErrorActionPreference = 'Continue'
$root = Split-Path -Parent $PSScriptRoot
$android = Join-Path $root 'android'
$log = Join-Path $android 'build.log'
$apk = Join-Path $android 'app\build\outputs\apk\debug\app-debug.apk'
$releaseDir = Join-Path $root 'release'
$outApk = Join-Path $releaseDir 'Sahayak-android-debug.apk'

Set-Location $root
Write-Host '== vite build'
cmd /c "npx vite build" 2>&1 | Select-Object -Last 5
if ($LASTEXITCODE -ne 0) { throw "vite build failed ($LASTEXITCODE)" }

Write-Host '== cap sync android'
cmd /c "npx cap sync android" 2>&1 | Select-Object -Last 8
if ($LASTEXITCODE -ne 0) { throw "cap sync failed ($LASTEXITCODE)" }

function Invoke-Gradle([string[]]$extra) {
    Push-Location $android
    try {
        $gradleArgs = @('assembleDebug', '--no-daemon', '--console=plain') + $extra
        Write-Host "== gradlew.bat $($gradleArgs -join ' ')  (log: $log)"
        # cmd /c keeps stdout/stderr on a file, never on the tool pipe.
        cmd /c ".\gradlew.bat $($gradleArgs -join ' ') > `"$log`" 2>&1"
        return $LASTEXITCODE
    } finally { Pop-Location }
}

if (Test-Path $apk) { Remove-Item $apk -Force }
$code = Invoke-Gradle @('--offline')
if ($code -ne 0) {
    $txt = Get-Content $log -Raw
    if ($txt -match 'offline mode|No cached version|Could not resolve|Could not download') {
        Write-Host '== offline build missed dependencies; retrying online'
        $code = Invoke-Gradle @()
    }
}
if ($code -ne 0 -or -not (Test-Path $apk)) {
    Write-Host "== gradle FAILED (exit $code). Tail of build.log:"
    Get-Content $log -Tail 40
    exit 1
}

New-Item -ItemType Directory -Force -Path $releaseDir | Out-Null
Copy-Item $apk $outApk -Force
$size = (Get-Item $outApk).Length
Write-Host ("== APK: {0}  ({1:N2} MB, {2} bytes)" -f $outApk, ($size / 1MB), $size)
