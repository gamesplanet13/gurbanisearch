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
}
'@
    $edgeArguments = '--user-data-dir="' + $Profile + '" --no-first-run --start-fullscreen --new-window "' + $Url + '"'
    $process = Start-Process -FilePath $Edge -ArgumentList $edgeArguments -PassThru
    for ($i=0; $i -lt 80 -and !$process.HasExited -and $process.MainWindowHandle -eq 0; $i++) {
        Start-Sleep -Milliseconds 125
        $process.Refresh()
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
        } elseif ($owner -eq $process.Id -and ([GurbaniWindow]::GetAsyncKeyState(27) -band 0x8000)) {
            [void][GurbaniWindow]::PostMessage($foreground,0x10,[IntPtr]::Zero,[IntPtr]::Zero)
        }
        if ($window -eq 0) { break }
        Start-Sleep -Milliseconds 35
    }
} finally {
    if ($shortcutUpdate) { Remove-Job -Job $shortcutUpdate -Force -ErrorAction SilentlyContinue }
    $mutex.ReleaseMutex()
    $mutex.Dispose()
}
