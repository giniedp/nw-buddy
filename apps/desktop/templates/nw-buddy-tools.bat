@echo off
rem Runs bin\nwbt.exe in this folder: it reads .env from here and keeps its files in .nwbt
setlocal
pushd "%~dp0"
if "%~1"=="" (
  bin\nwbt.exe serve
) else (
  bin\nwbt.exe %*
)
set code=%errorlevel%
popd
pause
exit /b %code%
