@echo off
REM Script para iniciar Backend y Frontend simultáneamente

echo.
echo ========================================
echo   Iniciando Sistema PickEm Completo
echo ========================================
echo.

REM Verificar que PostgreSQL está corriendo
echo [1/4] Verificando PostgreSQL en puerto 5433...
netstat -ano | findstr ":5433" >nul
if %errorlevel% neq 0 (
    echo ✗ PostgreSQL no está corriendo en puerto 5433
    echo   Por favor, inicia PostgreSQL antes de continuar
    pause
    exit /b 1
)
echo ✓ PostgreSQL está disponible

REM Instalar dependencias del backend si es necesario
echo [2/4] Verificando dependencias del backend...
cd backend
if not exist "node_modules" (
    echo   Instalando dependencias del backend...
    call npm install
    if %errorlevel% neq 0 (
        echo ✗ Error al instalar dependencias del backend
        pause
        exit /b 1
    )
)
echo ✓ Backend listo
cd ..

REM Instalar dependencias del frontend si es necesario
echo [3/4] Verificando dependencias del frontend...
if not exist "node_modules" (
    echo   Instalando dependencias del frontend...
    call npm install
    if %errorlevel% neq 0 (
        echo ✗ Error al instalar dependencias del frontend
        pause
        exit /b 1
    )
)
echo ✓ Frontend listo

echo [4/4] Iniciando servicios...
echo.
echo ========================================
echo   SERVICIOS EN EJECUCIÓN
echo ========================================
echo   Backend:  http://localhost:3002
echo   Frontend: http://localhost:3000
echo ========================================
echo.

REM Iniciar backend en una nueva ventana
start "Backend PickEm" cmd /k "cd backend && npm run dev"

REM Esperar un poco para que el backend se inicie
timeout /t 3 /nobreak

REM Iniciar frontend en la ventana actual
cd .
npm run dev

