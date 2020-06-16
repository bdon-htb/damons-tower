/**
 * engine.js contains a majority of the game's system logic.
 * the Engine class is basically the game object.
 */

function Engine(htmlDOM){
  this.windowWidth = 800;
  this.windowHeight = 600;

  this.verifyPixi();
  this.createApp(htmlDOM);
  this.loadAssets();
}

Engine.prototype.verifyPixi = function(){
  let type = "WebGL";
  if(!PIXI.utils.isWebGLSupported()){
    type = "canvas";
  }
  PIXI.utils.sayHello(type);
}

Engine.prototype.createApp = function(element){
  this.app = new PIXI.Application({
    view: element,
    width: this.windowWidth,
    height: this.windowHeight,
    backgroundColor: 0xB8D5EE
  });
 }

/**
 * The following functions are placeholders.
 */
Engine.prototype.drawText = function(msg){
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
  this.app.stage.addChild(message);
 }

Engine.prototype.drawRect = function(x, y, width, height){
  let rectangle = new PIXI.Graphics();
  rectangle.beginFill(0x66CCFF);
  rectangle.drawRect(x, y, width, height);
  rectangle.endFill();
  this.app.stage.addChild(rectangle)
}

Engine.prototype.loadAssets = function(){
  PIXI.Loader.shared
    .add("img/jo_the_pyro.png")
    .on("progress", this.progressHandler)
    .load(this.setup);
}

Engine.prototype.setup = function(){
  // This code basically sets the sprite to the single jo_the_pyro frame.
  // I'm assuming this texture variable is an alias.
  // Cannot display two different sprites from the one image like this.
  let texture = PIXI.utils.TextureCache["img/jo_the_pyro.png"];
  let rectangle = new PIXI.Rectangle(0, 0, 32, 32);
  texture.frame = rectangle;
}

Engine.prototype.progressHandler = function(loader, resource){
  // console.log(`loading: ${resource.url}`);
  // console.log(`progress: ${loader.progress}%`);
}

Engine.prototype.drawImage = function(){
  this.jo = new PIXI.Sprite(PIXI.Loader.shared.resources["img/jo_the_pyro.png"].texture);
  this.jo.x = 150;
  this.jo.y = 120;
  this.app.stage.addChild(this.jo);
}
