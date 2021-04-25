/**
 * logic.js is where all the game-specific functions and
 * major data structures go.
*/

/**
 * Custom scene object. Will essentially represent a level in the game.
 *
*/
function Scene(spriteSheet, sceneData){
  this.name = sceneData.name;
  this.spriteSheet = spriteSheet; // Shared spriteSheet of all the tiles in the scene.
  this.tileMap = new TileMap(sceneData.width, sceneData.height, sceneData.tileData);
  // A map of all entities in the scene. keys are entity ids. values are entity objects.
  this.entities = new Map();
  // A spatial hashmap of all entities in the scene. keys are tile positions in the map occupied by entity(s).
  // values are an array of all entities contained in the tile.
  this.spatialHashmap = new Map();
  this.movingEntities = []; // An array of all entities currently moving.
  this.entityMovingStates = ["moving", "walking", "sprinting"];
  this.camera = new Camera();
};

Scene.prototype._createEntityRect = function(entity){
  let entityWidth = entity.attributes["width"];
  let entityHeight = entity.attributes["height"];
  let entityX = entity.attributes["x"];
  let entityY = entity.attributes["y"];
  let entityTopLeft = [entityX - (entityWidth / 2), entityY - (entityHeight / 2)];
  return new Rect(entityTopLeft, entityWidth, entityHeight);
}

Scene.prototype._getTilesEntityIsIn = function(entity){
  let entityRect = this._createEntityRect(entity);
  let encompassingTiles = new Set();
  // Check each corner to find which tile(s) the entity is currently in.
  for(const position of [entityRect.topLeft, entityRect.bottomLeft,
    entityRect.topRight, entityRect.bottomRight]){
      let nearestTileIndex = this.tileMap.getNearestTileIndex(position);
      encompassingTiles.add(nearestTileIndex)
    };
  return encompassingTiles;
};

// Adds entity to spatialHashmap
Scene.prototype._addEntityToHashmap = function(location, entity){
  let tileGetterFunc = this._getTilesEntityIsIn.bind(this);
  let encompassingTiles = tileGetterFunc(entity);

  encompassingTiles.forEach(tileIndex => {
    if(this.spatialHashmap.has(tileIndex) === false){
      this.spatialHashmap.set(tileIndex, [entity]);
    }
    else {
      let entityArrray = this.spatialHashmap.get(tileIndex);
      entityArray.push(entity);
    }
  });
};

// Precondition: entity exists in hashmap
Scene.prototype._removeEntityfromHashmap = function(entity){
  let tileGetterFunc = this._getTilesEntityIsIn.bind(this);
  let location = [entity.attributes["x"], entity.attributes["y"]]
  let encompassingTiles = tileGetterFunc(entity);

  encompassingTiles.forEach(tileIndex => {
    let entityArray = this.spatialHashmap.get(tileIndex);

    if(entityArray.length <= 1){
      this.spatialHashmap.delete(tileIndex);
    }
    else {
      // Remove entity from array.
      entityArray.splice(entityArray.indexOf(entity), 1);
    }
  });
};

Scene.prototype.addEntity = function(entity){
  this.entities.set(entity.id, entity);
  let location = [entity.attributes["x"], entity.attributes["y"]];
  this._addEntityToHashmap(location, entity);
};

Scene.prototype.removeEntity = function(entity){
  this.entities.delete(entity.id);
  this._removeEntityfromHashmap(entity);
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

// Set new x and y positions of the entity.
Scene.prototype.moveEntity = function(entity, newPos){
  this._removeEntityfromHashmap(entity);
  this.setEntityAttribute(entity.id, "x", newPos[0]);
  this.setEntityAttribute(entity.id, "y", newPos[1]);
  this._addEntityToHashmap(newPos, entity);
};

// If the attribute is a number, increase/decrease the value by the amount.
Scene.prototype.incrementEntityAttribute = function(id, key, amount=1){
  let entity = this.getEntity(id);
  let value = entity.attributes[key];
  if(typeof value === "number"){
    value += amount;
    this.setEntityAttribute(id, key, value);
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

SceneManager.prototype.clearHistory = function(){
  this.sceneHistory = [];
};

/**
 * Custom tilemap object. Contains a 1D array of tile information,
 * the map's dimensions, and essential methods.
 * this class does NOT contain any graphics or other level information.
 * Currently supported tile ids are listed in tile_ids.txt
 * Example tile data:
 * [
   "000-FL", "000-FL", "000-FL",
   "000-FL", "000-FL", "000-FL",
   "000-FL", "000-FL", "000-FL"]
*/
function TileMap(width, height, tiledata){
  this.width = width, // tileMap width in TILES
  this.height = height, // tileMap height in TILES.
  this.tiles = tiledata;
  this.tileSize = 32; // Size of an individual tile in pixels.
};

TileMap.prototype.tileIsEmpty = function(tileIndex){
  return (this.tiles[tileIndex].split('-')[2] === '00');
};

TileMap.prototype.tileIsCollidable = function(tileIndex){
  this._checkIsValidIndex(tileIndex);

  let tile = this.tiles[tileIndex].split('-');
  let result;

  switch(tile[2]){
    case "WA":
      result = true;
      break;
    case "FL":
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
  let tile = this.tiles[tileIndex].split('-');
  // [index_X, index_Y]
  let indexArray = [Number(tile[0]), Number(tile[1])];
  return indexArray;
};

TileMap.prototype.getTileID = function(tileIndex){
  this._checkIsValidIndex(tileIndex);
  let tile = this.tiles[tileIndex];
  let id = tile.split("-")[2];
  return id;
};

// Get the nearest TOPLEFT tile.
// position is an object's TRUE position (i.e. in pixels).
TileMap.prototype.getNearestTileIndex = function(position){
  let posX = position[0]
  let posY = position[1]
  // Create a rect representing the tileMap in pixels.
  let tileMapRect = new Rect([0, 0], this.width * this.tileSize, this.height * this.tileSize);

  if(Engine.prototype.pointInRect(posX, posY, tileMapRect) === true){
    let tileX = Math.floor(posX / this.tileSize);
    let tileY = Math.floor(posY / this.tileSize);
    return this.convertCoordsToIndex(tileX, tileY);
  } else console.error(`${position} is out of tileMap bounds.`);
}

// Shorthand.
// position is an object's TRUE position (i.e. in pix
TileMap.prototype.getNearestTile = function(position){
  let nearestTileFunc = this.getNearestTileIndex.bind(this);
  return this.tiles[nearestTileFunc(position)];
};

// Shorthand for converting indexes to 1D/2D.
// position is a TILE position. [col, row];
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
TileMap.prototype.convertIndexToCoords = function(index, getPixelCoords=false){
  let pos = Engine.prototype.convertIndexToCoords(index, this.width);

  // Convert coordinates from "array coordinates" -> pixel coordinates.
  if(getPixelCoords === true){
    pos = [pos[0] * this.tileSize, pos[1] * this.tileSize]
  };
  return pos
};

TileMap.prototype.convertCoordsToIndex = function(index_X, index_Y){
  return Engine.prototype.convertCoordsToIndex(index_X, index_Y, this.width);
};

// Returns an error message if index doesn't exist. Solely for debugging purposes.
TileMap.prototype._checkIsValidIndex = function(tileIndex){
  if(tileIndex < 0 || tileIndex > this.tiles.length){
    console.error(`Index is invalid. Tile index: ${tileIndex}`)
  };
};

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

// Check if position is in view of camera.
Camera.prototype.rectInView = function(rect){
  let engine = Engine.prototype;
  let intersectFunc = engine.rectIntersects.bind(engine);
  let cameraRect = new Rect([0, 0], this.viewWidth, this.viewHeight);
  return intersectFunc(rect, cameraRect);
};

// Get the relative position based on given coordinates.
Camera.prototype.getRelative = function(trueX, trueY){
  return [trueX - this.topLeft[0], trueY - this.topLeft[1]];
};

/**
 * Custom controller class. Responsible for converting input data into
 * useful commands. The controller is a uniform interface for any input
 * device to communicate with the game.
 * engine is a reference to the engine. It's needed to properly track
 * timers.
 * mode is a string identifier that dictates how the controller parse
 * input events.
 * AKA "InputPattern" Manager.
 * Modes:
 * - keyboard = mouse & keyboard.
*/
function Controller(engine, mode="default"){
  this.engine = engine;
  this._allModes = ["keyboard"]; // Mostly for documentation purposes.
  this._defaultMode = this._allModes[0];
  this.mode = (mode === "default") ? this._defaultMode : mode;
  this.patterns = new Map();
  this.commands = [] // A stack of all active commands.
};

Controller.prototype.hasCommands = function(){
  return this.commands.length > 0;
};

Controller.prototype.getCommands = function(){
  return this.commands;
};

Controller.prototype.clearCommands = function(){
  this.commands = [];
};

// Adds commands to Controller.commands. Accepts both array and other objects.
// If array, all the ELEMENTS are added to this.commands.
Controller.prototype.addCommands = function(e){
  if(e.constructor === Array){
    this.commands = this.commands.concat(e);
  } else this.commands.push(e);
};

// Gets and returns all inputs from active devices (based on mode);
Controller.prototype.getInputs = function(events, data){
  let inputs = []; // Inputs detected this frame.

  if(this.mode === "keyboard" && events.get("inputEvents").has("keyboard")){
    let m = events.get("inputEvents").get("keyboard"); // This is a map.
    // Essentially flatten the map. Prepend descriptive words for each input.
    // inputs = inputs.concat(m.get("keyDown").map(x => "keyDown-" + x));
    inputs = inputs.concat(m.get("keyDown")); // get keys from orderedKeyDown already formatted
    inputs = inputs.concat(m.get("keyUp").map(x => "keyUp-" + x));
  };

  return inputs;
};

// ==============================
// Input pattern related methods.
// ==============================

// Should only be called once on startup.
// Create InputPatterns from the information in inputs.json and store them in Controller.
Controller.prototype.createPatterns = function(timeStamp){
  let engine = this.engine
  let patternData = engine.assets.get(engine.inputsKey); // Get the input commands from engine assets.
  for(const [name, obj] of patternData){
    let p = new InputPattern(name, obj);
    // Sets a timer with id == pattern name.
    engine.timerManager.setTimer(p.timeLimit, name)
    this.patterns.set(name, p);
  };
};

Controller.prototype.resetPattern = function(inputPattern){
  let engine = this.engine

  engine.timerManager.resetTimer(inputPattern.name);
  inputPattern.state = inputPattern._initialState;
};

Controller.prototype.patternActive = function(inputPattern){
  return inputPattern.state != inputPattern._initialState;
};

// Update the state of all InputPattern objects.
Controller.prototype.updatePatterns = function(inputs){
  let engine = this.engine
  for(const [name, p] of this.patterns){
    let timerComplete = engine.timerManager.isComplete(name, false);
    if(this.patternActive(p) === true && timerComplete === true){
      console.log("reset")
      this.resetPattern(p)
    };

    inputs.forEach(i => {
      if(this.patternIncludes(p, i) === true){
        let commandInputted = this.nextState(p); // Log if the command has been inputted or not while also moving to the next.
        if(commandInputted === true){
          this.commands.push(name);
          console.log(`COMMAND INPUTTED! | COMMAND: ${name}`)
          this.resetPattern(p);
        };
      };
    });
  };
};

// Checks if the pattern (at its current state) includes the SINGLE input.
// Will take into account things like condition.
Controller.prototype.patternIncludes = function(inputPattern, input){
  // If the pattern is inactive, check the first index instead of bricking (it'll otherwise look for an index at -1).
  let index = (this.patternActive(inputPattern) === true) ? inputPattern.state : 0;

  switch (inputPattern.condition) {
    case "samePrefix": // Might retired at some point. I think making it more precise is just better.
      let prefix = input.split('-')[0];
      return inputPattern.pattern[index].startsWith(prefix); // Check if input shares the same prefix.
      break;
    default:
      return inputPattern.pattern[index] === input; // Check for EXACT input.
  };
};

// Set the state of the pattern to the next.
// If completes last input, reset.
// Returns a bool to indicate if the command has been fully executed.
Controller.prototype.nextState = function(p){
  let complete = false; // Boolean value to determine if the full command has been inputted.
  p.state++;
  if(p.state >= p.pattern.length){ // If command has been inputted, reset and update bool.
    p.state = p._initialState;
    complete = true;
  };
  return complete;
};

// Take a input map from engine.assets.inputCommands and convert to a pattern.
function InputPattern(name, inputData){
  this._defaultTimeLimit = 200; // In miliseconds.
  this._initialState = -1;

  this.name = name;
  this.condition = inputData["condition"] ? inputData["condition"] : "default";
  this.timeLimit = inputData["timeLimit"] ? inputData["timeLimit"] : this._defaultTimeLimit;
  this.pattern = inputData["pattern"]; // There's no check, meaning that this must be explicitly defined.

  this.state = this._initialState; // The index of the current input of the active pattern. Starts at 0.
};
