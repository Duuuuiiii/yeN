$ErrorActionPreference = 'Stop'
$projectRoot = Split-Path $PSScriptRoot -Parent
$cacheRoot = 'E:\yeN\BuildCache'
New-Item -ItemType Directory -Path "$cacheRoot\temp" -Force | Out-Null
$env:TEMP = "$cacheRoot\temp"
$env:TMP = $env:TEMP
$env:npm_config_cache = "$cacheRoot\npm"
$env:ELECTRON_CACHE = "$cacheRoot\electron"
$env:ELECTRON_BUILDER_CACHE = "$cacheRoot\builder"
$env:ELECTRON_MIRROR = 'https://npmmirror.com/mirrors/electron/'
$env:ELECTRON_BUILDER_BINARIES_MIRROR = 'https://npmmirror.com/mirrors/electron-builder-binaries/'
Push-Location $projectRoot
try {
  node scripts/build.cjs
  if ($LASTEXITCODE) { throw 'Frontend build failed' }
  node node_modules/electron-builder/cli.js --win nsis portable --x64 --config.electronDist=node_modules/electron/dist --publish never
  if ($LASTEXITCODE) { throw 'Windows package build failed' }
} finally { Pop-Location }
