Set WshShell = CreateObject("WScript.Shell")
Set fso = CreateObject("Scripting.FileSystemObject")

' Get current directory where this script lives
scriptDir = fso.GetParentFolderName(WScript.ScriptFullName)

' Check if node server is already running on port 3000
On Error Resume Next
Set http = CreateObject("MSXML2.XMLHTTP")
http.Open "GET", "http://localhost:3000/api/health", False
http.Send

If http.Status <> 200 Then
    ' Start Node backend server completely hidden in the background (0 = hidden)
    WshShell.CurrentDirectory = scriptDir
    WshShell.Run "cmd /c node backend/server.js", 0, False
    WScript.Sleep 2500
End If

' Locate Edge or Chrome for dedicated App Mode
edgePath = "C:\Program Files (x86)\Microsoft\Edge\Application\msedge.exe"
chromePath = "C:\Program Files\Google\Chrome\Application\chrome.exe"

browserExe = "msedge"
If fso.FileExists(edgePath) Then
    browserExe = """" & edgePath & """"
ElseIf fso.FileExists(chromePath) Then
    browserExe = """" & chromePath & """"
End If

' Launch Senorita AI in Dedicated App Mode (No tabs, no address bar, autoplay unblocked, zero-click mic)
appCmd = browserExe & " --app=http://localhost:3000 --autoplay-policy=no-user-gesture-required --use-fake-ui-for-media-stream"
WshShell.Run appCmd, 1, False
