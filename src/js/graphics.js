/**
 * renderer.js contains all of the game's graphics code,
 * everything pixi.js related goes here!
 * todo: create primitives.
 */

function Renderer(parent){
  this.parent = parent;
  this.createTextStyles();
  this.loadAssets();
  this.verifyAPI();
  this.createApp();
}

Renderer.prototype.verifyAPI = function(){
  let type = "WebGL";
  if(!PIXI.utils.isWebGLSupported()){
    type = "canvas";
  }
  PIXI.utils.sayHello(type);
}

Renderer.prototype.createApp = function(){
  this.app = new PIXI.Application({
    view: this.parent.context,
    width: this.parent.windowWidth,
    height: this.parent.windowHeight,
    backgroundColor: this.parent.backgroundColor
  });
}

Renderer.prototype.loadAssets = function(){
  PIXI.Loader.shared
    .add("img/jo_the_pyro.png")
    //.on("progress", this.progressHandler)
    .load();
}

Renderer.prototype.createTextStyles = function(){
  this.textStyles = {};
  this.textStyles.debug = new PIXI.TextStyle({
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
}

Renderer.prototype.drawText = function(msg, style=this.textStyles.debug, x=0, y=0){
  let message = new PIXI.Text(msg, style);
  message.position.set(x, y);
  this.app.stage.addChild(message);
}

Renderer.prototype.drawRect = function(colour, x, y, width, height){
  let rectangle = new PIXI.Graphics();
  rectangle.beginFill(0x66CCFF);
  rectangle.drawRect(x, y, width, height);
  rectangle.endFill();
  this.app.stage.addChild(rectangle)
}
