[CmdletBinding()]
param(
    [string]$InstallDir = "$env:USERPROFILE\StorePulse",
    [switch]$NoShortcut
)

$ErrorActionPreference = "Stop"

function Assert-Admin {
    $current = New-Object Security.Principal.WindowsPrincipal([Security.Principal.WindowsIdentity]::GetCurrent())
    if (-not $current.IsInRole([Security.Principal.WindowsBuiltinRole]::Administrator)) {
        throw "Run this in an elevated PowerShell window (Right click → Run as Administrator)."
    }
}

function Ensure-Winget {
    if (-not (Get-Command winget -ErrorAction SilentlyContinue)) {
        throw "winget is not available. Install 'App Installer' from the Microsoft Store and re-run this script."
    }
}

function Install-Dep {
    param(
        [string]$Name,
        [string]$Command,
        [string]$WingetId,
        [string]$OverrideArgs
    )

    if ($Command -and (Get-Command $Command -ErrorAction SilentlyContinue)) {
        Write-Host "✅ $Name already installed"
        return
    }

    if ($WingetId -eq "Microsoft.VisualStudio.2022.BuildTools" -and (Test-Path "${env:ProgramFiles(x86)}\Microsoft Visual Studio\2022\BuildTools")) {
        Write-Host "✅ $Name already installed"
        return
    }

    $args = @("install", "-e", "--id", $WingetId, "--accept-package-agreements", "--accept-source-agreements")
    if ($OverrideArgs) {
        $args += @("--override", $OverrideArgs)
    } else {
        $args += @("--silent")
    }

    Write-Host "⬇️  Installing $Name..."
    & winget @args
    if ($LASTEXITCODE -ne 0) {
        Write-Warning "$Name install returned exit code $LASTEXITCODE. Install manually if it is still missing."
    }
}

function Ensure-Directory {
    param([string]$Path)
    if (-not (Test-Path $Path)) {
        New-Item -ItemType Directory -Path $Path | Out-Null
    }
}

Write-Host "🚀 StorePulse Windows One-Command Installer" -ForegroundColor Cyan
Write-Host "==========================================" -ForegroundColor Cyan
Write-Host ""

Assert-Admin
Ensure-Winget

$InstallDir = [System.IO.Path]::GetFullPath($InstallDir)
Write-Host "📂 Install location: $InstallDir" -ForegroundColor Yellow

Write-Host ""
Write-Host "📋 Installing prerequisites (Git, Python 3.11, Node.js 20 LTS, Rust, Build Tools, WebView2)..." -ForegroundColor Yellow
Install-Dep -Name "Git" -Command "git" -WingetId "Git.Git"
Install-Dep -Name "Python 3.11" -Command "python" -WingetId "Python.Python.3.11"
Install-Dep -Name "Node.js 20 LTS" -Command "node" -WingetId "OpenJS.NodeJS.LTS"
Install-Dep -Name "Rust toolchain (rustup)" -Command "rustup" -WingetId "Rustlang.Rustup"
Install-Dep -Name "Microsoft C++ Build Tools 2022" -WingetId "Microsoft.VisualStudio.2022.BuildTools" -OverrideArgs "--add Microsoft.VisualStudio.Workload.VCTools --includeRecommended --passive --norestart"
Install-Dep -Name "Microsoft Edge WebView2 Runtime" -WingetId "Microsoft.EdgeWebView2Runtime"

$gitCmd = $null
try {
    $gitCmd = (Get-Command git -ErrorAction Stop).Source
} catch {
    $possibleGit = "C:\Program Files\Git\bin\git.exe"
    if (Test-Path $possibleGit) {
        $gitCmd = $possibleGit
    } else {
        throw "git is not available. Close and reopen PowerShell or install Git manually."
    }
}

$pythonCmd = $null
try {
    $pythonCmd = (Get-Command python -ErrorAction Stop).Source
} catch {
    $possiblePython = Join-Path $env:LOCALAPPDATA "Programs\Python\Python311\python.exe"
    if (Test-Path $possiblePython) {
        $pythonCmd = $possiblePython
    } else {
        throw "python is not available. Close and reopen PowerShell or install Python manually."
    }
}

Write-Host ""
Write-Host "📦 Cloning or updating StorePulse..." -ForegroundColor Yellow
Ensure-Directory -Path $InstallDir

$repoUrl = "https://github.com/shenzc7/StorePulse.git"
if (Test-Path (Join-Path $InstallDir ".git")) {
    Write-Host "   Updating existing clone..."
    & $gitCmd -C $InstallDir pull
} elseif ((Get-ChildItem -Force $InstallDir | Measure-Object).Count -gt 0) {
    throw "Install directory is not empty and not a git repo. Choose a different -InstallDir or clean the folder."
} else {
    & $gitCmd clone $repoUrl $InstallDir
}

Write-Host ""
Write-Host "📚 Setting up Python environment..." -ForegroundColor Yellow
$venvPath = Join-Path $InstallDir "api_venv"
if (-not (Test-Path $venvPath)) {
    & $pythonCmd -m venv $venvPath
}
$venvPython = Join-Path $venvPath "Scripts\python.exe"
& $venvPython -m pip install --upgrade pip
& $venvPython -m pip install -r (Join-Path $InstallDir "api\requirements.txt")

Write-Host ""
Write-Host "🎨 Installing frontend dependencies..." -ForegroundColor Yellow
$npmCmd = $null
try {
    $npmCmd = (Get-Command npm -ErrorAction Stop).Source
} catch {
    $possibleNpm = Join-Path $env:ProgramFiles "nodejs\npm.cmd"
    if (Test-Path $possibleNpm) {
        $npmCmd = $possibleNpm
    } else {
        throw "npm is not available. Close and reopen PowerShell or install Node.js manually."
    }
}
Push-Location (Join-Path $InstallDir "src")
& $npmCmd install
Pop-Location

if (-not $NoShortcut) {
    Write-Host ""
    Write-Host "🖇️  Creating desktop shortcut..." -ForegroundColor Yellow
    $shortcutTarget = Join-Path $InstallDir "scripts\launch_storepulse_windows.ps1"
    if (-not (Test-Path $shortcutTarget)) {
        Write-Warning "Launcher script not found at $shortcutTarget. Make sure your clone is up to date."
    } else {
        $desktop = [Environment]::GetFolderPath("Desktop")
        $shortcutPath = Join-Path $desktop "StorePulse.lnk"
        $shell = New-Object -ComObject WScript.Shell
        $shortcut = $shell.CreateShortcut($shortcutPath)
        $shortcut.TargetPath = "$env:SystemRoot\System32\WindowsPowerShell\v1.0\powershell.exe"
        $shortcut.Arguments = "-ExecutionPolicy Bypass -NoProfile -File `"$shortcutTarget`""
        $shortcut.WorkingDirectory = $InstallDir
        $iconPath = Join-Path $InstallDir "src\src-tauri\icons\icon.ico"
        if (Test-Path $iconPath) {
            $shortcut.IconLocation = $iconPath
        }
        $shortcut.Save()
        Write-Host "   ✅ Desktop shortcut created: $shortcutPath" -ForegroundColor Green
    }
}

Write-Host ""
Write-Host "✅ Setup complete!" -ForegroundColor Green
Write-Host "➡️  Launch the app with the 'StorePulse' desktop icon, or run: powershell -ExecutionPolicy Bypass -File `"$InstallDir\scripts\launch_storepulse_windows.ps1`""
Write-Host ""
Write-Host "If this is a fresh install, the first Tauri build can take a few minutes while Rust compiles." -ForegroundColor Gray
