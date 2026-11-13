function Get-GurbaniDisplayCode($Directory, $Role) {
    [void][IO.Directory]::CreateDirectory($Directory)
    $path = Join-Path $Directory "$Role.code"
    $code = if (Test-Path -LiteralPath $path) { [IO.File]::ReadAllText($path).Trim() }
    if ([string]$code -notmatch '^[0-9]{5}$') {
        $otherRole = if ($Role -eq 'projection') { 'book' } else { 'projection' }
        $otherPath = Join-Path $Directory "$otherRole.code"
        $otherCode = if (Test-Path -LiteralPath $otherPath) { [IO.File]::ReadAllText($otherPath).Trim() }
        do { $code = [string](Get-Random -Minimum 10000 -Maximum 100000) } while ($code -eq $otherCode)
        [IO.File]::WriteAllText($path, $code)
    }
    return $code
}

function Open-GurbaniDiscovery {
    $socket = New-Object Net.Sockets.UdpClient
    try {
        $socket.Client.ExclusiveAddressUse = $true
        $socket.Client.Bind((New-Object Net.IPEndPoint([Net.IPAddress]::Any, 46823)))
        return $socket
    } catch [Net.Sockets.SocketException] {
        $socket.Dispose()
    }
}

function Send-GurbaniDiscoveryReplies($Socket, $Directory) {
    $sender = New-Object Net.IPEndPoint([Net.IPAddress]::Any, 0)
    # Bound the work per window iteration so incoming traffic cannot stall the UI.
    for ($i = 0; $i -lt 8 -and $Socket.Available -gt 0; $i++) {
        $request = $Socket.Receive([ref]$sender)
        $query = [Text.Encoding]::UTF8.GetString($request)
        if ($query -cnotmatch '^GURBANI_FIND_V1:([a-f0-9-]{36})$') { continue }
        $nonce = $Matches[1]
        foreach ($role in @('projection', 'book')) {
            $path = Join-Path $Directory "$role.active"
            try {
                $record = [IO.File]::ReadAllText($path) | ConvertFrom-Json -ErrorAction Stop
                $window = Get-Process -Id $record.windowPid -ErrorAction Stop
                if ($window.StartTime.ToUniversalTime().Ticks.ToString() -ne $record.windowStart -or
                    $window.MainWindowHandle -eq 0 -or $record.code -notmatch '^[0-9]{5}$') { continue }
                $label = if ($role -eq 'book') { 'Granth View' } else { 'Projection' }
                $reply = @{type='GURBANI_DISPLAY_V1'; nonce=$nonce; code=$record.code
                    name="$env:COMPUTERNAME - $label"; role=$role} | ConvertTo-Json -Compress
                $bytes = [Text.Encoding]::UTF8.GetBytes($reply)
                [void]$Socket.Send($bytes, $bytes.Length, $sender)
            } catch { }
        }
    }
}
