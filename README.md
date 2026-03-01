# Sonidos de la Pasión

Landing page interactiva de audios con un carrusel principal de audios largos y tarjetas de audios secundarios que pueden reproducirse simultáneamente.

## Características

### Audios Principales (Carrusel)
- **Carrusel navegable** con audios largos
- **Controles únicos compartidos** que afectan al audio activo
- **Reproducción en bucle automática** si no se cambia manualmente
- **Indicadores visuales** del audio activo
- **Controles de progreso y volumen** sincronizados

### Audios Secundarios
- **Grid de tarjetas cuadradas** con iconos representativos
- **Controles independientes** para cada audio
- **Reproducción simultánea** entre audios secundarios y con el audio principal
- **Iconos temáticos**: puerta, gallo, fogata, lluvia, viento, olas, pájaros, trueno

## Tecnologías

- **React 18** - Biblioteca de UI
- **Vite** - Build tool y dev server
- **React Icons** - Librería de iconos
- **HTML5 Audio API** - Reproducción de audio nativa

## Instalación

1. Instala las dependencias:
```bash
npm install
```

2. Coloca tus archivos de audio:
   - **Audios principales**: en la carpeta `public/audios/` (ej: `01- The Olive Garden Night Sky.mp3`)
   - **Audios secundarios**: en la carpeta `public/audios/cortos/` (ej: `puerta.mp3`, `gallo.mp3`, `fire.mp3`, etc.)
   
   **Nota**: Los archivos grandes como MP3 se colocan en `public/` para que no se procesen por el bundler y no afecten el tamaño del bundle.

3. Inicia el servidor de desarrollo:
```bash
npm run dev
```

4. Abre tu navegador en `http://localhost:5173`

## Estructura del Proyecto

```
sonidos_de_la_pasion/
├── public/
│   └── audios/          # Archivos de audio (principales y secundarios)
│       └── cortos/      # Audios secundarios cortos
├── src/
│   ├── assets/
│   │   └── icons/       # Iconos e imágenes (como el logo)
│   ├── components/      # Componentes React
│   │   ├── AudioCarousel.jsx
│   │   ├── AudioControls.jsx
│   │   ├── AudioCard.jsx
│   │   └── SecondaryAudioGrid.jsx
│   ├── data/
│   │   └── audioData.js # Configuración de audios
│   ├── styles/
│   │   ├── App.css
│   │   └── components.css
│   ├── utils/
│   │   └── icons.js     # Mapeo de iconos
│   ├── App.jsx
│   └── main.jsx
├── index.html
├── package.json
└── vite.config.js
```

## Configuración de Audios

Edita `src/data/audioData.js` para agregar o modificar audios:

```javascript
export const mainAudios = [
  {
    id: 1,
    name: "Nombre del Audio",
    src: "/audios/archivo.mp3", // Archivo debe estar en public/audios/
    description: "Descripción opcional"
  }
];

export const secondaryAudios = [
  {
    id: 1,
    name: "Abrir Puerta",
    src: "/audios/door.mp3",
    icon: "door" // Tipo de icono
  }
];
```

## Iconos Disponibles

Los iconos disponibles para audios secundarios son:
- `door` - Puerta
- `rooster` - Gallo
- `fire` - Fogata
- `rain` - Lluvia
- `wind` - Viento
- `waves` - Olas
- `birds` - Pájaros
- `thunder` - Trueno

## Scripts

- `npm run dev` - Inicia el servidor de desarrollo
- `npm run build` - Construye la aplicación para producción
- `npm run preview` - Previsualiza la build de producción

## Funcionalidades Técnicas

### Gestión de Estado
- Estado global para el audio principal activo
- Estado independiente para cada audio secundario
- Sincronización automática de controles
- Persistencia de volúmenes durante la sesión

### Reproducción de Audio
- HTML5 Audio API nativo
- Manejo de eventos (timeupdate, ended, loadedmetadata)
- Bucle automático para audios principales
- Reproducción simultánea de múltiples audios

### Diseño Responsive
- Adaptable a móviles, tablets y desktop
- Grid flexible para tarjetas secundarias
- Carrusel con scroll suave
- Controles optimizados para touch

## Licencia

Este proyecto es de código abierto y está disponible bajo la licencia MIT.
