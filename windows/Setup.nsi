Unicode true
Name "Gurbani for Windows"
OutFile "Gurbani-Windows-Setup.exe"
InstallDir "$LOCALAPPDATA\Programs\Gurbani"
RequestExecutionLevel user
SetCompressor /SOLID lzma
Icon "controller.ico"
UninstallIcon "controller.ico"
VIProductVersion "1.0.3.0"
VIAddVersionKey "ProductName" "Gurbani for Windows"
VIAddVersionKey "FileDescription" "Gurbani Windows Setup"
VIAddVersionKey "LegalCopyright" "Copyright Rajinder Singh"
VIAddVersionKey "FileVersion" "1.0.3.0"

Page instfiles
UninstPage uninstConfirm
UninstPage instfiles

!macro AddShortcut label role
  CreateShortCut "$DESKTOP\${label}.lnk" "$SYSDIR\wscript.exe" '"$INSTDIR\Launch.vbs" ${role}' "$INSTDIR\${role}.ico"
  CreateShortCut "$SMPROGRAMS\Gurbani\${label}.lnk" "$SYSDIR\wscript.exe" '"$INSTDIR\Launch.vbs" ${role}' "$INSTDIR\${role}.ico"
!macroend

Section "Gurbani"
  SetShellVarContext current
  SetOutPath "$INSTDIR"
  File "Launch.vbs"
  File "Window.ps1"
  File "Discovery.ps1"
  File "controller.ico"
  File "projection.ico"
  File "book.ico"
  File "camera.ico"
  CreateDirectory "$SMPROGRAMS\Gurbani"
  Delete "$DESKTOP\Gurbani Controller.lnk"
  Delete "$SMPROGRAMS\Gurbani\Gurbani Controller.lnk"
  !insertmacro AddShortcut "Gurbani Searching Control" "controller"
  Delete "$DESKTOP\Gurbani Projection.lnk"
  Delete "$SMPROGRAMS\Gurbani\Gurbani Projection.lnk"
  !insertmacro AddShortcut "Gurbani Searching Projection" "projection"
  Delete "$DESKTOP\Gurbani Book View.lnk"
  Delete "$SMPROGRAMS\Gurbani\Gurbani Book View.lnk"
  !insertmacro AddShortcut "Gurbani Granth View" "book"
  Delete "$DESKTOP\Gurbani Camera.lnk"
  Delete "$SMPROGRAMS\Gurbani\Gurbani Camera.lnk"
  !insertmacro AddShortcut "Gurbani Searching Camera" "camera"
  WriteUninstaller "$INSTDIR\Uninstall.exe"
  WriteRegStr HKCU "Software\Microsoft\Windows\CurrentVersion\Uninstall\Gurbani" "DisplayName" "Gurbani for Windows"
  WriteRegStr HKCU "Software\Microsoft\Windows\CurrentVersion\Uninstall\Gurbani" "UninstallString" '"$INSTDIR\Uninstall.exe"'
  WriteRegStr HKCU "Software\Microsoft\Windows\CurrentVersion\Uninstall\Gurbani" "DisplayVersion" "1.0.3"
  WriteRegDWORD HKCU "Software\Microsoft\Windows\CurrentVersion\Uninstall\Gurbani" "NoModify" 1
  WriteRegDWORD HKCU "Software\Microsoft\Windows\CurrentVersion\Uninstall\Gurbani" "NoRepair" 1
SectionEnd

!macro RemoveShortcut label role
  Delete "$DESKTOP\${label}.lnk"
  Delete "$SMPROGRAMS\Gurbani\${label}.lnk"
  Delete "$INSTDIR\${role}.ico"
!macroend

Section "Uninstall"
  SetShellVarContext current
  !insertmacro RemoveShortcut "Gurbani Searching Control" "controller"
  !insertmacro RemoveShortcut "Gurbani Searching Projection" "projection"
  !insertmacro RemoveShortcut "Gurbani Granth View" "book"
  !insertmacro RemoveShortcut "Gurbani Searching Camera" "camera"
  RMDir "$SMPROGRAMS\Gurbani"
  Delete "$INSTDIR\Launch.vbs"
  Delete "$INSTDIR\Window.ps1"
  Delete "$INSTDIR\Discovery.ps1"
  Delete "$INSTDIR\Uninstall.exe"
  RMDir "$INSTDIR"
  DeleteRegKey HKCU "Software\Microsoft\Windows\CurrentVersion\Uninstall\Gurbani"
SectionEnd
