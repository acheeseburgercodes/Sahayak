# Starts the Sarvam proxy detached (port 8787), logging to proxy.log.
$root = Split-Path -Parent $PSScriptRoot
Start-Process -FilePath 'cmd.exe' -ArgumentList '/c', 'npm run dev:proxy > proxy.log 2>&1' -WorkingDirectory $root -WindowStyle Hidden
