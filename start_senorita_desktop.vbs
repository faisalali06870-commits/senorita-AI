Set WshShell = CreateObject("WScript.Shell")
Set fso = CreateObject("Scripting.FileSystemObject")
strDir = fso.GetParentFolderName(WScript.ScriptFullName)

' 1. Start Node backend server completely silently in the background (0 = Hidden, no black CMD window)
WshShell.CurrentDirectory = strDir & "\backend"
WshShell.Run "cmd.exe /c node server.js", 0, False

' 2. Wait 2.5 seconds for backend to start
WScript.Sleep 2500

' 3. Launch Senorita as a Native Windows Desktop Application (No address bar, no tabs)
chromePath = "C:\Program Files\Google\Chrome\Application\chrome.exe"
edgePath = "C:\Program Files (x86)\Microsoft\Edge\Application\msedge.exe"

If fso.FileExists(chromePath) Then
    appCmd = """" & chromePath & """ --app=http://localhost:3000 --window-size=1280,840 --window-position=center"
ElseIf fso.FileExists(edgePath) Then
    appCmd = """" & edgePath & """ --app=http://localhost:3000 --window-size=1280,840 --window-position=center"
Else
    appCmd = "cmd /c start http://localhost:3000"
End If

WshShell.Run appCmd, 1, False
