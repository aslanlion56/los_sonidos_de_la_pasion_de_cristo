# 📤 Cómo subir a Firebase Storage (Método Simple)

## Opción 1: Consola Web de Firebase (MÁS FÁCIL - Recomendado)

### Pasos:

1. **Ve a Firebase Console:**
   - Abre: https://console.firebase.google.com/
   - Selecciona tu proyecto (o créalo si no tienes uno)

2. **Activa Storage:**
   - En el menú lateral, ve a **Storage**
   - Si es la primera vez, haz clic en **Comenzar**
   - Acepta los términos y crea el bucket

3. **Sube los archivos:**
   - Haz clic en **Subir archivo** o arrastra y suelta
   - Sube TODOS los archivos de la carpeta `dist/` manteniendo la estructura:
     ```
     dist/
     ├── index.html          → Subir a la raíz
     ├── assets/             → Subir carpeta completa
     │   ├── index-*.js
     │   ├── index-*.css
     │   └── Los_Sonidos_*.png
     └── audios/             → Subir carpeta completa
         ├── 01- The Olive Garden Night Sky.mp3
         ├── 02- Mary Goes To Jesus.mp3
         ├── ... (todos los audios principales)
         └── cortos/
             ├── 01- Puerta.mp3
             ├── 02- Fogata.mp3
             └── ... (todos los audios secundarios)
     ```

4. **Configura acceso público:**
   - Ve a **Storage** > **Rules**
   - Reemplaza las reglas con:
     ```javascript
     rules_version = '2';
     service firebase.storage {
       match /b/{bucket}/o {
         match /{allPaths=**} {
           allow read: if true;
           allow write: if request.auth != null;
         }
       }
     }
     ```
   - Haz clic en **Publicar**

5. **Obtén la URL de tu aplicación:**
   - Ve a **Storage** > **Files**
   - Haz clic en `index.html`
   - Copia la URL pública (algo como: `https://firebasestorage.googleapis.com/v0/b/TU_PROYECTO.appspot.com/o/index.html?alt=media`)
   - **Nota:** Esta URL tiene un token. Para una URL permanente, necesitas configurar un dominio personalizado o usar Firebase Hosting.

## Opción 2: Usando gsutil (Línea de comandos)

### Prerrequisitos:
```bash
# Instalar Google Cloud SDK
brew install google-cloud-sdk  # macOS
```

### Pasos:

1. **Autenticarse:**
   ```bash
   gcloud auth login
   ```

2. **Obtener tu ID de proyecto:**
   - Ve a https://console.firebase.google.com/
   - Selecciona tu proyecto
   - El ID del proyecto aparece en la URL o en la configuración

3. **Subir archivos:**
   ```bash
   # Reemplaza TU_PROYECTO_ID con tu ID real
   PROJECT_ID="tu-proyecto-id"
   gsutil -m cp -r dist/* gs://${PROJECT_ID}.appspot.com/
   ```

4. **Acceder a la aplicación:**
   ```
   https://storage.googleapis.com/TU_PROYECTO_ID.appspot.com/index.html
   ```

## Opción 3: Usando Firebase CLI (Requiere configuración)

Si prefieres usar Firebase CLI, primero necesitas inicializar:

```bash
# 1. Iniciar sesión
npx firebase-tools login

# 2. Inicializar (esto creará archivos de configuración)
npx firebase-tools init

# Selecciona:
# - Storage: Yes
# - Project: Tu proyecto
# - Storage rules file: storage.rules (default)

# 3. Luego puedes usar gsutil o la consola web
```

## ⚠️ Nota Importante sobre URLs

Firebase Storage genera URLs con tokens temporales. Para una URL permanente:

1. **Usa Firebase Hosting** (mejor opción para aplicaciones web):
   ```bash
   npx firebase-tools init hosting
   npx firebase-tools deploy --only hosting
   ```

2. **O configura un dominio personalizado** en Storage

## 📝 Estructura final en Storage

Después de subir, tu Storage debería verse así:

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
    ├── ... (todos los audios)
    └── cortos/
        ├── 01- Puerta.mp3
        ├── 02- Fogata.mp3
        └── ... (todos los audios cortos)
```

## 🎯 Recomendación

**Para una aplicación web completa, Firebase Hosting es mejor que Storage:**
- URLs limpias y permanentes
- HTTPS automático
- CDN global
- Más fácil de configurar

¿Quieres que te ayude a configurar Firebase Hosting en su lugar?
