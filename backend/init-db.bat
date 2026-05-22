@echo off
REM Script para inicializar la base de datos PickEm en Windows

echo.
echo ========================================
echo   Inicializando Base de Datos PickEm
echo ========================================
echo.

REM Configurar contraseña de PostgreSQL
set PGPASSWORD=Contrasena14.

REM Crear BD
echo [1/3] Creando base de datos...
psql -U postgres -h localhost -p 5433 -c "CREATE DATABASE \"PickEm\";" 2>nul
if %errorlevel% equ 0 (
    echo     ✓ Base de datos creada
) else (
    echo     ℹ Base de datos ya existe
)

REM Crear tablas
echo [2/3] Creando tablas...
psql -U postgres -h localhost -p 5433 -d PickEm -f setup-db.sql
if %errorlevel% equ 0 (
    echo     ✓ Tablas creadas
) else (
    echo     ✗ Error al crear tablas
    pause
    exit /b 1
)

REM Insertar datos
echo [3/3] Insertando datos iniciales...
psql -U postgres -h localhost -p 5433 -d PickEm -f seed-data.sql
if %errorlevel% equ 0 (
    echo     ✓ Datos insertados
) else (
    echo     ✗ Error al insertar datos
    pause
    exit /b 1
)

echo.
echo ========================================
echo   ✅ Base de datos inicializada
echo ========================================
echo.
echo Credenciales:
echo   Usuario: SOP
echo   Contraseña: 2114
echo.
pause
