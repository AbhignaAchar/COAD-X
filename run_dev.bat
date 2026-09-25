@echo off
echo Starting COAD-X Development Server...
set ELECTRON_RUN_AS_NODE=1
"C:\Users\user\AppData\Local\Programs\Microsoft VS Code\Code.exe" ".\node_modules\vite\bin\vite.js" --host --port 5173
pause
