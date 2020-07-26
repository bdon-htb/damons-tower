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

Renderer.prototype.loadTextures = function(imageMap, callback=function(){}){
  let imageArray = Array.from(imageMap.keys());
  this._loadTextureArray(imageArray, imageMap, callback);
};

// Recursion??? :O
// Basically recursively loop through the array and load each image.
// When all the loading is done. Fire off the callback.
Renderer.prototype._loadTextureArray = function(imageArray, imageMap, callback, i=0){
  if(i < imageArray.length){
    let id = imageArray[i];
    let url = this.parent.imgLocation + "/" + imageMap.get(id).name
    this.loader.add(url);
    func = this._loadTextureArray(imageArray, imageMap, callback, i + 1)
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

// Generate a spritesheet from it's defined id in parent.assets.
Renderer.prototype.getSheetFromId = function(id){
  let parent = this.parent;
  let image = parent.getImage(id);
  let imageURL = parent.imgLocation + "/" + image.name;
  let texture = this.getTexture(imageURL);
  return new SpriteSheet(imageURL, texture, image.width, image.height, image.spriteSize);
}

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
  rectangle.beginFill(colour);
  rectangle.drawRect(x, y, width, height);
  rectangle.endFill();
  this.draw(rectangle);
};

Renderer.prototype.drawLine = function(colour, startX, startY, endX, endY, thickness=1){
  let line = new PIXI.Graphics();
  line.lineStyle(thickness, colour, 1);
  line.moveTo(startX, startY);
  line.lineTo(endX, endY);
  this.draw(line);
}

// Draws sprite from spritesheet only!
Renderer.prototype.drawSprite = function(sprite, x=0, y=0){
  if(this.parent.scale > 1){
    let scaleFunc = this.scaleSprite.bind(this);
    sprite = scaleFunc(sprite);
  };
  sprite.position.set(x, y);
  this.draw(sprite);
};

Renderer.prototype.scaleSprite = function(sprite){
  let scale = this.parent.scale;
  sprite.width *= scale;
  sprite.height *= scale;
  return sprite;
};

/* Currently obsolete.
Renderer.prototype.drawTiles = function(scene){
  let tileMap = scene.tileMap
  let tilesArray = tileMap.tiles;
  let spriteSheet = scene.spriteSheet;
  for (let index = 0; index < tilesArray.length; index++){
    let coords = tileMap.convertPos(index); // Convert -> 2d;
    let pos_X = coords[0] * spriteSheet.spriteSize * this.parent.scale;
    let pos_Y = coords[1] * spriteSheet.spriteSize * this.parent.scale;

    let spriteIndexArray = tileMap.getSpriteIndex(index);
    let tileSprite = spriteSheet.getSprite(spriteIndexArray[0], spriteIndexArray[1]);
    this.drawSprite(tileSprite, pos_X, pos_Y);
  };
};
*/

Renderer.prototype.drawInView = function(scene){
  let tileMap = scene.tileMap;
  let tilesArray = tileMap.tiles;
  let spriteSheet = scene.spriteSheet;
  let camera = scene.camera;
  for (let index = 0; index < tilesArray.length; index++){
    let coords = tileMap.convertPos(index); // Convert -> 2d;
    let pos_X = coords[0] * spriteSheet.spriteSize * this.parent.scale;
    let pos_Y = coords[1] * spriteSheet.spriteSize * this.parent.scale;

    if(camera.inView(pos_X, pos_Y) === true){
      let spriteIndexArray = tileMap.getSpriteIndex(index);
      let tileSprite = spriteSheet.getSprite(spriteIndexArray[0], spriteIndexArray[1]);
      let newPosArray = camera.getRelative(pos_X, pos_Y);
      pos_X = newPosArray[0];
      pos_Y = newPosArray[1];
      this.drawSprite(tileSprite, pos_X, pos_Y);
    };
  };
};

/**
 * Custom spritesheet object. This will make it easier to automatically pull
 * single sprites from a larger sheet.
 * This class will assume that an individual sprite's height = width.
 */
 // TODO: Constantly creating a texture is likely responsible for the game using a lot of memory.
 // Find a way for proper texture reuse and/or destruction to save memory.
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
  let texture = new PIXI.Texture(this.texture);
  texture.frame = rect;
  return new PIXI.Sprite(texture);
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
  this.counter = 0; // A counter that keeps track of the frames while the animation is active.

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
// If I really want to follow the entity system. I should move all the animation methods
// to here. There could be thousands of animations loaded at once and they don't all
// need their own functions to save space.
function AnimationManager(){};
