import * as PIXI from 'pixi.js';
import { addBackground } from '../components/addBackground.js'
import { addWaterOverlay, animateWaterOverlay } from '../components/addWaterOverlay.js'
import { addDisplacementEffect } from '../components/addDisplacementEffect.js'
import { Player } from './Player.js';  // Importamos la clase Player 
import { Fish } from './Fish.js';  // Importa la clase Fish

// Imagenes
import backgroundImage from '../sprites/sea_background_1.png'; // Usa la ruta relativa
import waveOverlay from '../sprites/wave_overlay.png';         // Usa la ruta relativa
import displacementMap from '../sprites/displacement_map.png'; // Usa la ruta relativa
import PlayerImage from '../sprites/dopphin_top_view_ph.png';  // Usa la ruta relativa
import FishImage from '../sprites/fish_1_ph.png';              // Usa la ruta relativa

export class Game {    
    // Propiedad estática que contendrá la única instancia de la clase (Singleton)
    static instance = null;

    constructor() {
        // Si ya existe una instancia, retornarla y no crear una nueva
        if (Game.instance) {
            return Game.instance;
        }
        // Si no existe, inicializar la instancia
        console.log('Game Init');
        this.app = new PIXI.Application();
        this.width = window.innerWidth;
        this.height = window.innerHeight;

        this.player = null;
        this.fishes = [];
        this.fishCount = 30;

        let promise = this.app.init({ width: this.width, height: this.height });

        promise.then(async () => {
            document.body.appendChild(this.app.canvas);
            window.__PIXI_APP__ = this.app;

            // Esperar que los recursos se carguen antes de añadir el fondo
            await this.preload();
            
            // Cargar el Fondo
            addBackground(this.app);
            addWaterOverlay(this.app);
            addDisplacementEffect(this.app);

            // Cargo el Player 
            this.player = new Player(this.app.screen.width / 2, this.app.screen.height / 2, 'player', this);  
            
            // Cargo Peces
            this.startFishes();
            // console.log(this.fishes)
            
            this.app.ticker.add((time) => {
                // Lógica del juego aquí
                this.gameLoop(time);
            });            
        });

        // Asignar la instancia actual a la propiedad estática
        Game.instance = this;
    }
    gameLoop(time) {
        // Actualizar el jugador        
        this.player.update(time);
         // Actualizar cada pez
         for (let fish of this.fishes) {
            fish.update(time, this.fishes, this.player);
        }
        // Animar el overlay de agua
        animateWaterOverlay(this.app, time);
    }

    async preload() {
        const assets = [
            { alias: 'background', src: backgroundImage },
            { alias: 'overlay', src: waveOverlay },
            { alias: 'displacement', src: displacementMap },  
            { alias: 'fish', src: FishImage },               
            { alias: 'player', src: PlayerImage },                  
        ];
    
        // Usamos `PIXI.Assets.load` para cargar todos los recursos
        await PIXI.Assets.load(assets);
    } 
    
    startFishes() {
        for (let i = 0; i < this.fishCount; i++) {
            const fish = new Fish(Math.random() * this.width, Math.random() * this.height, 'fish', this);
            this.fishes.push(fish);
        }
    }


}




// Inverstigar: steering behabiors, p5.js(Para vectores), boids cohesion codeopen boids