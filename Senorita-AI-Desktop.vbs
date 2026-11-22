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
    WScript.Sleep 2000
End If

' Launch Senorita AI in Dedicated App Mode (No address bar, no tabs, standalone window)
appCmd = "msedge --app=http://localhost:3000"
WshShell.Run appCmd, 1, False
