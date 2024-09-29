
# Controles Provisorios: WASD(mover) y M(eco)
### A continuación te mostraré cómo configurar tu proyecto con Vite (una opción más moderna y fácil de usar). **Importante: Si descargaste el proyecto desde el repo no olvides ejecutar el npm install para descargar los modulos de Node**

## Usar Vite para servir tu proyecto
**Paso 1: Instalar Vite**

Si aún no lo tienes, instala Vite con el siguiente comando:

```bash
npm create vite@latest
```
Elige las opciones por defecto o selecciona Vanilla si estás trabajando solo con JS.

**Paso 2: Instalar las dependencias**

Después de crear el proyecto con Vite, instala las dependencias necesarias (Pixi.js):

```bash
npm install pixi.js
```
**Paso 3: Configura tu archivo Game.js**

Tu archivo Game.js debería verse así:

```js
import * as PIXI from 'pixi.js';

export class Game {
    constructor() {
        this.app = new PIXI.Application({ width: 800, height: 600, backgroundColor: 0x1099bb });
        document.body.appendChild(this.app.view);

        this.app.ticker.add(() => {
            // Lógica del juego aquí
        });
    }
}
```
**Paso 4: Configurar index.html**

Asegúrate de que tu archivo index.html esté configurado correctamente para Vite:

```html
<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>My PixiJS Game</title>
</head>
<body>
    <script type="module" src="/src/main.js"></script>
</body>
</html>
```
**Paso 5: Configura main.js para inicializar el juego**

En tu archivo main.js que está dentro de la carpeta src, crea una instancia de tu clase Game:

```js
import { Game } from './clases/Game.js';

const game = new Game();
```
**Paso 6: Ejecuta tu proyecto**

Finalmente, inicia Vite con el siguiente comando:

```bash
npm run dev
```
Esto levantará un servidor de desarrollo que compilará tus archivos y los servirá en el navegador sin problemas de módulos.

## 1. Asegúrate de que Pixi.js esté instalado correctamente
Asegúrate de haber instalado **pixi.js** en tu proyecto. 

## 2. Verifica tu archivo package.json
El archivo **package.json** debería tener una sección dependencies que incluya pixi.js:

```json
"dependencies": {
  "pixi.js": "^7.x.x"  // Asegúrate de que esté instalada la última versión
}
```
## 3. Importar Pixi.js desde los módulos de Node
Ya que estás utilizando módulos de ES6, el archivo **Game.js** debe importar correctamente **pixi.js** usando import:

```js
import * as PIXI from 'pixi.js';
```
Esto importará correctamente PixiJS si estás ejecutando tu proyecto como un módulo de ES6.


