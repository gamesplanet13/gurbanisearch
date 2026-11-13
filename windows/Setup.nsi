Unicode true
Name "Gurbani for Windows"
OutFile "Gurbani-Windows-Setup.exe"
InstallDir "$LOCALAPPDATA\Programs\Gurbani"
RequestExecutionLevel user
SetCompressor /SOLID lzma
Icon "controller.ico"
UninstallIcon "controller.ico"
VIProductVersion "1.0.1.0"
VIAddVersionKey "ProductName" "Gurbani for Windows"
VIAddVersionKey "FileDescription" "Gurbani Windows Setup"
VIAddVersionKey "LegalCopyright" "Copyright Rajinder Singh"
VIAddVersionKey "FileVersion" "1.0.1.0"

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
  File "controller.ico"
  File "projection.ico"
  File "book.ico"
  File "camera.ico"
  CreateDirectory "$SMPROGRAMS\Gurbani"
  !insertmacro AddShortcut "Gurbani Controller" "controller"
  !insertmacro AddShortcut "Gurbani Projection" "projection"
  !insertmacro AddShortcut "Gurbani Book View" "book"
  !insertmacro AddShortcut "Gurbani Camera" "camera"
  WriteUninstaller "$INSTDIR\Uninstall.exe"
  WriteRegStr HKCU "Software\Microsoft\Windows\CurrentVersion\Uninstall\Gurbani" "DisplayName" "Gurbani for Windows"
  WriteRegStr HKCU "Software\Microsoft\Windows\CurrentVersion\Uninstall\Gurbani" "UninstallString" '"$INSTDIR\Uninstall.exe"'
  WriteRegStr HKCU "Software\Microsoft\Windows\CurrentVersion\Uninstall\Gurbani" "DisplayVersion" "1.0.1"
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
  !insertmacro RemoveShortcut "Gurbani Controller" "controller"
  !insertmacro RemoveShortcut "Gurbani Projection" "projection"
  !insertmacro RemoveShortcut "Gurbani Book View" "book"
  !insertmacro RemoveShortcut "Gurbani Camera" "camera"
  RMDir "$SMPROGRAMS\Gurbani"
  Delete "$INSTDIR\Launch.vbs"
  Delete "$INSTDIR\Uninstall.exe"
  RMDir "$INSTDIR"
  DeleteRegKey HKCU "Software\Microsoft\Windows\CurrentVersion\Uninstall\Gurbani"
SectionEnd
