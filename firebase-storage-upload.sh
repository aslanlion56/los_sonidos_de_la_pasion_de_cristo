#!/bin/bash

# Script para subir el build a Firebase Storage usando Firebase CLI
# Requisitos: firebase-tools instalado y configurado

echo "🚀 Subiendo aplicación a Firebase Storage..."
echo ""

# Verificar que existe dist
if [ ! -d "dist" ]; then
    echo "❌ Error: La carpeta dist/ no existe. Ejecuta primero: npm run build"
    exit 1
fi

# Verificar Firebase CLI (usar npx si no está instalado globalmente)
FIREBASE_CMD="firebase"
if ! command -v firebase &> /dev/null; then
    FIREBASE_CMD="npx firebase-tools"
    echo "ℹ️  Usando npx firebase-tools (sin instalación global)"
fi

# Obtener el proyecto actual
PROJECT_ID=$($FIREBASE_CMD use 2>/dev/null | grep "Now using project" | awk '{print $4}')

if [ -z "$PROJECT_ID" ]; then
    echo "❌ No se pudo detectar el proyecto Firebase."
    echo "🔧 Configura con: firebase use --add"
    exit 1
fi

BUCKET="gs://${PROJECT_ID}.appspot.com"

echo "📦 Proyecto: $PROJECT_ID"
echo "📦 Bucket: $BUCKET"
echo ""

# Subir archivos usando gsutil (requiere Google Cloud SDK)
if command -v gsutil &> /dev/null; then
    echo "📤 Subiendo archivos a Firebase Storage..."
    gsutil -m cp -r dist/* "$BUCKET/"
    
    if [ $? -eq 0 ]; then
        echo ""
        echo "✅ ¡Subida completada!"
        echo "🌐 Accede a tu aplicación en:"
        echo "   https://storage.googleapis.com/${PROJECT_ID}.appspot.com/index.html"
    else
        echo "❌ Error al subir archivos"
        exit 1
    fi
else
    echo "❌ gsutil no está instalado."
    echo ""
    echo "📦 Instala Google Cloud SDK:"
    echo "   macOS: brew install google-cloud-sdk"
    echo "   Linux: https://cloud.google.com/sdk/docs/install"
    echo ""
    echo "💡 Alternativa: Usa la consola web de Firebase Storage"
    echo "   https://console.firebase.google.com/"
    exit 1
fi
