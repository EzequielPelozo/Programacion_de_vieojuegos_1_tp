import { Sprite } from 'pixi.js';

export function addBackground(app) {
    // console.log('addBackground');
    // Crear un sprite usando el alias del fondo cargado
    const background = Sprite.from('background');

    // Configurar el punto de anclaje para centrar el sprite
    background.anchor.set(0.5);

    // Si la pantalla es más ancha que alta, ajustar el ancho
    if (app.screen.width > app.screen.height) {
        background.width = app.screen.width * 1.2;
        background.scale.y = background.scale.x; // Mantener proporción
    } else {
        // Si la pantalla es cuadrada o vertical, ajustar la altura
        background.height = app.screen.height * 1.2;
        background.scale.x = background.scale.y; // Mantener proporción
    }

    // Colocar el fondo en el centro de la pantalla
    background.x = app.screen.width / 2;
    background.y = app.screen.height / 2;

    // Añadir el fondo al escenario
    app.stage.addChild(background);
}
