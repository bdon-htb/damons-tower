/**
 * engine.js contains a majority of the game's system logic.
 */

function verifyPixiCompatibility(){
  let type = "WebGL";
  if(!PIXI.utils.isWebGLSupported()){
    type = "canvas";
  }
  PIXI.utils.sayHello(type);
}

function createGameWindow(){
  let app = new PIXI.Application({
    width: 800,
    height: 600,
    antialias: true,
    transparent: false,
    resolution: 1
  })
  return app
}

function changeWindowColor(color){
  app.renderer.backgroundColor = color;
}
