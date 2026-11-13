Option Explicit
Dim shell, files, edge, candidate, role, page, profile, url, appData, timestamp, nowTime
Set shell = CreateObject("WScript.Shell")
Set files = CreateObject("Scripting.FileSystemObject")
If WScript.Arguments.Count <> 1 Then WScript.Quit 1
role = LCase(WScript.Arguments(0))
Select Case role
    Case "controller": page = "index.html"
    Case "projection": page = "projection.html"
    Case "book": page = "book.html"
    Case "camera": page = "camera.html"
    Case Else: WScript.Quit 1
End Select
appData = shell.ExpandEnvironmentStrings("%LOCALAPPDATA%")
For Each candidate In Array( _
    "%ProgramFiles(x86)%\Microsoft\Edge\Application\msedge.exe", _
    "%ProgramFiles%\Microsoft\Edge\Application\msedge.exe", _
    "%LOCALAPPDATA%\Microsoft\Edge\Application\msedge.exe")
    candidate = shell.ExpandEnvironmentStrings(candidate)
    If files.FileExists(candidate) Then
        edge = candidate
        Exit For
    End If
Next
If Len(edge) = 0 Then
    MsgBox "Microsoft Edge is needed to open Gurbani. Install Edge, then try this shortcut again.", vbExclamation, "Gurbani"
    WScript.Quit 1
End If
profile = appData & "\Gurbani\Profiles\" & role
nowTime = Now
timestamp = Year(nowTime) & "-" & Month(nowTime) & "-" & Day(nowTime) & "-" & Hour(nowTime) & "-" & Minute(nowTime) & "-" & Second(nowTime)
url = "https://gamesplanet13.github.io/gurbanisearch/" & page & "?desktop=windows&launch=" & timestamp
shell.Run Quote(edge) & " --user-data-dir=" & Quote(profile) & " --no-first-run --start-fullscreen --app=" & Quote(url), 1, False

Function Quote(value)
    Quote = Chr(34) & value & Chr(34)
End Function
