/**
 * logic.js is where all the functions and game-specific
 * data structures go.
*/

/**
 * Custom entity object. for the purpose of this game this will be the base
 * of the player, enemy, items, doors, switches, etc.
*/
function Entity(id, sprite, type, state, x, y){
  this.id = id;
  // Default attributes.
  this.attributes = {
    "sprite": sprite,
    "type": type,
    "state": state,
    "x": x,
    "y": y
  };
};

/**
 * Custom scene object. Will essentially represent a level in the game.
*/
function Scene(parent, sceneData){
  this.name;
  this.spriteSheet; // spriteSheet of all the tiles in the scene.
  this.entities = new Map();
  this.tileMap;
  this.camera = new Camera();
  this.coords; // represents the "world" or true coordinates of everything.
  this.parseData(parent, sceneData);
};

Scene.prototype.parseData = function(parent, sceneData){
  this.name = sceneData.name;
  this.spriteSheet = parent.renderer.getSheetFromId(sceneData.spriteSheet);
  this.tileMap = new TileMap(sceneData.width, sceneData.height, sceneData.tileData);
};

Scene.prototype.addEntity = function(entity){
  this.entities.set(entity.id, entity);
};

Scene.prototype.getEntity = function(id){
  if(this.entities.has(id) === true){
    return this.entities.get(id);
  } else console.error(`Error trying to get entity: ${id} does not exist.`);
};

Scene.prototype.getEntityAttribute = function(id, key){
  let entity = this.getEntity(id);
  return entity.attributes[key];
};
// Function doesn't check if it does or does not already exists so keep that in mind.
Scene.prototype.setEntityAttribute = function(id, key, value){
  let entity = this.getEntity(id);
  entity.attributes[key] = value;
};

// If the attribute is a number, increase/decrease the value by the amount.
Scene.prototype.incrementEntityAttribute = function(id, key, amount=1){
  let entity = this.getEntity(id);
  let value = entity.attributes[key];
  if(typeof value === "number"){
    value += amount;
    this.setEntityAttribute(id, key, value)
  } else console.log(`Error while increasing an entity's attribute:
  was told to increment ${value}, but it's not a number. id: ${id}. key: ${key}`);
};

/**
 * Custom scene manager object. Will be responsible for transition betweening
 * through different scenes.
*/
function SceneManager(){
  this.currentScene;
  this.sceneHistory = [];
};

SceneManager.prototype.setScene = function(newScene){
  if(this.currentScene !== undefined){
    this.sceneHistory.push(newScene);
  };
  this.currentScene = newScene;
};

/**
 * Custom tilemap object. Contains a 1D array of tile information,
 * the map's dimensions, and essential methods.
 * this class does NOT contain any graphics or other level information.
 * Example tile data:
 * [
   "000-FL", "000-FL", "000-FL",
   "000-FL", "000-FL", "000-FL",
   "000-FL", "000-FL", "000-FL"]
*/
function TileMap(width, height, tiledata){
  this.width = width,
  this.height = height,
  this.tiles = tiledata;
};

// Returns an error message if index doesn't exist. Solely for debugging purposes.
TileMap.prototype._checkIsValidIndex = function(tileIndex){
  if(tileIndex < 0 || tileIndex > this.tiles.length){
    console.error(`Index is invalid. Tile index: ${tileIndex}`)
  };
};

TileMap.prototype.tileIsCollidable = function(tileIndex){
  this._checkIsValidIndex(tileIndex);

  let tile = this.tiles[tileIndex];
  let result;

  switch(tile[0]){
    case "0":
      result = true;
      break;
    case "1":
      result = false;
      break;
    default:
      console.error(`Tile collision information is invalid. Tile index: ${tileIndex}.
        Tile info: ${tile}. Value: ${tile[0]}.`);
  };
  return result;
};

// Return an array containing the tile's sprite indexes in the spritesheet.
TileMap.prototype.getSpriteIndex = function(tileIndex){
  this._checkIsValidIndex(tileIndex);
  let tile = this.tiles[tileIndex];
  // [index_X, index_Y]
  let indexArray = [Number(tile[1]), Number(tile[2])];
  return indexArray;
};

TileMap.prototype.getTileID = function(tileIndex){
  this._checkIsValidIndex(tileIndex);
  let tile = this.tiles[tileIndex];
  let id = tile.split("-")[1];
  return id;
};

// Shorthand for converting indexes to 1D/2D.
TileMap.prototype.convertPos = function(position){
  if(Array.isArray(position) === true){
    return this.convertCoordsToIndex(position);
  }
  else if(typeof position === "number"){
    return this.convertIndexToCoords(position);
  } else {
    console.error(`${position} is not a valid position type for conversion.`);
  };
};

// Moved the following over to Engine because it's a pretty widespread calculation.
// Aliases.
TileMap.prototype.convertIndexToCoords = function(index){
  return Engine.prototype.convertIndexToCoords(index, this.width);
};

TileMap.prototype.convertCoordsToIndex = function(index_X, index_Y){
  return Engine.prototype.convertCoordsToIndex(index_X, index_Y, this.width);
};

// TODO: Implement.
/*
 * Simple camera; will move based on what it's tracking.
 * NOTE: ALL coordinates will be relative to the SCENE.
*/
function Camera(){
  this.topLeft; // An ARRAY representing the x and y position of the camera viww's topelft.
  this.centerX;
  this.centerY;
  this.viewWidth;
  this.viewHeight;
};

// For initializing the camera.
Camera.prototype.setup = function(centerX, centerY, viewWidth, viewHeight){
  this.centerX = centerX;
  this.centerY = centerY;
  this.viewWidth = viewWidth;
  this.viewHeight = viewHeight;
  this.calculateTopLeft();
};

Camera.prototype.calculateTopLeft = function(){
  let x = this.centerX - (this.viewWidth / 2);
  let y = this.centerY - (this.viewHeight / 2);
  this.topLeft = [x, y];
};

// Change the position of the camera's CENTER.
Camera.prototype.setPos = function(newX, newY){
  this.centerX = newX;
  this.centerY = newY;
  this.calculateTopLeft();
};

// Center the camera based on the location of a source sprite.
// Centers on the CENTER of the source sprite..
Camera.prototype.center = function(sourceX, sourceY, sourceSize){
  this.centerX = sourceX + (sourceSize / 2);
  this.centerY = sourceY + (sourceSize / 2);
  this.calculateTopLeft();
};

Camera.prototype._isInBetween = function(value, lower, upper){
  return lower <= value <= upper;
};

// Check if position is in view of camera.
Camera.prototype.inView = function(x, y){
  return (this._isInBetween(x, this.topLeft[0], this.topLeft[0] + this.viewWidth)
  && this._isInBetween(y, this.topLeft[1], this.topLeft[1] + this.viewHeight));
};

// Get the relative position based on given coordinates.
Camera.prototype.getRelative = function(trueX, trueY){
  return [trueX - this.topLeft[0], trueY - this.topLeft[1]];
};
