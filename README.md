# Music Player (Electron)

App de escritorio hecha con Electron para buscar y reproducir música de YouTube. No requiere API key de Google: la búsqueda se hace con `youtubei.js`, un cliente no oficial de la API interna de YouTube.

## Requisitos

- Node.js
- npm

## Instalación

```bash
npm install
```

## Ejecutar

```bash
npm start
```

Se abre una ventana con un buscador arriba y una grilla de resultados. Al hacer clic en un resultado, el video se reproduce en un reproductor embebido en la parte superior.

## Estructura del proyecto

```
main.js        proceso principal de Electron: crea la ventana, sirve el HTML por HTTP local y expone la búsqueda vía IPC
preload.js     puente seguro (contextBridge) entre el proceso principal y la interfaz
index.html     estructura de la interfaz (buscador, pestañas, reproductor, resultados)
renderer.js    lógica de la interfaz: búsqueda, render de resultados, reproducción, favoritos
styles.css     estilos
```

## Funcionalidad

- **Búsqueda**: escribe una consulta y pulsa "Buscar" (o Enter). Al abrir la app se precarga una búsqueda de ejemplo.
- **Reproducción**: clic en cualquier tarjeta de resultado carga el video en el reproductor embebido de YouTube, con su miniatura, título y autor.
- **Favoritos**: el ícono de corazón en cada tarjeta guarda o quita esa canción de favoritos. La pestaña "❤ Favoritos" muestra la lista guardada. Se persiste en `localStorage`, por lo que sobrevive a reiniciar la app.

## Decisiones técnicas

- **`youtubei.js` en vez de la API oficial de YouTube**: evita depender de una API key. Se probó primero con `yt-search`, pero esa librería rompía al parsear ciertos resultados de búsqueda (`TypeError: title.trim is not a function`) — es un scraper frágil ante cambios en el HTML de YouTube. `youtubei.js` habla directamente con la API interna (Innertube) usando estructuras JSON, lo cual es más estable.
- **Servidor HTTP local en vez de `file://`**: el reproductor embebido de YouTube rechaza el origen `file://` con "Error 153". `main.js` levanta un servidor HTTP en `127.0.0.1` (puerto aleatorio) que sirve los archivos estáticos de la app, y la ventana carga desde ahí en lugar de usar `loadFile`.
- **`contextIsolation` habilitado**: el renderer no tiene acceso directo a Node; toda comunicación con el proceso principal pasa por `preload.js` vía `contextBridge`, siguiendo las prácticas de seguridad recomendadas por Electron.

## Limitaciones conocidas

- La búsqueda depende de la API interna de YouTube (Innertube); si YouTube cambia su formato, `youtubei.js` puede requerir actualizarse.
- Algunos videos pueden no reproducirse en el embed si el dueño del contenido deshabilitó la reproducción en sitios externos.
