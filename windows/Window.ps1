param([string]$Edge, [string]$Profile, [string]$Url, [string]$Role)
$mutex = New-Object Threading.Mutex($false, "Local\Gurbani-$Role")
try { $locked = $mutex.WaitOne(0) } catch [Threading.AbandonedMutexException] { $locked = $true }
if (!$locked) { $mutex.Dispose(); exit }
try {
    Add-Type @'
using System;
using System.Runtime.InteropServices;
public static class GurbaniWindow {
    [DllImport("user32.dll")] public static extern IntPtr GetForegroundWindow();
    [DllImport("user32.dll")] public static extern short GetAsyncKeyState(int key);
    [DllImport("user32.dll")] public static extern uint GetWindowThreadProcessId(IntPtr hwnd, out uint pid);
    [DllImport("user32.dll")] public static extern bool PostMessage(IntPtr hwnd, uint msg, IntPtr w, IntPtr l);
    [DllImport("kernel32.dll", SetLastError=true)] public static extern uint SetThreadExecutionState(uint esFlags);
}
'@
    # Keep display and system awake only for the life of this Windows app.
    [void][GurbaniWindow]::SetThreadExecutionState([uint32]2147483651)
    if ($Role -in @('projection', 'book')) {
        . (Join-Path $PSScriptRoot 'Discovery.ps1')
        $discoveryDirectory = Join-Path $env:LOCALAPPDATA 'Gurbani\Discovery'
        $codeMutex = New-Object Threading.Mutex($false, 'Local\Gurbani-DisplayCode')
        try {
            try { $codeLocked = $codeMutex.WaitOne(2000) } catch [Threading.AbandonedMutexException] { $codeLocked = $true }
            if ($codeLocked) {
                $displayCode = Get-GurbaniDisplayCode $discoveryDirectory $Role
                if ($displayCode) { $Url += "#lanCode=$displayCode" }
            }
        } catch { } finally {
            if ($codeLocked) { $codeMutex.ReleaseMutex() }
            $codeMutex.Dispose()
        }
    }
    $edgeArguments = '--user-data-dir="' + $Profile + '" --no-first-run --start-fullscreen --new-window "' + $Url + '"'
    $process = Start-Process -FilePath $Edge -ArgumentList $edgeArguments -PassThru
    for ($i=0; $i -lt 80 -and !$process.HasExited -and $process.MainWindowHandle -eq 0; $i++) {
        Start-Sleep -Milliseconds 125
        $process.Refresh()
    }
    if ($displayCode -and !$process.HasExited -and $process.MainWindowHandle -ne 0) {
        $discoveryRecord = Join-Path $discoveryDirectory "$Role.active"
        @{code=$displayCode; windowPid=$process.Id; windowStart=$process.StartTime.ToUniversalTime().Ticks.ToString()} |
            ConvertTo-Json -Compress | Set-Content -LiteralPath $discoveryRecord -Encoding ASCII
        $nextDiscoveryBind = [DateTime]::MinValue
    }
    # Fetch display names only. The launch target and its role arguments stay local.
    $shortcutUpdate = Start-Job -ArgumentList $PSScriptRoot -ScriptBlock {
        param($InstallPath)
        try {
            $names = Invoke-RestMethod -Uri 'https://gamesplanet13.github.io/gurbanisearch/windows/shortcuts.json' -TimeoutSec 5
            $shell = New-Object -ComObject WScript.Shell
            $desktop = [Environment]::GetFolderPath('DesktopDirectory')
            $menu = Join-Path ([Environment]::GetFolderPath('Programs')) 'Gurbani'
            $target = Join-Path $env:SystemRoot 'System32\wscript.exe'
            foreach ($folder in @($desktop,$menu)) {
                [void][IO.Directory]::CreateDirectory($folder)
                foreach ($app in @('controller','projection','book','camera')) {
                    $name = [string]$names.$app
                    if ($name -notmatch '^Gurbani [A-Za-z ]{2,48}$') { continue }
                    $arguments = '"' + (Join-Path $InstallPath 'Launch.vbs') + '" ' + $app
                    $path = Join-Path $folder ($name + '.lnk')
                    if (Test-Path -LiteralPath $path) {
                        $existing = $shell.CreateShortcut($path)
                        if ($existing.TargetPath -ne $target -or $existing.Arguments -ne $arguments) { continue }
                    }
                    $shortcut = $shell.CreateShortcut($path)
                    $shortcut.TargetPath = $target
                    $shortcut.Arguments = $arguments
                    $shortcut.IconLocation = (Join-Path $InstallPath ($app + '.ico')) + ',0'
                    $shortcut.Save()
                    Get-ChildItem -LiteralPath $folder -Filter 'Gurbani *.lnk' | ForEach-Object {
                        if ($_.FullName -ne $path) {
                            $old = $shell.CreateShortcut($_.FullName)
                            if ($old.TargetPath -eq $target -and $old.Arguments -eq $arguments) {
                                Remove-Item -LiteralPath $_.FullName
                            }
                        }
                    }
                }
            }
        } catch { }
    }
    while (!$process.HasExited) {
        $process.Refresh()
        $window = $process.MainWindowHandle
        $foreground = [GurbaniWindow]::GetForegroundWindow()
        $owner = [uint32]0
        [void][GurbaniWindow]::GetWindowThreadProcessId($foreground,[ref]$owner)
        if ($process.MainWindowTitle -like 'Gurbani Windows Close*' -and $window -ne 0) {
            [void][GurbaniWindow]::PostMessage($window,0x10,[IntPtr]::Zero,[IntPtr]::Zero)
        } elseif ($Role -ne 'projection' -and $owner -eq $process.Id -and ([GurbaniWindow]::GetAsyncKeyState(27) -band 0x8000)) {
            [void][GurbaniWindow]::PostMessage($foreground,0x10,[IntPtr]::Zero,[IntPtr]::Zero)
        }
        if ($window -eq 0) { break }
        if ($discoveryRecord) {
            if (!$discoverySocket -and [DateTime]::UtcNow -ge $nextDiscoveryBind) {
                $discoverySocket = Open-GurbaniDiscovery
                $nextDiscoveryBind = [DateTime]::UtcNow.AddSeconds(1)
            }
            if ($discoverySocket) {
                try { Send-GurbaniDiscoveryReplies $discoverySocket $discoveryDirectory } catch [Net.Sockets.SocketException] { }
            }
        }
        Start-Sleep -Milliseconds 35
    }
} finally {
    try { [void][GurbaniWindow]::SetThreadExecutionState([uint32]2147483648) } catch {}
    if ($discoverySocket) { $discoverySocket.Dispose() }
    if ($discoveryRecord) { Remove-Item -LiteralPath $discoveryRecord -ErrorAction SilentlyContinue }
    if ($shortcutUpdate) { Remove-Job -Job $shortcutUpdate -Force -ErrorAction SilentlyContinue }
    $mutex.ReleaseMutex()
    $mutex.Dispose()
}
