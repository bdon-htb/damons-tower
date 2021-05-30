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

// This is only relevant for buttons that are NOT sprite-based.
Renderer.prototype.createButtonStyles = function(){
  this.buttonStyles = {
    "default": new ButtonStyle({guiCustomStyle: "roundButton"}),
    "roundButtonHover": new ButtonStyle({guiCustomStyle: "roundButtonHover"}),
    "roundButtonPressed": new ButtonStyle({guiCustomStyle: "roundButtonPressed"}),
    "roundButtonDisabled": new ButtonStyle({guiCustomStyle: "roundButtonDisabled"}),
    "squareButton": new ButtonStyle({guiCustomStyle: "squareButton"}),
    "squareButtonHover": new ButtonStyle({guiCustomStyle: "squareButtonHover"}),
    "squareButtonPressed": new ButtonStyle({guiCustomStyle: "squareButtonPressed"}),
    "squareButtonDisabled": new ButtonStyle({guiCustomStyle: "squareButtonDisabled"}),
    "debug": new ButtonStyle()
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
  if(sprite === null){return};

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

// Draw an effect with respect to the source entity.
Renderer.prototype.drawEffect = function(scene, gameEntity, effectAnim){
  let camera = scene.camera;
  let offsetX = effectAnim.offsetX * this.parent.spriteScale;
  let offsetY = effectAnim.offsetY * this.parent.spriteScale;
  let topLeftX = (gameEntity.attributes["x"] - (gameEntity.attributes["width"] / 2)) * this.parent.spriteScale;
  let topRightY = (gameEntity.attributes["y"] - (gameEntity.attributes["height"] / 2)) * this.parent.spriteScale;
  let relativePos = camera.getRelative(topLeftX + offsetX, topRightY + offsetY);
  this.drawSprite(this.animationManager.getSprite(effectAnim), relativePos[0], relativePos[1]);
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
      this.textureManager.setTextureFrame(tileSprite.texture, frame);
      this.drawSprite(tileSprite, pos_X, pos_Y);
    };
  };
};

// =====================
// Menu related methods.
// =====================

Renderer.prototype.drawMenu = function(menu){
  menu.frames.forEach(f => this.drawGUIObject(f));
  menu.guiObjects.forEach(e => this.drawGUIObject(e));
};

Renderer.prototype.drawGUIObject = function(entity){
  let graphic;
  switch(entity.constructor){
    case Button:
      if(entity.state === "hover"){graphic = entity.overlayGraphic}
      else if(entity.state === "pressed"){graphic = entity.pressedGraphic}
      else if(entity.state === "disabled"){graphic = entity.disabledGraphic}
      else {graphic = entity.graphic};
      break;
    case ListWidget:
      // We draw its children individually because ListWidget.graphic doesn't account for entity state.
      entity.frames.forEach(f => this.drawGUIObject(f));
      entity.listItems.forEach(e => this.drawGUIObject(e));
      return;
    case ArrowSelect:
      this.drawGUIObject(entity.leftBtn);
      this.drawGUIObject(entity.rightBtn);
      if(entity.options.length > 0){this.drawGUIObject(entity.options[entity.currentIndex])};
      return;
    default:
      graphic = entity.graphic;
  };

  graphic.position.set(entity.x * this.horizontalRatio, entity.y * this.verticalRatio)
  this.draw(graphic);
};

// Shorthand method.
/*
Renderer.prototype.drawGUIObject = function(entity){
  let graphic;
  graphic = this.createGUIGraphic(entity);
  graphic.position.set(entity.x, entity.y)
  graphic = this.scale(graphic);
  this.textureManager.addToPool(graphic);
  this.draw(graphic);
};
*/

/*
Renderer.prototype.createGUIGraphic = function(entity){
  let graphic;
  let createGraphicFunc;
  switch(entity.constructor){
    case Label:
      createGraphicFunc = this.createLabelGraphic.bind(this);
      break;
    case Button:
      switch(entity.state){
        case "pressed":
        case "hover":
          createGraphicFunc = this.createButtonOverlay.bind(this);
          break;
        default:
          createGraphicFunc = this.createButtonGraphic.bind(this);
        }
      break;
    case ListWidget:
      createGraphicFunc = this.createListWidgetGraphic.bind(this);
      break;
    default:
      console.error(`Error while trying to create the GUIObject's graphic" ${entity} is an invalid GUIObject.`);
  };
  return createGraphicFunc(entity)
};
*/

Renderer.prototype.setGUIGraphic = function(entity){
  let graphic;
  let createGraphicFunc;
  switch(entity.constructor){
    case Label:
      createGraphicFunc = this.createLabelGraphic.bind(this);
      break;
    case Button:
      createGraphicFunc = this.createButtonOverlay.bind(this);
      entity.overlayGraphic = createGraphicFunc(entity, "Hover");
      entity.pressedGraphic = createGraphicFunc(entity, "Pressed");
      entity.disabledGraphic = createGraphicFunc(entity, "Disabled");

      createGraphicFunc = this.createButtonGraphic.bind(this);
      break;
    case ListWidget:
      createGraphicFunc = this.createListWidgetGraphic.bind(this);
      break;
    case Frame:
      createGraphicFunc = this.createFrameGraphic.bind(this);
      break;
    case ImageWidget:
      createGraphicFunc = this.createImageGraphic.bind(this);
      break;
    case ArrowSelect:
      // Note: This function is also responsible for setting the graphics of its labels and buttons.
      createGraphicFunc = this.createArrowSelectGraphic.bind(this);
      break;
    default:
      console.error(`Error while trying to create the GUIObject's graphic" ${entity} is an invalid GUIObject.`);
  };

  entity.graphic = createGraphicFunc(entity);
};

/*
// Calculate and return the size of the entity by creating a dummy graphic.
Renderer.prototype.getEntitySize = function(entity){
  let createGraphicFunc = this.createGUIGraphic.bind(this);

  let dummy = createGraphicFunc(entity);
  this.textureManager.addToPool(dummy)
  return [dummy.width, dummy.height];
};
*/

Renderer.prototype.createCustomGUIRectGraphic = function(guiName, width, height){
  let engine = this.parent;
  let spriteScale = engine.spriteScale;
  // let spriteScale = engine.spriteScale;
  let textureManager = this.textureManager;
  let guiConfig = engine.assets.get(engine.guiConfigKey);
  let guiData = guiConfig.get(guiName);
  let cornerData = guiData["corners"];
  let edgeData = guiData["edges"];
  let spriteSheet = this.getSheetFromId(guiConfig.get("METADATA")["spriteSheet"]);

  let container = new PIXI.Container();

  // Fill the container with the fill colour.
  let fillColour = guiData["fillColour"].replace("#", "0x");
  // Calculating these rely on the fact that vertical edges should share widths with their corners.
  // and horizontal edges share heights with their corners.
  let fillWidth = width - ((cornerData["topLeft"][2] + cornerData["topRight"][2]) * spriteScale);
  let fillHeight = height - ((cornerData["topLeft"][3] + cornerData["bottomLeft"][3]) * spriteScale);
  let fillRect = new PIXI.Graphics();
  fillRect.beginFill(fillColour);
  fillRect.drawRect(0, 0, fillWidth, fillHeight)
  fillRect.position.set(cornerData["topLeft"][2] * spriteScale, cornerData["topLeft"][3] * spriteScale);
  container.addChild(fillRect);

  // Add corners to container.
  let cornerPos = {
    "topLeft": [0,0],
    "topRight": [width - (cornerData["topRight"][2] * spriteScale), 0],
    "bottomLeft": [0, height - (cornerData["bottomLeft"][3] * spriteScale)],
    "bottomRight": [width - (cornerData["bottomRight"][2] * spriteScale), height - (cornerData["bottomRight"][3] * spriteScale)]
  };
  let corner;
  let i = 0;
  for(const [cornerName, frameArray] of Object.entries(guiData.corners)){
    corner = textureManager.copySprite(spriteSheet.sprite, {pool: false, frameArray: frameArray});
    corner.position.set(cornerPos[cornerName][0], cornerPos[cornerName][1]);
    corner.width = corner.width * spriteScale;
    corner.height = corner.height * spriteScale;
    container.addChild(corner);
    i++;
  };

  // Add vertical edges to container;
  // for verticalCount, basically we're subtracting out the heights of the corners and then dividing what's leftover
  // by the height of a verticalEdge (which will probably be 1, but let's make it flexible).
  let verticalCount = fillHeight / (edgeData["right"][3] * spriteScale);
  let leftEdge;
  let rightEdge;
  let posY;
  // Note that the loop assumes that leftEdge and rightEdge share heights (which they should).
  for(let i = 0; i < verticalCount; i++){
    posY = (cornerData["topLeft"][3] * spriteScale) + (i * edgeData["left"][3] * spriteScale);
    leftEdge = textureManager.copySprite(spriteSheet.sprite, {pool: false, frameArray: edgeData["left"]});
    leftEdge.width = leftEdge.width * spriteScale;
    leftEdge.height = leftEdge.height * spriteScale;
    leftEdge.position.set(0, posY);

    rightEdge = textureManager.copySprite(spriteSheet.sprite, {pool: false, frameArray: edgeData["right"]});
    rightEdge.width = rightEdge.width * spriteScale;
    rightEdge.height = rightEdge.height * spriteScale;
    rightEdge.position.set(width - (edgeData["right"][2] * spriteScale), posY);

    container.addChild(leftEdge);
    container.addChild(rightEdge);
  };

  // Add horizontal edges to container;
  // subtract widths of the top two edges from total width and divide by width of edge.
  // similar to verticalEdge, both horizontal edges should have the same width;
  let horizontalCount = fillWidth / (edgeData["top"][2] * spriteScale);
  let topEdge;
  let bottomEdge;
  let posX;
  for(let i = 0; i < horizontalCount; i++){
    posX = (cornerData["topLeft"][2] * spriteScale) + (i * edgeData["top"][2] * spriteScale);
    topEdge = textureManager.copySprite(spriteSheet.sprite, {pool: false, frameArray: edgeData["top"]});
    topEdge.width = topEdge.width * spriteScale;
    topEdge.height = topEdge.height * spriteScale;
    topEdge.position.set(posX, 0)

    bottomEdge = textureManager.copySprite(spriteSheet.sprite, {pool: false, frameArray: edgeData["bottom"]});
    bottomEdge.width = bottomEdge.width * spriteScale;
    bottomEdge.height = bottomEdge.height * spriteScale;
    bottomEdge.position.set(posX, height - (edgeData["bottom"][3] * spriteScale));

    container.addChild(topEdge);
    container.addChild(bottomEdge);
  };

  textureManager.addToPool(spriteSheet);

  return container;
};

Renderer.prototype.createLabelGraphic = function(label){
  let message = label.text;
  let style = label.attributes.has("style") ? label.attributes.get("style") : "default";
  style = this.textStyles[style];
  let text = new PIXI.BitmapText(message, style);
  return text
};

// overlayType is required if buttonStyle.guiCustomStyle != null;
Renderer.prototype.createButtonOverlay = function(button, overlayType){
  let buttonStyle = button.attributes.has("buttonStyle") ? button.attributes.get("buttonStyle") : "default";
  let overlay;
  buttonStyle = this.buttonStyles[buttonStyle];

  if(buttonStyle.guiCustomStyle != null){
    let overlayButton = new Button();
    Object.assign(overlayButton, button)
    overlayButton.attributes = new Map(button.attributes);
    overlayButton.attributes.set("buttonStyle", buttonStyle.guiCustomStyle + overlayType);
    overlay = this.createButtonGraphic(overlayButton);
  }
  else {
    let buttonStyle = button.attributes.has("buttonStyle") ? button.attributes.get("buttonStyle") : "default";

    let overlayStyle = new ButtonStyle(this.buttonStyles[buttonStyle]);
    overlayStyle.color = this.brightenColor(overlayStyle.color, 20);
    overlayStyle.color = (overlayStyle.color).replace("#", "0x")

    overlayStyle.borderColor = this.brightenColor(overlayStyle.borderColor, 20);
    overlayStyle.borderColor = (overlayStyle.borderColor).replace("#", "0x")
    let overlayRect = this.configureButtonRect(overlayStyle);
    overlay = this.createButtonGraphic(button, overlayRect);
  }
  return overlay;
};

// Note: buttonStyle is suppose to be a ButtonStyle object.
Renderer.prototype.createGenericButtonGraphic = function(width, height, buttonStyle, rectangle){
  if(rectangle === undefined){
    rectangle = this.configureButtonRect(buttonStyle);
  };

  rectangle.drawRect(0, 0, width, height);
  rectangle.endFill();
  return rectangle;
};
// Create the button graphic. rectangle is an OPTIONAL parameter.
Renderer.prototype.createButtonGraphic = function(button, rectangle){
  let minimumWidth = 150;
  let minimumHeight = 50;
  let container = new PIXI.Container();

  let textStyle = button.attributes.has("textStyle") ? button.attributes.get("textStyle") : "default";
  let buttonStyle = button.attributes.has("buttonStyle") ? button.attributes.get("buttonStyle") : "default";
  let horizontalPadding = button.attributes.has("horizontalPadding") ? Number(button.attributes.get("horizontalPadding")) : 20;
  buttonStyle = this.buttonStyles[buttonStyle];

  // Create label component.
  let message = button.text;
  let text = new PIXI.BitmapText(message, this.textStyles[textStyle]);

  // For manual sizing to work properly, the width and height of a button must be
  // 0 by default.
  let rectangleWidth = (button.width > 0) ? button.width : Math.max(text.width, minimumWidth);
  rectangleWidth += horizontalPadding;
  let rectangleHeight = (button.height > 0) ? button.height : Math.max(text.height, minimumHeight);

  // Create button component.
  let buttonGraphic;
  if(buttonStyle.guiCustomStyle != null){
    buttonGraphic = this.createCustomGUIRectGraphic(buttonStyle.guiCustomStyle, rectangleWidth, rectangleHeight);
  }
  else {
    buttonGraphic = this.createGenericButtonGraphic(rectangleWidth, rectangleHeight, buttonStyle, rectangle);
  };

  // Center text within containing rectangle.
  let maxWidth = Math.max(rectangleWidth, text.width);
  let maxHeight = Math.max(rectangleHeight, text.height);
  let center = [(maxWidth / 2) - (text.width / 2), (maxHeight / 2) - (text.height / 2)]
  text.position.set(center[0], center[1]);

  if(buttonGraphic.width < text.width){
    center = [(maxWidth / 2) - (buttonGraphic.width / 2), (maxHeight / 2) - (buttonGraphic.width / 2)];
    buttonGraphic.position.set(center[0], center[1]);
  };

  // Combine them into the container.
  container.addChild(buttonGraphic);
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
    if(item.constructor != Frame){
      itemGraphic = item.graphic;
      itemGraphic.position.set(item.x - listWidget.x, item.y - listWidget.y);
      container.addChild(itemGraphic);
    };
  };
  return container;
};

// Frame graphics currently only supports using guiCustomStyles.
Renderer.prototype.createFrameGraphic = function(frameWidget){
  let parentWidget = frameWidget.parentWidget;
  let parentWidth = (parentWidget.constructor === Menu) ? this.parent.windowWidth : parentWidget.width;
  let parentHeight = (parentWidget.constructor === Menu) ? this.parent.windowHeight : parentWidget.height;
  frameWidget.x = (parentWidget.constructor === Menu) ? 0 : parentWidget.x;
  frameWidget.y = (parentWidget.constructor === Menu) ? 0 : parentWidget.y;

  let frameStyle = frameWidget.attributes.has("frameStyle") ? button.attributes.get("frameStyle") : "window";

  let horizontalPadding = frameWidget.attributes.has("horizontalPadding") ? Number(frameWidget.attributes.get("horizontalPadding")) : 40;
  let verticalPadding = frameWidget.attributes.has("verticalPadding") ? Number(frameWidget.attributes.get("verticalPadding")) : 40;
  let frameWidth = (frameWidget.width > 0) ? frameWidget.width : parentWidth;

  let frameHeight = (frameWidget.height > 0) ? frameWidget.height : parentHeight;

  if(parentWidget.constructor === ListWidget){
    frameWidth += horizontalPadding;
    frameHeight += verticalPadding;

    if(parentWidget.attributes.get("justifyContents") === "center"){
      frameWidget.x -= frameWidth / 2;
      frameWidget.y -= verticalPadding / 2;
    };
  };

  frameGraphic = this.createCustomGUIRectGraphic(frameStyle, frameWidth, frameHeight);
  return frameGraphic;
};

// Can optinally specifiy source too.
Renderer.prototype.createImageGraphic = function(imageWidget, src, type, spriteScale){
  let textureManager = this.textureManager;
  src = (src === undefined) ? imageWidget.attributes.get("src") : src;
  if(src === undefined){console.error(`image widget is missing a source name!`)};

  if(type === undefined){
    type = imageWidget.attributes.has("type") ? imageWidget.attributes.get("type") : "fullImage";
  };

  // Treat sprites without a specified index as fullImages.
  if(type === "sprite" && imageWidget.attributes.get("spriteIndex") === undefined){type = "fullImage"};
  if(spriteScale === undefined){spriteScale = imageWidget.spriteScale};
  let graphic;
  let spriteSheet;
  let frameArray;

  switch(type){
    case "fullImage":
      spriteSheet = this.getSheetFromId(src);
      frameArray = imageWidget.attributes.has("frameArray") ? imageWidget.attributes.get("frameArray") : null;

      // We convert the string into an Array of integers.
      if(frameArray != null){
        frameArray = Engine.prototype.convertStringToArray(frameArray);
        frameArray = frameArray.map(n => Number(n));
        textureManager.setTextureFrame(spriteSheet.texture, frameArray)
      };
      graphic = spriteSheet.sprite;
      break;
    // We can assume that a frameIndex is specified.
    case "sprite":
      spriteSheet = this.getSheetFromId(src);
      let spriteIndex = imageWidget.attributes.get("spriteIndex");
      // We convert the string into an Array of integers.
      spriteIndex = Engine.prototype.convertStringToArray(spriteIndex);
      spriteIndex = spriteIndex.map(n => Number(n));
      graphic = textureManager.getSpriteFromSheet(spriteSheet, spriteIndex[0], spriteIndex[1]);
      break;
    case "gui":
      let parent = this.parent;
      let guiConfig = parent.assets.get(parent.guiConfigKey);
      let imageConfig = guiConfig.get(src);
      if(imageConfig.model != "image"){console.error(`image widget with src=${src} has the incorrect model set for its image source.`)};
      spriteSheet = this.getSheetFromId(guiConfig.get("METADATA")["spriteSheet"]);
      frameArray = [imageConfig.topLeft[0], imageConfig.topLeft[1], imageConfig.width, imageConfig.height];
      textureManager.setTextureFrame(spriteSheet.texture, frameArray);
      graphic = spriteSheet.sprite;
      break;
    default:
      console.error(`image type ${type} is invalid!`);
  }

  graphic.width = graphic.width * spriteScale;
  graphic.height = graphic.height * spriteScale;

  if(imageWidget.attributes.get("justifyContents") === "center"){
    imageWidget.x = imageWidget.x - (graphic.width / 2);
  }
  return graphic;

};

Renderer.prototype.setArrowSelectButtonGraphic = function(arrowSelectBtn, side){
  let src = arrowSelectBtn.attributes.get("src") + side;
  let engine = this.parent;
  let guiConfig = engine.assets.get(engine.guiConfigKey);
  let guiData = guiConfig.get(src);

  if(arrowSelectBtn.graphic != undefined){this.textureManager.addToPool(arrowSelectBtn.graphic)};
  arrowSelectBtn.graphic = this.createImageGraphic(arrowSelectBtn, src, "gui", engine.spriteScale);

  if(arrowSelectBtn.overlayGraphic != undefined){this.textureManager.addToPool(arrowSelectBtn.overlayGraphic)};
  arrowSelectBtn.overlayGraphic = this.createImageGraphic(arrowSelectBtn, src + "Hover", "gui", engine.spriteScale);

  if(arrowSelectBtn.pressedGraphic != undefined){this.textureManager.addToPool(arrowSelectBtn.pressedGraphic)};
  arrowSelectBtn.pressedGraphic = this.createImageGraphic(arrowSelectBtn, src + "Pressed", "gui", engine.spriteScale);

  if(arrowSelectBtn.disabledGraphic != undefined){this.textureManager.addToPool(arrowSelectBtn.disabledGraphic)};
  arrowSelectBtn.disabledGraphic = this.createImageGraphic(arrowSelectBtn, src + "Disabled", "gui", engine.spriteScale);
};


Renderer.prototype.createArrowSelectGraphic = function(arrowSelect){
  let container = new PIXI.Container();
  let leftBtn = arrowSelect.leftBtn;
  let rightBtn = arrowSelect.rightBtn;
  let minimumWidth = 150;
  let minimumHeight = 50;
  let horizontalPadding = arrowSelect.attributes.has("horizontalPadding") ? Number(arrowSelect.attributes.get("horizontalPadding")) : 20;

  // Set the graphics of its options.
  let largestWidth = 0;
  let createFunc = this.createLabelGraphic.bind(this);
  for(const option of arrowSelect.options){
    if(option.graphic != undefined){this.textureManager.addToPool(option.graphic)};

    option.graphic = createFunc(option);
    option.width = option.graphic.width;
    option.height = option.graphic.height;
    option.x = arrowSelect.x;
    option.y = arrowSelect.y;
    largestWidth = Math.max(option.width, largestWidth);
  };

  // Set the graphics of its buttons.
  let btnName;
  let setterFunc = this.setArrowSelectButtonGraphic.bind(this);
  for(const btn of ["Left", "Right"]){
    btnName = btn.toLowerCase() + "Btn"
    setterFunc(arrowSelect[btnName], btn)
    arrowSelect[btnName].width = arrowSelect[btnName].graphic.width;
    arrowSelect[btnName].height = arrowSelect[btnName].graphic.height;
  };

  let rectangleWidth = leftBtn.width + largestWidth + rightBtn.width;
  rectangleWidth = (rectangleWidth > minimumWidth) ? rectangleWidth : minimumWidth;
  rectangleWidth += horizontalPadding;

  leftBtn.x = arrowSelect.x;
  leftBtn.y = arrowSelect.y;
  rightBtn.x = arrowSelect.x + rectangleWidth - rightBtn.width;
  rightBtn.y = arrowSelect.y;

  // probably some of the most scuffed code I've written in awhile.
  for(const option of arrowSelect.options){
    option.x += (rectangleWidth / 2) - (option.width / 2);
    option.y += (leftBtn.height / 2) - (option.height / 2) + 2;
  };

  for(const btn of [leftBtn, rightBtn]){
    btn.graphic.position.set(btn.x - arrowSelect.x, btn.y - arrowSelect.y);
    container.addChild(btn.graphic);
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
      object.destroy(true);
      break;
    case PIXI.Graphics:
      object.clear();
      object.destroy();
      break;
    case SpriteSheet:
      object.sprite.destroy();
      object.texture.destroy();
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

// frameRect can be either a PIXI.Rectangle or an Array in the format [x, y, width, height]
TextureManager.prototype.setTextureFrame = function(texture, frameRect){
  if(frameRect.constructor === PIXI.Rectangle){
    newFrame = frameRect;
  } else newFrame = new PIXI.Rectangle(frameRect[0], frameRect[1], frameRect[2], frameRect[3]);
  texture.frame = newFrame;
  // texture.updateUvs();
};

// Return a copy of the given texture.
// If the pool parameter is se to true then the texture will automatically be added to the pool.
TextureManager.prototype.copyTexture = function(texture, kwargs={pool: true, frameArray: null}){
  let pool = (kwargs.pool === undefined) ? true : kwargs.pool;
  let frameArray = (kwargs.frameArray === undefined) ? null : kwargs.frameArray;
  // Error handling.
  if(texture.constructor !== PIXI.Texture){
    console.error(`Error trying to copy texture. Detected texture: ${texture}. Texture constructor: ${texture.constructor}`);
  } else {
    let newTexture = texture.clone();
    if(frameArray != null){this.setTextureFrame(newTexture, frameArray)};
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
TextureManager.prototype.copySprite = function(sprite, kwargs={pool: true, frameArray: null}){
  // Error handler.
  let pool = (kwargs.pool === undefined) ? true : kwargs.pool;
  let frameArray = (kwargs.frameArray === undefined) ? null : kwargs.frameArray;
  if(sprite.constructor !== PIXI.Sprite){
    console.error(`Error trying to copy texture. Detected sprite: ${sprite}. Sprite constructor: ${sprite.constructor}`);
  } else {
    let newTexture = this.copyTexture(sprite.texture, {pool: pool, frameArray: frameArray});
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
  return new SpriteSheet(imageURL, texture, sprite, image);
};

// Calculate and return the pixi texture frame of the specified sprite from the spritesheet.
TextureManager.prototype.getRectFromSheet = function(spriteSheet, index_X, index_Y){
  let width;
  let height;
  let posX;
  let posY;
  switch (spriteSheet.type) {
    case "fixedSize":
      size = spriteSheet.spriteSize;
      width = size;
      height = size;
      posX = index_X * size;
      posY = index_Y * size;
      break;
    case "variableSize":
      posX = this.spriteProperties[`${index_X}, ${index_Y}`]["x"];
      posY = this.spriteProperties[`${index_X}, ${index_Y}`]["y"];
      width = this.spriteProperties[`${index_X}, ${index_Y}`]["width"];
      height = this.spriteProperties[`${index_X}, ${index_Y}`]["height"];
      break;
  };

  let rectangle = new PIXI.Rectangle(posX, posY, width, height);
  return rectangle;
};

// Get the actual sprite from the spritesheet.
TextureManager.prototype.getSpriteFromSheet = function(spriteSheet, index_X, index_Y){
  let rect = this.getRectFromSheet(spriteSheet, index_X, index_Y);
  this.setTextureFrame(spriteSheet.sprite.texture, rect);
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
 * imageObj is an object literal from image.json containing relevant spriteSheet
 * information of that iamge.
 */
function SpriteSheet(imageURL, texture, sprite, imageObj){
  this.id = imageURL;
  this.sprite = sprite;
  this.texture = texture;
  this.width = imageObj.width;
  this.height = imageObj.height;

  this.type = (imageObj.type === undefined) ? "fixedSize" : imageObj.type;
  switch (this.type) {
    // Applies to majority of spritesheets; each sprite in the sheet is a fixed size. (i.e. 32x32)
    case "fixedSize":
      this.spriteSize = imageObj.spriteSize;
      break;
    // Sprites in sheet are not a fixedSize. If this type is set, dimensions of sprites
    // at each index_X, index_Y needs to be set manually in an object.
    case "variableSize":
      this.spriteProperties = imageObj.spriteProperties;
      break;
    default: // error checking.
      console.error(`${this.type} is an unrecognized sprite type. spriteSheet id: ${this.id}`);
  };
};

/**
 * Custom SINGLE sprite animation object.
 * Animation assumes that every frame of the animation is within
 * the spritesheet provided.
*/
function Animation(id, spriteSheet, animationData){
  // A counter that keeps track of the game refreshes while the current animation frames is active.
  this.counter = 0;
  // Default number of refreshes before next animation frame.
  this._defaultTiming = 8;
  this.frameIndex = 0;
  this.active = false;

  // Required settings.

  this.id = id;
  this.spriteSheet = spriteSheet;
  // An array of indexes; each index corresponds to the frame's sprite index in the sheet.
  this.frames = animationData.frames;
  this.currentFrame = this.frames[0];
  this.loops = animationData.loops;
  // Type of animation. Can be used for checking.
  this.type = animationData.type;

  // Optional settings.
  // Name of animation that comes after current animation. If cancelIndex is defined, then followUp will trigger at the index.
  this.followUp = animationData.followUp === undefined ? null : animationData.followUp;

  // Index of first frame where player can input for followUp.
  this.queueIndex = animationData.queueIndex === undefined ? "d" : animationData.queueIndex;
  // Default behaviour is that queue frame will be nth index to the left on the last index.
  if(["default", "d"].includes(this.queueIndex)){
    let n = 2;
    if(this.frames.length < n){
      this.queueIndex = 0;
    } else this.queueIndex = this.frames.length - n;
  };

  // Number of game refreshes it takes to reach the next animation frame.
  // Can be an integer (which makes all frames have the same timing)
  // Or an array of integers (so each frame can have its own unique timing)
  this.timings = animationData.timings === undefined ? this._defaultTiming : animationData.timings;
  if(this.timings.constructor === Array){
    // Error checking.
    if(this.timings.length != this.frames.length){
      console.error(`"timings" array does not match "frames" array size. timings: ${this.timings}, frames: ${this.frames}`)
    };
    for(let i = 0; i < this.timings.length; i++){
      if(["default", "d"].includes(this.timings[i])){
        this.timings[i] = this._defaultTiming;
      };
    };
  } else if(this.timings === "d"){this.timings = this._defaultTiming};

  // An array of rectangle dimensions and locations tied to frames.
  this.hitBoxes = animationData.hitBoxes === undefined ? null : animationData.hitBoxes;

  // If there are movements tied to the animation, use this to set the speed for the frame(s) (without direction!)
  // can be a number or an array.
  this.speed = animationData.speed === undefined ? null : animationData.speed;

  // If exists, dictates what frame to cancel the animation at if applicable.
  this.cancelIndex = animationData.cancelIndex === undefined ? null: animationData.cancelIndex;

  // Similar to followUp but will only trigger once the animation completes
  this.return = animationData.return === undefined ? null: animationData.return;

  // An array of "effect" animations. These are names of animations that are added ontop of the existing animation.
  // Each frame of an effect animation should correspond to a frame in the main animation.
  this.effects = animationData.effects === undefined ? []: animationData.effects;

  if(this.type === "effect"){
    this.offsetX = animationData.offsetX === undefined ? 0: animationData.offsetX;
    this.offsetY = animationData.offsetY === undefined ? 0: animationData.offsetY;
  };

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
    else if(animation.loops === false){
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

  if(spriteIndex === null){
    return null;
  } else return this.parent.textureManager.getSpriteFromSheet(spriteSheet, spriteIndex[0], spriteIndex[1]);
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
  let timing = (animation.timings.constructor === Array) ? animation.timings[animation.frameIndex] : animation.timings;
  let complete; // Flag; whether the counter = speed; the number of frames to move on.

  if(animation.counter >= timing){
    animation.counter = 0;
    complete = true;
  } else complete = false;
  return complete;
};
