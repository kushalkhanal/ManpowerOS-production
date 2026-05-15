@echo off
echo ================================
echo Create Super Admin User
echo ================================
echo.

cd /d %~dp0server

echo Running seed script...
node seed-superadmin.js

echo.
pause
