#!/usr/bin/env node

/**
 * Script para subir el build de producción a Firebase Storage
 * 
 * Requisitos:
 * 1. Instalar Firebase CLI: npm install -g firebase-tools
 * 2. Instalar Google Cloud SDK: brew install google-cloud-sdk (macOS)
 * 3. Iniciar sesión: firebase login
 * 4. Configurar el proyecto: firebase use --add (selecciona tu proyecto)
 * 
 * Uso: npm run upload:storage
 */

import { execSync } from 'child_process';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const DIST_DIR = path.join(__dirname, 'dist');
const STORAGE_BUCKET = process.env.FIREBASE_STORAGE_BUCKET || 'gs://tu-proyecto.appspot.com';

console.log('🚀 Iniciando subida a Firebase Storage...\n');

// Verificar que existe la carpeta dist
if (!fs.existsSync(DIST_DIR)) {
  console.error('❌ Error: La carpeta dist/ no existe. Ejecuta primero: npm run build');
  process.exit(1);
}

// Función para subir un archivo
function uploadFile(localPath, remotePath) {
  try {
    const command = `gsutil cp "${localPath}" "${STORAGE_BUCKET}/${remotePath}"`;
    console.log(`📤 Subiendo: ${remotePath}`);
    execSync(command, { stdio: 'inherit' });
    return true;
  } catch (error) {
    console.error(`❌ Error al subir ${remotePath}:`, error.message);
    return false;
  }
}

// Función recursiva para subir todos los archivos
function uploadDirectory(localDir, remoteDir = '') {
  const files = fs.readdirSync(localDir);
  let uploaded = 0;
  let failed = 0;

  for (const file of files) {
    const localPath = path.join(localDir, file);
    const remotePath = remoteDir ? `${remoteDir}/${file}` : file;
    const stat = fs.statSync(localPath);

    if (stat.isDirectory()) {
      // Subir directorio recursivamente
      const result = uploadDirectory(localPath, remotePath);
      uploaded += result.uploaded;
      failed += result.failed;
    } else {
      // Subir archivo
      if (uploadFile(localPath, remotePath)) {
        uploaded++;
      } else {
        failed++;
      }
    }
  }

  return { uploaded, failed };
}

// Verificar que gsutil está instalado
try {
  execSync('gsutil --version', { stdio: 'ignore' });
} catch (error) {
  console.error('❌ Error: gsutil no está instalado.');
  console.log('\n📦 Instala Google Cloud SDK:');
  console.log('   macOS: brew install google-cloud-sdk');
  console.log('   Linux: https://cloud.google.com/sdk/docs/install');
  console.log('   Windows: https://cloud.google.com/sdk/docs/install\n');
  process.exit(1);
}

// Verificar que Firebase está configurado
try {
  execSync('firebase projects:list', { stdio: 'ignore' });
} catch (error) {
  console.error('❌ Error: Firebase CLI no está configurado.');
  console.log('\n🔧 Configura Firebase:');
  console.log('   1. firebase login');
  console.log('   2. firebase use --add (selecciona tu proyecto)\n');
  process.exit(1);
}

// Obtener el bucket del proyecto Firebase actual
try {
  const projectId = execSync('firebase use', { encoding: 'utf8' }).trim().split('\n')[0].replace('Now using project ', '');
  if (projectId && !projectId.includes('Error')) {
    const bucket = `gs://${projectId}.appspot.com`;
    console.log(`📦 Proyecto Firebase: ${projectId}`);
    console.log(`📦 Bucket: ${bucket}\n`);
    
    // Subir todos los archivos
    const result = uploadDirectory(DIST_DIR);
    
    console.log('\n✅ Subida completada!');
    console.log(`   ✅ Archivos subidos: ${result.uploaded}`);
    if (result.failed > 0) {
      console.log(`   ❌ Archivos fallidos: ${result.failed}`);
    }
    console.log(`\n🌐 Accede a tu aplicación en: https://storage.googleapis.com/${projectId}.appspot.com/index.html`);
  } else {
    console.error('❌ No se pudo detectar el proyecto Firebase. Ejecuta: firebase use --add');
    process.exit(1);
  }
} catch (error) {
  console.error('❌ Error:', error.message);
  console.log('\n💡 Asegúrate de:');
  console.log('   1. Haber ejecutado: firebase login');
  console.log('   2. Haber configurado el proyecto: firebase use --add');
  process.exit(1);
}
