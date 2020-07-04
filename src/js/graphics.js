/**
 * renderer.js contains all of the game's graphics code,
 * everything pixi.js related goes here!
 */

/**
 * The renderer itself.
 */
function Renderer(parent){
  this.parent = parent;
  // Pixi.js loader alias.
  this.loader = new PIXI.Loader();
  this.createTextStyles();
  this.verifyAPI();
  this.createApp();
};

Renderer.prototype.verifyAPI = function(){
  let type = "WebGL";
  if(!PIXI.utils.isWebGLSupported()){
    type = "canvas";
  };
  PIXI.utils.sayHello(type);
};

Renderer.prototype.createApp = function(){
  this.app = new PIXI.Application({
    view: this.parent.context,
    antialias: false,
    width: this.parent.windowWidth,
    height: this.parent.windowHeight,
    backgroundColor: this.parent.backgroundColor
  });
};

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
};

// Texture related methods.

Renderer.prototype.loadTextures = function(imageArray, callback=function(){}){
  let imgLocation = this.parent.imgLocation;
  let imageURLArray = imageArray.map(x => imgLocation + "/" + x);
  this._loadTextureArray(imageURLArray, callback);
};

// Recursion??? :O
// Basically recursively loop through the array and load each image.
// When all the loading is done. Fire off the callback.
Renderer.prototype._loadTextureArray = function(imageURLArray, callback, i=0){
  if(i < imageURLArray.length){
    this.loader.add(imageURLArray[i]);
    func = this._loadTextureArray(imageURLArray, callback, i + 1)
    this.loader.onComplete.add(() => func);
  } else {
    this.loader.load();
    this.loader.onComplete.add(() => {callback()});
  };
};

Renderer.prototype.getTexture = function(imageURL, makeNew=true){
  let resources = this.loader.resources;
  let texture;
  if(makeNew === true){
    texture = new PIXI.Texture(resources[imageURL].texture.baseTexture);
    // This makes the sprites resize a lot cleaner.
    texture.baseTexture.scaleMode = PIXI.SCALE_MODES.NEAREST;
  } else {
    texture = resources[imageURL].texture;
  };

  // Error handling.
  if(texture === undefined){
    console.error(`Error trying to get a texture from ${imageURL}. Returns undefined.`)
  };
  return texture;
};

// Drawing related methods.

Renderer.prototype.draw = function(child){
  this.app.stage.addChild(child);
};

// Clear the screen.
Renderer.prototype.clear = function(){
  this.app.stage.removeChildren();
};

Renderer.prototype.drawText = function(msg, style=this.textStyles.debug, x=0, y=0){
  let message = new PIXI.Text(msg, style);
  message.position.set(x, y);
  this.draw(message);
};

Renderer.prototype.drawRect = function(colour, x, y, width, height){
  let rectangle = new PIXI.Graphics();
  rectangle.beginFill(0x66CCFF);
  rectangle.drawRect(x, y, width, height);
  rectangle.endFill();
  this.draw(rectangle);
};

// Draws sprite from spritesheet only!
Renderer.prototype.drawSprite = function(sprite, x=0, y=0){
  sprite.position.set(x, y)
  if(this.parent.scale > 1){
    let scaleFunc = this.scaleSprite.bind(this);
    sprite = scaleFunc(sprite);
  };
  this.draw(sprite);
};

Renderer.prototype.scaleSprite = function(sprite){
  let scale = this.parent.scale;
  sprite.width *= scale;
  sprite.height *= scale;
  return sprite;
};

// Placeholder functions
Renderer.prototype.test = function(data){
  this.drawText(data.fps);
  this.drawRect(0x66CCFF, 96, 96, 50, 50);
  this.drawSprite(this.testAnim.getSprite(), 96, 96);
  this.testAnim.nextFrame();
};

// For testing purposes. Should only run once.
Renderer.prototype.testInit = function(){
  let parent = this.parent;
  // This is jo_the_pyro.png
  let image = parent.getImage("jtp");
  let imageURL = parent.imgLocation + "/" + image
  let texture = this.getTexture(imageURL);
  let jo = new SpriteSheet(imageURL, texture, 192, 96, 32);
  let anim = parent.getLoadedAsset(parent.animKey).get("jtp_walk_right");
  this.testAnim = new Animation("jtp", jo, anim);
};

/**
 * Custom spritesheet object. This will make it easier to automatically pull
 * single sprites from a larger sheet.
 * This class will assume that an individual sprite's height = width.
 */
function SpriteSheet(imageURL, texture, sheetWidth, sheetHeight, spriteSize){
  this.id = imageURL;
  this.texture = texture
  this.width = sheetWidth;
  this.height = sheetHeight;
  this.spriteSize = spriteSize;
  // Area of sheet / Area of individual sprites; No remainder. So it better be even!
  this.numberOfSprites = Math.floor((this.width * this.height) / (this.spriteSize ** 2))
};

SpriteSheet.prototype._getRectFromIndex = function(index_X, index_Y){
  size = this.spriteSize;
  let posX = index_X * size;
  let posY = index_Y * size;
  let rectangle = new PIXI.Rectangle(posX, posY, size, size);
  return rectangle;
};

SpriteSheet.prototype.getSprite = function(index_X, index_Y){
  let rect = this._getRectFromIndex(index_X, index_Y);
  this.texture.frame = rect;
  return new PIXI.Sprite(this.texture);
};

/**
 * Custom SINGLE sprite animation object.
 * Animation assumes that every frame of the animation is within
 * the spritesheet provided.
 * TODO: Implement loop and non-loop functionality.
*/
function Animation(id, spriteSheet, animationData){
  this.id = id;
  this.spriteSheet = spriteSheet;
  this.frames; // An array of indexes; each index corresponds to the frame's sprite index in the sheet.
  this.currentFrame;
  this.frameIndex;
  this.loops;
  this.defaultSpeed = 8; // Avoid changing this value as much as possible.
  this.speed; // Frames it takes to reach the next animation frame.
  this.type;
  this.counter = 0 // A counter that keeps track of the frames while the animation is active.

  this.parseData(animationData);
};

Animation.prototype.incrementCounter = function(){
  this.counter += 1;
  let complete = false; // Flag; whether the counter = speed; the number of frames to move on.

  if(this.counter >= this.speed){
    this.counter = 0;
    complete = true;
  };
  return complete;
};

// I probably COULD just copy the json stuff directly since js treats them
// as objects anyhow but this is more readable.
Animation.prototype.parseData = function(data){
  this.frames = data.frames;
  this.setDefaultFrame();
  this.loops = data.loops;
  this.speed = (data.speed === "default") ? this.defaultSpeed : data.speed
  this.type = data.type;
};

Animation.prototype.setDefaultFrame = function(){
  this.frameIndex = 0; // Index of first frame in this.frames.
  this.currentFrame = this.frames[this.frameIndex]; // Init. as first frame.
}

// Play this function every frame the animation is active.
Animation.prototype.nextFrame = function(){
  let goToNextFrame = this.incrementCounter(); // goToNextFrame is a flag.

  // If animation completes the period for one frame...
  if(goToNextFrame === true){
    if(this.frameIndex + 1 < this.frames.length){
      this.frameIndex += 1;
      this.currentFrame = this.frames[this.frameIndex];
    } else this.setDefaultFrame(); // Cycle back to start if done animation.
  };
};

Animation.prototype.getSprite = function(){
  let spriteSheet = this.spriteSheet;
  let spriteIndex = this.currentFrame;
  return spriteSheet.getSprite(spriteIndex[0], spriteIndex[1]);
};

// TODO: Animation Manager; would be responsible for linking spriteSheets to animations.
function AnimationManager(){};
