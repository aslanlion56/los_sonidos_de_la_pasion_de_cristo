# Instrucciones para subir a Firebase Storage

## Opción 1: Usando el script automatizado (Recomendado)

### Prerrequisitos:
1. Instalar Firebase CLI (opciones):
   
   **Opción A - Sin permisos de administrador (recomendado):**
   ```bash
   # No necesitas instalar, usa npx directamente
   npx firebase-tools login
   ```
   
   **Opción B - Con permisos de administrador:**
   ```bash
   sudo npm install -g firebase-tools
   ```

2. Instalar Google Cloud SDK (para gsutil):
   - **macOS**: `brew install google-cloud-sdk`
   - **Linux/Windows**: https://cloud.google.com/sdk/docs/install

3. Iniciar sesión en Firebase:
   ```bash
   npx firebase-tools login
   # o si lo instalaste globalmente:
   firebase login
   ```

4. Configurar el proyecto:
   ```bash
   npx firebase-tools use --add
   # o si lo instalaste globalmente:
   firebase use --add
   ```
   Selecciona tu proyecto de Firebase.

### Subir la aplicación:

**Opción A - Script Node.js:**
```bash
npm run upload:storage
```

**Opción B - Script Bash:**
```bash
npm run upload:storage:sh
# o directamente:
./firebase-storage-upload.sh
```

## Opción 2: Usando la consola web de Firebase

1. Ve a https://console.firebase.google.com/
2. Selecciona tu proyecto
3. Ve a **Storage** en el menú lateral
4. Haz clic en **Comenzar** si es la primera vez
5. Arrastra y suelta todos los archivos de la carpeta `dist/` a Storage
6. Mantén la estructura de carpetas (assets/, audios/, etc.)

## Opción 3: Usando gsutil manualmente

```bash
# Obtén tu bucket (reemplaza TU_PROYECTO con tu ID de proyecto)
BUCKET="gs://TU_PROYECTO.appspot.com"

# Sube todos los archivos
gsutil -m cp -r dist/* $BUCKET/
```

## Acceder a la aplicación

Después de subir, tu aplicación estará disponible en:
```
https://storage.googleapis.com/TU_PROYECTO.appspot.com/index.html
```

**Nota importante:** 
- Reemplaza `TU_PROYECTO` con tu ID de proyecto de Firebase
- Asegúrate de configurar las reglas de Storage para permitir acceso público a los archivos si es necesario

## Configurar acceso público (si es necesario)

En Firebase Console > Storage > Rules, asegúrate de tener:

```javascript
rules_version = '2';
service firebase.storage {
  match /b/{bucket}/o {
    match /{allPaths=**} {
      allow read: if true; // Permite lectura pública
      allow write: if request.auth != null; // Solo escritura autenticada
    }
  }
}
```

## Estructura de archivos en Storage

Después de subir, tu Storage debería tener:
```
/
├── index.html
├── assets/
│   ├── index-[hash].js
│   ├── index-[hash].css
│   └── Los_Sonidos_de_la_Pasion-[hash].png
└── audios/
    ├── 01- The Olive Garden Night Sky.mp3
    ├── 02- Mary Goes To Jesus.mp3
    ├── ... (todos los audios principales)
    └── cortos/
        ├── 01- Puerta.mp3
        ├── 02- Fogata.mp3
        └── ... (todos los audios secundarios)
```
