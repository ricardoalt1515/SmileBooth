#!/bin/bash
# Script de instalación rápida del backend con UV

echo "📦 Instalando backend Python con UV..."

# Instalar uv si no está instalado
if ! command -v uv &> /dev/null; then
    echo "Instalando uv..."
    curl -LsSf https://astral.sh/uv/install.sh | sh
fi

# Crear virtual environment con uv
uv venv

# Activar
source .venv/bin/activate

# Instalar dependencias con uv (mucho más rápido)
uv pip install -r requirements.txt

echo "✅ Backend instalado con UV!"
echo ""
echo "Para ejecutar:"
echo "  source .venv/bin/activate"
echo "  python app/main.py"
