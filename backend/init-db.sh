#!/bin/bash

# Script para inicializar la base de datos PickEm

echo "🔧 Inicializando Base de Datos PickEm..."

# Configurar contraseña de PostgreSQL
export PGPASSWORD=Contrasena14.

# Crear BD
echo "📊 Creando base de datos..."
psql -U postgres -h localhost -p 5433 -c "CREATE DATABASE \"PickEm\";" 2>/dev/null || echo "BD ya existe"

# Crear tablas
echo "📋 Creando tablas..."
psql -U postgres -h localhost -p 5433 -d PickEm -f setup-db.sql

# Insertar datos
echo "📝 Insertando datos iniciales..."
psql -U postgres -h localhost -p 5433 -d PickEm -f seed-data.sql

echo "✅ Base de datos inicializada correctamente"
echo ""
echo "Credenciales:"
echo "  Usuario: SOP"
echo "  Contraseña: 2114"
