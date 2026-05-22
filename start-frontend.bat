@echo off
REM Script para iniciar el frontend en modo desarrollo

echo.
echo ========================================
echo   Iniciando Frontend PickEm
echo ========================================
echo.

REM Verificar que node_modules existe
if not exist "node_modules" (
    echo [1/2] Instalando dependencias...
    call npm install
    if %errorlevel% neq 0 (
        echo ✗ Error al instalar dependencias
        pause
        exit /b 1
    )
    echo ✓ Dependencias instaladas
) else (
    echo [1/2] Dependencias ya instaladas
)

echo [2/2] Iniciando servidor...
echo.
echo ========================================
echo   Frontend corriendo en puerto 3000
echo ========================================
echo.

call npm run dev

pause
