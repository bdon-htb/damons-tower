/**
 * renderer.js contains all of the game's graphics code,
 * everything pixi.js related goes here!
 * todo: create primitives.
 */

/*
 * The renderer itself.
 */
function Renderer(parent){
  this.parent = parent;
  this.createTextStyles();
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

Renderer.prototype.loadAssets = function(){}

Renderer.prototype.createApp = function(){
  this.app = new PIXI.Application({
    view: this.parent.context,
    width: this.parent.windowWidth,
    height: this.parent.windowHeight,
    backgroundColor: this.parent.backgroundColor
  });
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

// Draws sprite from spritesheet only!
Renderer.prototype.drawSprite = function(sprite){
  this.app.stage.addChild(sprite);
}

// Placeholder functions
Renderer.prototype.test = function(){
  let jo = new SpriteSheet('img/jo_the_pyro.png', 192, 96, 32)
  this.drawSprite(jo.getSprite(0,0));
}

/**
 * Custom spritesheet object. This will make it easier to automatically pull
 * single sprites from a larger sheet.
 * This class will assume that the individual sprite's height = width.
 */
function SpriteSheet(url, sheetWidth, sheetHeight, spriteSize){
  this.id = url;
  this.texture = PIXI.Texture.fromImage(url)
  this.width = sheetWidth;
  this.height = sheetHeight;
  this.spriteSize = spriteSize;
  // Area of sheet / Area of individual sprites; No remainder. So it better be even!
  this.numberOfSprites = Math.floor((this.width * this.height) / (this.spriteSize ** 2))
}

SpriteSheet.prototype._getRectFromIndex = function(index_X, index_Y){
  size = this.spriteSize;
  let posX = index_X * size;
  let posY = index_Y * size;
  let rectangle = new PIXI.Rectangle(posX, posY, size, size);
  return rectangle;
}

SpriteSheet.prototype.getSprite = function(index_X, index_Y){
  let rect = this._getRectFromIndex(index_X, index_Y);
  this.texture.frame = rect;
  return new PIXI.Sprite(this.texture);
}
