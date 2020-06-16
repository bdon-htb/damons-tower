/**
 * engine.js contains a majority of the game's system logic
 * and contains all other components.
 * The Engine is essentially the game itself in a way.
 * htmlDOM refers to the html element the game will run in.
 * For this particular case it refers to the canvas.
 */

function Engine(htmlDOM){
  this.context = htmlDOM
  this.windowWidth = 800;
  this.windowHeight = 600;
  this.backgroundColor = 0xB8D5EE;

  this.renderer = new Renderer(this);
}

Engine.prototype.draw = function(){}

Engine.prototype.update = function(){}

Engine.prototype.run = function(){
  this.draw();
  this.update();
}
/**
 * The following functions are placeholders.
 * todo: make cleaner versions and move over to graphic.js
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
