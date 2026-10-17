@echo off
title Fast Drive 3D
echo ============================================================
echo           FAST DRIVE 3D - Poyga O'yini Ishga Tushmoqda...
echo ============================================================
echo.
echo Brauzerda ochilmoqda: http://localhost:8000
echo O'yinni to'xtatish uchun ushbu oynani yoping yoki Ctrl+C bosing.
echo.

start http://localhost:8000
python -m http.server 8000
