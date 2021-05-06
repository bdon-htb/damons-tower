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
  this.rendererType;
  this.createTextStyles();
  this.createButtonStyles();
  this.verifyAPI();
  this.createApp();
  this.textureManager = new TextureManager(this);
  this.animationManager = new AnimationManager(this);
  this.addListeners(this.parent.context);
  this.isFullscreen = false;
  // Screen ratio compared to intended size.
  this.horizontalRatio = 1;
  this.verticalRatio = 1;
};

Renderer.prototype.verifyAPI = function(){
  this.rendererType = (!PIXI.utils.isWebGLSupported()) ? "canvas" : "WebGL";
  PIXI.utils.sayHello(this.rendererType);
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
  this.textStyles = {
    "default": {
      fontName: "EquipmentPro",
      letterSpacing: 2,
      fontSize: 32
    },
    "debug": {
      fontName: "EquipmentPro",
      letterSpacing: 2,
      fontSize: 16
    }
  };
};

Renderer.prototype.loadBitmapFonts = function(fontsArray, callback){
  for(const fontFile of fontsArray){
    url = this.parent.fontLocation + '/' + fontFile;
    this.loader.add(url);
  };
  this.loader.load();
  this.loader.onComplete.add(callback);
};

Renderer.prototype.createButtonStyles = function(){
  this.buttonStyles = {
    "default": new ButtonStyle()
  };
};

Renderer.prototype.addListeners = function(element){
  element.addEventListener("fullscreenchange", this.fullScreenHandler.bind(this));
};

// Get the size of the renderer view.
Renderer.prototype.getScreenSize = function(){
  if(this.isFullscreen === true){
    return [window.screen.width, window.screen.height]
  } else return [this.app.renderer.width, this.app.renderer.height]
};

Renderer.prototype.resizeScreen = function(newWidth, newHeight){
  this.horizontalRatio = newWidth / this.parent.windowWidth;
  this.verticalRatio = newHeight / this.parent.windowHeight;
  this.app.renderer.resize(newWidth, newHeight);
};

Renderer.prototype.requestFullscreen = function(){
  this.parent.context.requestFullscreen();
};

Renderer.prototype.fullScreenHandler = function(){
  this.isFullscreen = !this.isFullscreen; // Update flag.
};

Renderer.prototype.brightenColor = function(hexString, percentage){
  let colour;
  let difference;
  let rgbArray = this.hex2RGB(hexString);

  for (var i = 0; i < rgbArray.length; i++) {
    colour = rgbArray[i];
    difference = Math.floor((255 - colour) * (percentage / 100));
    colour += difference;

    if(colour > 255){
      colour = 255;
    }
    else if(colour < 0){
      colour = 0;
    }
    rgbArray[i] = colour;
  };
  return this.rgb2Hex(rgbArray[0], rgbArray[1], rgbArray[2]);
};


Renderer.prototype.darkenColor = function(hexString, percentage){
  let colour;
  let rgbArray = this.hex2RGB(hexString);

  for (var i = 0; i < rgbArray.length; i++) {
    colour = rgbArray[i];
    colour = Math.floor(colour * (percentage / 100));

    if(colour > 255){
      colour = 255;
    }
    else if(colour < 0){
      colour = 0;
    }
    rgbArray[i] = colour;
  };
  return this.rgb2Hex(rgbArray[0], rgbArray[1], rgbArray[2]);
};

Renderer.prototype.rgb2Hex = function(red, green, blue){
  let hexString = '';

  for(let colour of [red, green, blue]){
    colour = Number(colour).toString(16);
    if(colour.length < 2){colour = "0" + colour};
    hexString += colour
  };
  return '#' + hexString;
};

Renderer.prototype.hex2RGB = function(hexString){
  hexString = (hexString).replace("0x", "").replace("#", "")
  red = hexString.slice(0, 2);
  green = hexString.slice(2, 4);
  blue = hexString.slice(4, 6);

  rgbArray = [red, green, blue];
  for (var i = 0; i < rgbArray.length; i++) {
    rgbArray[i] = parseInt(rgbArray[i], 16);
  };
  return rgbArray;
};

// ========================
// Texture related methods.
// ========================

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

// ========================
// Drawing related methods.
// ========================

Renderer.prototype.draw = function(child){
  this.app.stage.addChild(child);
};

// scale child to appropriate size.
Renderer.prototype.scale = function(child){
  let scaledX = child.x * this.horizontalRatio;
  let scaledY = child.y * this.verticalRatio;
  child = child.setTransform(scaledX, scaledY, this.horizontalRatio, this.verticalRatio)
  return child;
};

// Clear the screen.
Renderer.prototype.clear = function(){
  if(this.textureManager.pool.size > 0){
    this.textureManager.clearPool();
  };
  this.app.stage.removeChildren();
};

// Drawining primitives.
Renderer.prototype.drawText = function(msg, x=0, y=0, style="default"){
  let message;
  if(msg.constructor === PIXI.BitmapText){
    message = msg;
  } else { // Assume message is a string.
    message = new PIXI.BitmapText(String(msg), this.textStyles[style]);
    this.textureManager.addToPool(message);
  };
  message.position.set(x, y);
  message = this.scale(message);
  this.draw(message);
};

Renderer.prototype.drawRect = function(colour, x, y, width, height){
  let rectangle = new PIXI.Graphics();
  rectangle.beginFill(colour);
  rectangle.drawRect(x, y, width, height);
  rectangle.endFill();
  this.textureManager.addToPool(rectangle);
  rectangle = this.scale(rectangle);
  this.draw(rectangle);
};

Renderer.prototype.drawLine = function(colour, startX, startY, endX, endY, thickness=1){
  let line = new PIXI.Graphics();
  line.lineStyle(thickness, colour, 1);
  line.moveTo(startX, startY);
  line.lineTo(endX, endY);
  this.textureManager.addToPool(line);
  line = this.scale(line);
  this.draw(line);
}

// Draws sprite from spritesheet only!
Renderer.prototype.drawSprite = function(sprite, x=0, y=0){
  let spriteScale = this.parent.spriteScale;
  sprite.width = sprite.texture.width * spriteScale * this.horizontalRatio;
  sprite.height = sprite.texture.width * spriteScale * this.verticalRatio;
  sprite.position.set(x * this.horizontalRatio, y * this.verticalRatio);
  this.draw(sprite);
};

// Draw a game entity. i.e. player.
// Remember that player coordinates represent their center values.
Renderer.prototype.drawEntity = function(scene, gameEntity){
  let camera = scene.camera;
  // We subtract half width and height to get the entity's topLeft.
  let topLeftX = (gameEntity.attributes["x"] - (gameEntity.attributes["width"] / 2)) * this.parent.spriteScale;
  let topRightY = (gameEntity.attributes["y"] - (gameEntity.attributes["height"] / 2)) * this.parent.spriteScale;
  let relativePos = camera.getRelative(topLeftX, topRightY);
  this.drawSprite(gameEntity.attributes["sprite"], relativePos[0], relativePos[1]);
};

// Draws all tiles in view of the camera.
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
    if(tileMap.tileIsEmpty(index) === true){
      continue;
    };

    coords = tileMap.convertPos(index); // Convert -> 2d;
    pos_X = coords[0] * spriteSheet.spriteSize * this.parent.spriteScale;
    pos_Y = coords[1] * spriteSheet.spriteSize * this.parent.spriteScale;
    newPosArray = camera.getRelative(pos_X, pos_Y);
    pos_X = newPosArray[0];
    pos_Y = newPosArray[1];
    let tileRect = new Rect([pos_X, pos_Y], spriteSheet.spriteSize * this.parent.spriteScale);

    if(camera.rectInView(tileRect) === true){
      spriteIndexArray = tileMap.getSpriteIndex(index);
      tileSprite = textureManager.copySprite(spriteSheet.sprite);
      frame = textureManager.getRectFromSheet(spriteSheet, spriteIndexArray[0], spriteIndexArray[1]);
      tileSprite.texture.frame = frame;
      this.drawSprite(tileSprite, pos_X, pos_Y);
    };
  };
};

// =====================
// Menu related methods.
// =====================

Renderer.prototype.drawMenu = function(menu){
  menu.guiObjects.forEach(e => this.drawGUIObject(e));
};

// Shorthand method.
Renderer.prototype.drawGUIObject = function(entity){
  let graphic;
  graphic = this.createGUIGraphic(entity);
  graphic.position.set(entity.x, entity.y)
  graphic = this.scale(graphic);
  this.textureManager.addToPool(graphic);
  this.draw(graphic);
};

Renderer.prototype.createGUIGraphic = function(entity){
  let graphic;
  let createGraphicFunc;
  switch(entity.constructor){
    case Label:
      createGraphicFunc = this.createLabelGraphic.bind(this);
      break;
    case Button:
      if(entity.state === "hover"){
        createGraphicFunc = this.createButtonOverlay.bind(this);
      } else createGraphicFunc = this.createButtonGraphic.bind(this);
      break;
    case ListWidget:
      createGraphicFunc = this.createListWidgetGraphic.bind(this);
      break;
    default:
      console.error(`Error while trying to create the GUIObject's graphic" ${entity} is an invalid GUIObject.`);
  };
  return createGraphicFunc(entity)
};

// Calculate and return the size of the entity by creating a dummy graphic.
Renderer.prototype.getEntitySize = function(entity){
  let createGraphicFunc = this.createGUIGraphic.bind(this);

  let dummy = createGraphicFunc(entity);
  this.textureManager.addToPool(dummy)
  return [dummy.width, dummy.height];
};

Renderer.prototype.createLabelGraphic = function(label){
  let message = label.text;
  let style = label.attributes.has("style") ? label.attributes.get("style") : "default";
  style = this.textStyles[style];
  let text = new PIXI.BitmapText(message, style);
  return text
};

Renderer.prototype.createButtonOverlay = function(button){
  let buttonStyle = button.attributes.has("buttonStyle") ? label.attributes.get("buttonStyle") : "default";

  let overlayStyle = new ButtonStyle(this.buttonStyles[buttonStyle]);
  overlayStyle.color = this.brightenColor(overlayStyle.color, 20);
  overlayStyle.color = (overlayStyle.color).replace("#", "0x")

  overlayStyle.borderColor = this.brightenColor(overlayStyle.borderColor, 20);
  overlayStyle.borderColor = (overlayStyle.borderColor).replace("#", "0x")
  let overlayRect = this.configureButtonRect(overlayStyle);
  let overlay = this.createButtonGraphic(button, overlayRect);
  return overlay;
};

// Create the button graphic. rectangle is an OPTIONAL parameter.
Renderer.prototype.createButtonGraphic = function(button, rectangle){
  let minimumWidth = 150;
  let minimumHeight = 50;
  let container = new PIXI.Container();
  let textStyle = button.attributes.has("textStyle") ? label.attributes.get("textStyle") : "default";
  let buttonStyle = button.attributes.has("buttonStyle") ? label.attributes.get("buttonStyle") : "default";

  // Create label component.
  let message = button.text;
  let text = new PIXI.BitmapText(message, this.textStyles[textStyle]);

  // Create button component.

  if(rectangle === undefined){
    rectangle = this.configureButtonRect(this.buttonStyles[buttonStyle]);
  };

  let rectangleWidth = (text.width < minimumWidth) ? minimumWidth : text.width;
  let rectangleHeight = (text.height < minimumHeight) ? minimumHeight: text.height;
  rectangle.drawRect(0, 0, rectangleWidth, rectangleHeight);
  rectangle.endFill();

  // Center text within containing rectangle.
  let center = [(rectangleWidth / 2) - (text.width / 2), (rectangleHeight / 2) - (text.height / 2)]
  text.position.set(center[0], center[1]);

  // Combine them into the container.
  container.addChild(rectangle);
  container.addChild(text);

  return container;
};

// TODO: Implement basic styling to make it look cleaner.
Renderer.prototype.configureButtonRect = function(buttonStyle){
  let rectangle = new PIXI.Graphics();
  rectangle.lineStyle(buttonStyle.borderThickness, buttonStyle.borderColor, buttonStyle.alpha)
  rectangle.beginFill(buttonStyle.color);
  return rectangle;
};

Renderer.prototype.createListWidgetGraphic = function(listWidget){
  let container = new PIXI.Container();
  // Add child graphics to container.
  let itemGraphic;
  for(const item of listWidget.listItems){
    itemGraphic = this.createGUIGraphic(item);
    itemGraphic.position.set(item.x - listWidget.x, item.y - listWidget.y);
    container.addChild(itemGraphic);
  };
  return container;
};

// Caluclates the size of the string in pixels based on PIXI text styling.
Renderer.prototype.calculateTextSize = function(s, textStyle){
  let text = new PIXI.BitmapText(s, textStyle);
  this.textureManager.addToPool(text);
  return [text.width, text.height];
};

/**
 * Custom texture manager. Will be responsible for the loading, creation and destruction of
 * all textures / sprites.
*/
function TextureManager(parent){
  this.parent = parent; // Reference to the renderer.
  this.loader = this.parent.loader;
  this.pool = new Set(); // An array of extra Pixi.js graphics objects. Allows for them to be destroyed properly..
};

// Add the Pixi.js object to the pool.
TextureManager.prototype.addToPool = function(object){
  this.pool.add(object);
};

// Destroy Pixi.js graphics object.
TextureManager.prototype.destroyObject = function(object){
  switch(object.constructor){
    case PIXI.Container:
    case PIXI.Text:
    case PIXI.Graphics:
      object.destroy(true);
      break;
    default:
      object.destroy();
  };
};

// Destroys all objects in pool and empty it.
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

TextureManager.prototype.removeFromTextureCache = function(id, cache=undefined){
  if(cache === undefined){cache = PIXI.utils.TextureCache};

  if(cache[id]){
    delete cache[id];
  } else console.error(`Error while trying to delete from TextureCache: ${id} does not exist as a property.`);
};

// Remove all textures from TextureCache.
// clearAll affects whether non-generic textures should be removed too.
TextureManager.prototype.clearTextureCache = function(clearAll=false){
  let generic = "pixiid";
  if(clearAll === true){
    PIXI.utils.clearTextureCache();
  } else {
    let cache = PIXI.utils.TextureCache;
    Object.keys(cache).forEach(key => {
      if(key.startsWith(generic) === true){this.removeFromTextureCache(key)};
    });

    cache = PIXI.utils.BaseTextureCache;
    Object.keys(cache).forEach(key => {
      if(key.startsWith(generic) === true){this.removeFromTextureCache(key, cache)};
    });
  };
};

// Make a sprite from a given texture.
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

// Create a spritesheet from the given id.
// Note: Copies of spritesheets must be made because of framining issues with shared spritesheets.
TextureManager.prototype.getSheetFromId = function(id){
  let engine = this.parent.parent;
  let image = engine.getImage(id);
  let imageURL = engine.imgLocation + "/" + image.name;
  let texture = this.getTexture(imageURL);
  let sprite = this.getSprite(texture);
  return new SpriteSheet(imageURL, texture, sprite, image.width, image.height, image.spriteSize);
};

// Calculate and return the pixi texture frame of the specified sprite from the spritesheet.
TextureManager.prototype.getRectFromSheet = function(spriteSheet, index_X, index_Y){
  size = spriteSheet.spriteSize;
  let posX = index_X * size;
  let posY = index_Y * size;

  let rectangle = new PIXI.Rectangle(posX, posY, size, size);
  return rectangle;
};

// Get the actual sprite from the spritesheet.
TextureManager.prototype.getSpriteFromSheet = function(spriteSheet, index_X, index_Y){
  let rect = this.getRectFromSheet(spriteSheet, index_X, index_Y);
  spriteSheet.sprite.texture.frame = rect;
  return spriteSheet.sprite;
};

// Loop through the array and load each image.
// When all the loading is done. Fire off the callback.
TextureManager.prototype._loadTextureArray = function(imageArray, imageMap, callback, i=0){
  let engine = this.parent.parent;
  let id;
  let url;

  for(const imageID of imageArray){
    url = engine.imgLocation + "/" + imageMap.get(imageID).name;
    this.loader.add(url);
  };

  this.loader.load();
  this.loader.onComplete.add(callback);
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

/**
 * Custom SINGLE sprite animation object.
 * Animation assumes that every frame of the animation is within
 * the spritesheet provided.
*/
function Animation(id, spriteSheet, animationData){
  this.id = id;
  this.spriteSheet = spriteSheet;
  this.frames = animationData.frames; // An array of indexes; each index corresponds to the frame's sprite index in the sheet.
  this.currentFrame = this.frames[0];
  this.frameIndex = 0;
  this.active = false;
  this.loops = animationData.loops;
  this._defaultSpeed = 8; // Avoid changing this value as much as possible.
  this.speed = (animationData.speed === "default") ? this._defaultSpeed : animationData.speed; // Frames it takes to reach the next animation frame.
  this.type = animationData.type;
  this.counter = 0; // A counter that keeps track of the frames while the animation is active.
};

/**
 * Animation manager. Responsible for linking spritesheets to animations,
 * moving to the next frame, etc.
*/
function AnimationManager(parent){
  this.parent = parent; // Reference to the renderer.
};

AnimationManager.prototype.setFrame = function(animation, index){
  animation.frameIndex = index;
  animation.currentFrame = animation.frames[index];
};

AnimationManager.prototype.setDefaultFrame = function(animation){
  this.setFrame(animation, 0);
};

// Play this function every frame the animation is active.
AnimationManager.prototype.nextFrame = function(animation){
  if(animation.active === false){return}; // Stop any incrementing if the animation is inactive.

  let goToNextFrame = this._incrementCounter(animation); // goToNextFrame is a flag.

  // If animation completes the period for one frame...
  if(goToNextFrame === true){
    // If there are still frames in the animation...
    if(animation.frameIndex + 1 < animation.frames.length){
      this.setFrame(animation, animation.frameIndex + 1); // Set to the next frame.
    }
    // If the animation is complete and it DOESN'T loop
    else if(animation.frameIndex + 1 >= animation.frames.length && this.loops === false){
      this.deactivateAnimation(animation);
    }
    // Else; if the animation is complete and the animation DOES loop.
    else {
      this.setDefaultFrame(animation); // Cycle back to start if done animation.
    };
  };
};

// Get the sprite of the current frame in animation.
AnimationManager.prototype.getSprite = function(animation){
  let spriteSheet = animation.spriteSheet;
  let spriteIndex = animation.currentFrame;
  return this.parent.textureManager.getSpriteFromSheet(spriteSheet, spriteIndex[0], spriteIndex[1]);
};

AnimationManager.prototype.activateAnimation = function(animation){
  animation.active = true;
};

AnimationManager.prototype.deactivateAnimation = function(animation){
  animation.active = false;
  this.setDefaultFrame(animation);
};

AnimationManager.prototype._incrementCounter = function(animation){
  animation.counter += 1;
  let complete; // Flag; whether the counter = speed; the number of frames to move on.

  if(animation.counter >= animation.speed){
    animation.counter = 0;
    complete = true;
  } else complete = false;
  return complete;
};
