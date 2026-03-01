# Subir a Firebase Storage (Sin instalación global)

## Método más simple: Usar npx (sin permisos de administrador)

### Paso 1: Iniciar sesión en Firebase
```bash
npx firebase-tools login
```

### Paso 2: Configurar el proyecto
```bash
npx firebase-tools use --add
```
Selecciona tu proyecto de Firebase cuando te lo pida.

### Paso 3: Subir los archivos

**Opción A - Usando gsutil (requiere Google Cloud SDK):**
```bash
# Obtén tu ID de proyecto
PROJECT_ID=$(npx firebase-tools use | grep "Now using project" | awk '{print $4}')

# Sube los archivos
gsutil -m cp -r dist/* gs://${PROJECT_ID}.appspot.com/
```

**Opción B - Usando la consola web (más fácil):**

1. Ve a https://console.firebase.google.com/
2. Selecciona tu proyecto
3. Ve a **Storage** en el menú lateral
4. Si es la primera vez, haz clic en **Comenzar**
5. Arrastra y suelta todos los archivos de la carpeta `dist/` manteniendo la estructura:
   - Arrastra `index.html` a la raíz
   - Arrastra la carpeta `assets/` completa
   - Arrastra la carpeta `audios/` completa

### Paso 4: Configurar acceso público

En Firebase Console > Storage > Rules, configura:

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

### Paso 5: Acceder a tu aplicación

Tu aplicación estará disponible en:
```
https://storage.googleapis.com/TU_PROYECTO_ID.appspot.com/index.html
```

Reemplaza `TU_PROYECTO_ID` con el ID de tu proyecto Firebase.

## Alternativa: Instalar con sudo (si prefieres instalación global)

```bash
sudo npm install -g firebase-tools
```

Luego usa los comandos normales:
```bash
firebase login
firebase use --add
```
