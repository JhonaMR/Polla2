#!/bin/bash

# Script para iniciar Backend y Frontend simultáneamente

echo ""
echo "========================================"
echo "   Iniciando Sistema PickEm Completo"
echo "========================================"
echo ""

# Verificar que PostgreSQL está corriendo
echo "[1/4] Verificando PostgreSQL en puerto 5433..."
if ! nc -z localhost 5433 2>/dev/null; then
    echo "✗ PostgreSQL no está corriendo en puerto 5433"
    echo "  Por favor, inicia PostgreSQL antes de continuar"
    exit 1
fi
echo "✓ PostgreSQL está disponible"

# Instalar dependencias del backend si es necesario
echo "[2/4] Verificando dependencias del backend..."
cd backend
if [ ! -d "node_modules" ]; then
    echo "  Instalando dependencias del backend..."
    npm install
    if [ $? -ne 0 ]; then
        echo "✗ Error al instalar dependencias del backend"
        exit 1
    fi
fi
echo "✓ Backend listo"
cd ..

# Instalar dependencias del frontend si es necesario
echo "[3/4] Verificando dependencias del frontend..."
if [ ! -d "node_modules" ]; then
    echo "  Instalando dependencias del frontend..."
    npm install
    if [ $? -ne 0 ]; then
        echo "✗ Error al instalar dependencias del frontend"
        exit 1
    fi
fi
echo "✓ Frontend listo"

echo "[4/4] Iniciando servicios..."
echo ""
echo "========================================"
echo "   SERVICIOS EN EJECUCIÓN"
echo "========================================"
echo "   Backend:  http://localhost:3001"
echo "   Frontend: http://localhost:3000"
echo "========================================"
echo ""

# Iniciar backend en background
cd backend
npm run dev &
BACKEND_PID=$!
cd ..

# Esperar un poco para que el backend se inicie
sleep 3

# Iniciar frontend
npm run dev

# Cuando se cierre el frontend, cerrar también el backend
kill $BACKEND_PID 2>/dev/null

