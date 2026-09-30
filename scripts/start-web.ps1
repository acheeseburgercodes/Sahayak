# Starts the Vite dev server detached, with a temp dir inside the project.
# Tailwind 3 caches its compiled config (jiti) under os.tmpdir(); if that dir is a
# short-lived session scratch folder and gets reclaimed, every CSS request 500s
# with "[postcss] ENOENT ... tailwind.config.js.<hash>.js".
$root = Split-Path -Parent $PSScriptRoot
$tmp = Join-Path $root 'node_modules\.cache\tmp'
New-Item -ItemType Directory -Force -Path $tmp | Out-Null
$env:TMPDIR = $tmp
$env:TMP = $tmp
$env:TEMP = $tmp
Start-Process -FilePath 'cmd.exe' -ArgumentList '/c', 'npm run dev:web > web.log 2>&1' -WorkingDirectory $root -WindowStyle Hidden
