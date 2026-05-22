@echo off
REM Script para limpiar la base de datos PickEm

echo.
echo ========================================
echo   Limpiando Base de Datos PickEm
echo ========================================
echo.

REM Configurar contraseña de PostgreSQL
set PGPASSWORD=Contrasena14.

REM Eliminar BD
echo Eliminando base de datos...
psql -U postgres -h localhost -p 5433 -c "DROP DATABASE IF EXISTS \"PickEm\";" 2>nul

echo ✓ Base de datos eliminada
echo.
pause
