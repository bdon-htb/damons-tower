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
  this.textureManager = new TextureManager(this);
};

Renderer.prototype.verifyAPI = function(){
  let type = "WebGL";
  if(!PIXI.utils.isWebGLSupported()){
    type = "canvas";
  };
  PIXI.utils.sayHello(type);
};

Renderer.prototype.createApp = function(){
  // This makes the sprites resize a lot cleaner.
  PIXI.settings.SCALE_MODE = PIXI.SCALE_MODES.NEAREST;

  this.app = new PIXI.Application({
    view: this.parent.context,
    antialias: false,
    width: this.parent.windowWidth,
    height: this.parent.windowHeight,
    backgroundColor: this.parent.backgroundColor,
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
  this.textureManager.loadTextures(imageMap, callback);
};

Renderer.prototype.getTexture = function(imageURL, makeNew=true){
  this.textureManager.getTexture(imageURL, makeNew);
};

// Generate a spritesheet from it's defined id in parent.assets.
Renderer.prototype.getSheetFromId = function(id){
  let spriteSheet = this.textureManager.getSheetFromId(id);
  return spriteSheet;
};

// Drawing related methods.

Renderer.prototype.draw = function(child){
  this.app.stage.addChild(child);
};

// Clear the screen.
Renderer.prototype.clear = function(){
  if(this.textureManager.pool.size > 0){
    this.textureManager.clearPool();
  };
  this.app.stage.removeChildren();
};

Renderer.prototype.drawText = function(msg, style=this.textStyles.debug, x=0, y=0){
  let canvas = this.parent.context;
  let message;
  if(msg.constructor === PIXI.Text){
    message = msg;
  } else { // Assume message is a string.
    message = new PIXI.Text(msg, style);
    this.textureManager.addToPool(message);
  };
  message.position.set(x, y);
  this.draw(message);
};

Renderer.prototype.drawRect = function(colour, x, y, width, height){
  let rectangle = new PIXI.Graphics();
  rectangle.beginFill(colour);
  rectangle.drawRect(x, y, width, height);
  rectangle.endFill();
  this.textureManager.addToPool(rectangle);
  this.draw(rectangle);
};

Renderer.prototype.drawLine = function(colour, startX, startY, endX, endY, thickness=1){
  let line = new PIXI.Graphics();
  line.lineStyle(thickness, colour, 1);
  line.moveTo(startX, startY);
  line.lineTo(endX, endY);
  this.textureManager.addToPool(line);
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
  sprite.width = sprite.texture.width * scale;
  sprite.height = sprite.texture.width * scale;
  return sprite;
};

// Draws all tiles in view of the camera.
// TODO: FIrst of all, give this a better name.
Renderer.prototype.drawTiles = function(scene){
  let tileMap = scene.tileMap;
  let tilesArray = tileMap.tiles;
  let spriteSheet = scene.spriteSheet;
  let camera = scene.camera;
  let textureManager = this.textureManager;

  let coords;
  let pos_X;
  let pos_Y;
  let spriteIndexArray;
  let frame;
  let tileSprite;
  let newPosArray;
  for (let index = 0; index < tilesArray.length; index++){
    coords = tileMap.convertPos(index); // Convert -> 2d;
    pos_X = coords[0] * spriteSheet.spriteSize * this.parent.scale;
    pos_Y = coords[1] * spriteSheet.spriteSize * this.parent.scale;
    newPosArray = camera.getRelative(pos_X, pos_Y);
    pos_X = newPosArray[0];
    pos_Y = newPosArray[1];
    let tileRect = new Rect([pos_X, pos_Y], spriteSheet.spriteSize * this.parent.scale);

    if(camera.rectInView(tileRect) === true){
      spriteIndexArray = tileMap.getSpriteIndex(index);
      frame = spriteSheet.getFrame(spriteIndexArray[0], spriteIndexArray[1]);
      tileSprite = textureManager.copySprite(spriteSheet.sprite);
      tileSprite.texture.frame = frame;
      this.drawSprite(tileSprite, pos_X, pos_Y);
    };
  };
};

// Menu related methods.
Renderer.prototype.drawMenu = function(menu){
  menu.entities.forEach(e => this.drawGUIObject(e));
};

// Shorthand method.
Renderer.prototype.drawGUIObject = function(entity){
  switch(entity.constructor){
    case Label:
      this.drawLabel(entity);
      break;
    case Button:
      this.drawButton(entity);
      break;
    default:
      console.error(`Error when trying to draw GUIObject: ${entity} is an invalid GUIObject.`);
  };
};

// TODO: Implement basic styling to make it look cleaner.
Renderer.prototype.drawLabel = function(label){
  let drawText = this.drawText.bind(this);
  drawText(label.text, label.textStyle, label.x, label.y);
};

Renderer.prototype.drawButton = function(button){
  let text = new PIXI.Text(button.text, button.textStyle);
  let drawRect = this.drawRect.bind(this);
  let drawText = this.drawText.bind(this);
  let center = [button.x + button.width / 4, button.y + button.height / 4];
  drawRect(0x66CCFF, button.x, button.y, button.width * 1.5, button.height * 1.5);
  drawText(button.text, button.textStyle, center[0], center[1]);
};

// Caluclates the size of
Renderer.prototype.calculateTextSize = function(s, textStyle){
  let text = new PIXI.Text(s, textStyle);
  this.textureManager.addToPool(text);
  return [text.width, text.height];
};

/**
 * Custom texture manager. Will be responsible for the loading, creation and destruction of
 * all textures.
*/
function TextureManager(parent){
  this.parent = parent; // Reference to the renderer.
  this.loader = new PIXI.Loader();
  this.pool = new Set(); // An array of extra Pixi.js graphics objects. Allows for them to be destroyed properly..
};

// Add the Pixi.js object to the pool.
TextureManager.prototype.addToPool = function(object){
  this.pool.add(object);
};

// Destroy Pixi.js graphics object.
TextureManager.prototype.destroyObject = function(object){
  switch(object.constructor){
    case PIXI.Text:
    case PIXI.Graphics:
      object.destroy(true);
      break;
    default:
      object.destroy();
  };
};
// Destroys all objects in pool and empties it.
// Assumes all objects in this.pool are Pixi.js objects that has .destroy().
TextureManager.prototype.clearPool = function(){
  this.pool.forEach(e => this.destroyObject(e));
  this.pool.clear();
  this.clearTextureCache();
};

TextureManager.prototype.loadTextures = function(imageMap, callback=function(){}){
  let imageArray = Array.from(imageMap.keys());
  this._loadTextureArray(imageArray, imageMap, callback);
};

// Basically recursively loop through the array and load each image.
// When all the loading is done. Fire off the callback.
TextureManager.prototype._loadTextureArray = function(imageArray, imageMap, callback, i=0){
  let engine = this.parent.parent;

  if(i < imageArray.length){
    let id = imageArray[i];
    let url = engine.imgLocation + "/" + imageMap.get(id).name
    this.loader.add(url);
    func = this._loadTextureArray(imageArray, imageMap, callback, i + 1)
    this.loader.onComplete.add(() => func);
  } else {
    this.loader.load();
    this.loader.onComplete.add(() => {callback()});
  };
};

// Get the specified texture from loader.resources. By default
// it returns a copy of the texture.
TextureManager.prototype.getTexture = function(imageURL, makeNew=true){
  let resources = this.loader.resources;
  let texture;
  if(makeNew === true){
    texture = new PIXI.Texture(resources[imageURL].texture.baseTexture);
  } else {
    texture = resources[imageURL].texture;
  };

  // Error handling.
  if(texture === undefined){
    console.error(`Error trying to get a texture from ${imageURL}. Returns undefined.`);
  };

  return texture;
};

// Return a copy of the given texture.
// If the pool parameter is seto true then the texture will automatically be added to the pool.
TextureManager.prototype.copyTexture = function(texture, pool=true){
  // Error handling.
  if(texture.constructor !== PIXI.Texture){
    console.error(`Error trying to copy texture. Detected texture: ${texture}. Texture constructor: ${texture.constructor}`);
  } else {
    let newTexture = new PIXI.Texture(texture);
    if(pool === true){this.addToPool(newTexture)};
    return newTexture;
  };
};

TextureManager.prototype.removeFromTextureCache = function(id){
  let cache = PIXI.utils.TextureCache;
  if(cache[id]){
    console.log("deleted")
    delete cache[id];
  } else console.error(`Error while trying to delete from TextureCache: ${id} does not exist as a property.`);
};

TextureManager.prototype.clearTextureCache = function(clearAll=false){
  PIXI.utils.clearTextureCache();
}

// Make a sprite from a given texture
TextureManager.prototype.getSprite = function(texture){
  // Error handling.
  if(texture.constructor !== PIXI.Texture){
    console.error(`Error trying to create a new sprite. Detected texture: ${texture}. Texture constructor: ${texture.constructor}`);
  } else {
    let sprite = new PIXI.Sprite(texture);
    return sprite;
  };
};

// Return a copy of the given sprite. By default the sprite will be added to the pool.
TextureManager.prototype.copySprite = function(sprite, pool=true){
  // Error handler.
  if(sprite.constructor !== PIXI.Sprite){
    console.error(`Error trying to copy texture. Detected texture: ${texture}. Texture constructor: ${texture.constructor}`);
  } else {
    let newTexture = this.copyTexture(sprite.texture);
    let newSprite = new PIXI.Sprite(newTexture);
    if(pool === true){this.addToPool(newSprite)};
    return newSprite;
  };
};

TextureManager.prototype.getSheetFromId = function(id){
  let engine = this.parent.parent;
  let image = engine.getImage(id);
  let imageURL = engine.imgLocation + "/" + image.name;
  let texture = this.getTexture(imageURL);
  let sprite = this.getSprite(texture);
  return new SpriteSheet(imageURL, texture, sprite, image.width, image.height, image.spriteSize);
};

/**
 * Custom spritesheet object. This will make it easier to automatically pull
 * single sprites from a larger sheet.
 * This class will assume that an individual sprite's height = width.
 */
function SpriteSheet(imageURL, texture, sprite, sheetWidth, sheetHeight, spriteSize){
  this.id = imageURL;
  this.sprite = sprite;
  this.texture = texture;
  this.width = sheetWidth;
  this.height = sheetHeight;
  this.spriteSize = spriteSize;
  // Area of sheet / Area of individual sprites; No remainder. So it better be even!
  this.numberOfSprites = Math.floor((this.width * this.height) / (this.spriteSize ** 2))
};

// Calculate and return the texture frame of the specified sprite.
SpriteSheet.prototype.getFrame = function(index_X, index_Y){
  size = this.spriteSize;
  let posX = index_X * size;
  let posY = index_Y * size;

  let rectangle = new PIXI.Rectangle(posX, posY, size, size);
  return rectangle;
};

SpriteSheet.prototype.getSprite = function(index_X, index_Y, makeNew){
  let rect = this.getFrame(index_X, index_Y);
  this.sprite.texture.frame = rect;
  return this.sprite;
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
