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

function displayText(msg){
  let style = new PIXI.TextStyle({
    fontFamily: "Arial",
    fontSize: 36,
    fill: "white",
    stroke: '#ff3300',
    strokeThickness: 4,
    dropShadow: true,
    dropShadowColor: "#000000",
    dropShadowBlur: 4,
    dropShadowAngle: Math.PI / 6,
    dropShadowDistance: 6,
  });
  
  let message = new PIXI.Text(msg, style);
  app.stage.addChild(message);
}
