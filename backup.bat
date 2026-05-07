@echo off
set PGPASSWORD=postgres123
set BACKUP_DIR=C:\digital-mec\backups
if not exist "%BACKUP_DIR%" mkdir "%BACKUP_DIR%"

set FILENAME=afyamec_%date:~10,4%%date:~4,2%%date:~7,2%.sql

echo Starting AfyaMEC database backup...
echo Saving to: %BACKUP_DIR%\%FILENAME%

"C:\Program Files\PostgreSQL\18\bin\pg_dump.exe" -U postgres -d digital_mec > "%BACKUP_DIR%\%FILENAME%"

if %errorlevel% == 0 (
    echo.
    echo SUCCESS - Backup saved: %FILENAME%
) else (
    echo.
    echo FAILED - Check password or PostgreSQL path
    echo Try changing PGPASSWORD= in this file
)

echo.
pause