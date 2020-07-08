/**
 * logic.js is where all the functions and game-specific
 * data structures go.
*/

/**
 * Custom scene object. Will essentially represent a level in the game.
*/
function Scene(parent, sceneData){
  this.name;
  this.spriteSheet; // spriteSheet of all the tiles in the scene.
  this.entities = [];
  this.tileMap;
  this.camera = new Camera();
  this.parseData(parent, sceneData);
};

Scene.prototype.parseData = function(parent, sceneData){
  this.name = sceneData.name;
  this.spriteSheet = parent.renderer.getSheetFromId(sceneData.spriteSheet);
  this.tileMap = new TileMap(sceneData.width, sceneData.height, sceneData.tileData);
};

function SceneManager(){};

/**
 * Custom tilemap object. Contains a 1D array of tile information,
 * the map's dimensions, and essential methods.
 * this class does NOT contain any graphics or other level information.
 * Example tile data:
 * [
   "000-FL", "000-FL", "000-FL",
   "000-FL", "000-FL", "000-FL",
   "000-FL", "000-FL", "000-FL"]
 * Note: tile data arrays must be square based!
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

// Convert the index of a 1d array to the cartesian coordinate
// equivalent of a similar 2d array.
TileMap.prototype.convertIndexToCoords = function(index){
  let index_Y = Math.floor(index / this.width);
  let index_X = index % this.width;
  return [index_X, index_Y];
};

// Convert the coords of a 2d array to the 1d index equivalent.
TileMap.prototype.convertCoordsToIndex = function(index_X, index_Y){
  return index_X * this.width + index_Y;
};

// TODO: Implement.
function Camera(){
  this.viewHeight;
  this.viewWidth;
};
