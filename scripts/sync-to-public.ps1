Set-StrictMode -Version Latest
$ErrorActionPreference = "Stop"

$privateRoot = (Resolve-Path (Join-Path $PSScriptRoot "..")).Path
$publicRoot = "$privateRoot-public"
$currentRoot = (Resolve-Path ".").Path

function Stop-WithMessage {
  param([string]$Message)
  Write-Error $Message
  exit 1
}

function Assert-Path {
  param(
    [string]$Path,
    [string]$Label
  )
  if (-not (Test-Path -LiteralPath $Path)) {
    Stop-WithMessage "$Label does not exist: $Path"
  }
}

if ($currentRoot -ne $privateRoot) {
  Stop-WithMessage "Run this script from the private repository root: $privateRoot"
}

Assert-Path $privateRoot "Private repository"
Assert-Path $publicRoot "Public repository"
Assert-Path (Join-Path $privateRoot ".git") "Private git directory"
Assert-Path (Join-Path $publicRoot ".git") "Public git directory"

$gitStateMarkers = @(
  "rebase-merge",
  "rebase-apply",
  "MERGE_HEAD",
  "CHERRY_PICK_HEAD",
  "REVERT_HEAD",
  "BISECT_LOG"
)

foreach ($marker in $gitStateMarkers) {
  $markerPath = Join-Path (Join-Path $publicRoot ".git") $marker
  if (Test-Path -LiteralPath $markerPath) {
    Stop-WithMessage "Public repository is in the middle of a git operation ($marker). Resolve it before syncing."
  }
}

$publicStatus = git -C $publicRoot status --short
if ($LASTEXITCODE -ne 0) {
  Stop-WithMessage "Failed to read public repository git status."
}
if ($publicStatus) {
  Write-Host "Public repository is not clean. Sync is stopped to avoid overwriting local work." -ForegroundColor Yellow
  $publicStatus | ForEach-Object { Write-Host $_ }
  exit 1
}

$syncDirs = @("data", "public", "src", "docs", "scripts")
$excludeDirs = @("source-materials", "node_modules", ".next", ".git", ".tmp", ".playwright-cli")
$excludeFiles = @("*.log", ".next-dev-codex.log", ".next-dev-codex.err.log", "ch01_fatality_demo.log")

foreach ($dir in $syncDirs) {
  $source = Join-Path $privateRoot $dir
  $target = Join-Path $publicRoot $dir

  if (-not (Test-Path -LiteralPath $source)) {
    Write-Host "Skipping missing source directory: $source" -ForegroundColor Yellow
    continue
  }

  Write-Host "Syncing $dir ..."
  & robocopy $source $target /MIR /FFT /R:2 /W:2 /XD $excludeDirs /XF $excludeFiles /NFL /NDL /NP
  $code = $LASTEXITCODE

  if ($code -ge 8) {
    Stop-WithMessage "Robocopy failed while syncing $dir. Exit code: $code"
  }

  Write-Host "Robocopy completed for $dir with code $code."
}

$cleanupPaths = @(
  ".tmp",
  ".playwright-cli",
  ".next-dev-codex.log",
  ".next-dev-codex.err.log",
  "ch01_fatality_demo.log",
  "data\generated\jrjlx\full\framework-concise.json"
)

foreach ($relativePath in $cleanupPaths) {
  $fullPath = Join-Path $publicRoot $relativePath
  if (Test-Path -LiteralPath $fullPath) {
    $resolvedCleanupPath = (Resolve-Path -LiteralPath $fullPath).Path
    if (-not $resolvedCleanupPath.StartsWith($publicRoot)) {
      Stop-WithMessage "Refusing to remove path outside public repository: $resolvedCleanupPath"
    }
    Remove-Item -LiteralPath $resolvedCleanupPath -Recurse -Force
    Write-Host "Removed public-only excluded path: $relativePath"
  }
}

Set-Location $publicRoot
Write-Host ""
Write-Host "Public repository status:"
git status --short

Write-Host ""
Write-Host "Suggested next commands (run manually in the public repository):"
Write-Host "npm.cmd run validate:content"
Write-Host "npm.cmd run lint"
Write-Host "npm.cmd run build"
Write-Host 'git add data public src docs scripts'
Write-Host 'git commit -m "sync latest study platform updates"'
Write-Host "git push"
