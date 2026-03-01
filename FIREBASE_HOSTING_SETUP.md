# 🚀 Configurar Firebase Hosting

## Pasos para desplegar tu aplicación

### 1. Iniciar sesión en Firebase
```bash
npx firebase-tools login
```
Esto abrirá tu navegador para autenticarte.

### 2. Seleccionar tu proyecto Firebase
```bash
npx firebase-tools use --add
```
Esto te mostrará una lista de tus proyectos. Selecciona el que quieres usar.

### 3. Inicializar Firebase Hosting
```bash
npx firebase-tools init hosting
```

Cuando te pregunte:
- **¿Qué directorio público usar?** → Escribe: `dist`
- **¿Configurar como SPA?** → Responde: `Yes` (para React)
- **¿Configurar GitHub Actions?** → Responde: `No` (opcional)

### 4. Construir la aplicación
```bash
npm run build
```

### 5. Desplegar a Firebase Hosting
```bash
npx firebase-tools deploy --only hosting
```

O usa el script de npm:
```bash
npm run firebase:deploy:hosting
```

### 6. ¡Listo! 🎉

Tu aplicación estará disponible en:
```
https://TU_PROYECTO_ID.web.app
https://TU_PROYECTO_ID.firebaseapp.com
```

## Archivos de configuración creados

- `firebase.json` - Configuración de Hosting (ya creado)
- `.firebaserc` - ID del proyecto (necesitas actualizarlo con tu ID real)

## Actualizar el ID del proyecto

Edita `.firebaserc` y reemplaza `"tu-proyecto-id"` con el ID real de tu proyecto Firebase.

O ejecuta:
```bash
npx firebase-tools use --add
```

## Comandos útiles

```bash
# Ver el proyecto actual
npx firebase-tools use

# Cambiar de proyecto
npx firebase-tools use PROYECTO_ID

# Ver el estado del despliegue
npx firebase-tools hosting:channel:list

# Desplegar solo hosting
npm run firebase:deploy:hosting
```

## Configuración actual

- **Directorio público:** `dist/`
- **SPA (Single Page App):** Configurado para React
- **Cache:** Optimizado para archivos estáticos (JS, CSS, MP3)

## Próximos pasos

1. Ejecuta `npx firebase-tools init hosting`
2. Selecciona `dist` como directorio público
3. Ejecuta `npm run build`
4. Ejecuta `npm run firebase:deploy:hosting`
5. ¡Disfruta tu aplicación en línea! 🎉
