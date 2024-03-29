/**
 * logic.js is where all the game-specific functions and
 * major data structures go.
*/

/**
 * Custom scene object. Will essentially represent a level in the game.
 * Also a de facto entity manager.
*/
function Scene(engine, spriteSheet, sceneData){
  this.engine = engine;
  this.name = sceneData.name;
  this.spriteSheet = spriteSheet; // Shared spriteSheet of all the tiles in the scene.
  this.tileMap = new TileMap(sceneData.width, sceneData.height, sceneData.tileData);
  // A map of all entities in the scene. keys are entity ids. values are entity objects.
  this.entities = new Map();
  this._genericID = 0; // For creating ids for generic entities.
  // A spatial hashmap of all entities in the scene. keys are tile positions in the map occupied by entity(s).
  // values are an array of all entities contained in the tile.
  this.spatialHashmap = new Map();
  this.movingEntities = []; // An array of all entities currently moving.
  this.entityMovingStates = ["moving", "walking", "sprinting"];
  this.camera = new Camera(this);

  if(sceneData.entities !== undefined){
    this._addPresetEntities(sceneData.entities)
  };
};

Scene.prototype._getGenericID = function(){
  let id = this._genericID;
  this._genericID += 1;
  return 'entity_' + id.toString();
};

// Precondition: each entity in presetEntities is properly formatted.
Scene.prototype._addPresetEntities = function(presetEntities){
  let entity;
  for(let entityData of presetEntities){
    entity = this.createEntity(entityData.name, entityData.id);

    // If an attribute value is defined in entityData, we update from the default here.
    for(let attribute of Object.keys(entityData)){
      if(attribute === "name" || attribute === "id"){continue};
      entity.attributes[attribute] = entityData[attribute];
    };
    this.addEntity(entity);
  };
};

Scene.prototype.entitiesInTile = function(tileIndex){
  return this.spatialHashmap.has(tileIndex);
};

Scene.prototype.getTileEntities = function(tileIndex){
  return this.spatialHashmap.get(tileIndex);
};

Scene.prototype.createEntityRect = function(entity){
  let entityWidth = entity.attributes["width"];
  let entityHeight = entity.attributes["height"];
  let entityX = entity.attributes["x"];
  let entityY = entity.attributes["y"];
  let entityTopLeft = this.getEntityTopLeft(entity);
  return new Rect(entityTopLeft, entityWidth, entityHeight);
};

// Shorthand.
Scene.prototype._getTilesEntityIsIn = function(entity){
  return this.getTilesRectIntersects(this.createEntityRect(entity));
};

Scene.prototype.getTilesRectIntersects = function(rect){
  let rectPositions = [rect.topLeft, rect.topRight, rect.bottomLeft, rect.bottomRight];
  let encompassingTiles = new Set();
  // Check each corner to find which tile(s) the entity is currently in.
  for(const p of rectPositions){
    if(p[0] >= 0 && p[0] <= (this.tileMap.width * this.tileMap.tileSize) &&
       p[1] >= 0 && p[1] <= (this.tileMap.height * this.tileMap.tileSize)){
        let nearestTile = this.tileMap.getNearestTileIndex(p);
        encompassingTiles.add(nearestTile);
      };
  };
  return encompassingTiles;
};

// Adds entity to spatialHashmap at location.
Scene.prototype._addEntityToHashmap = function(entity){
  let tileGetterFunc = this._getTilesEntityIsIn.bind(this);
  let encompassingTiles = tileGetterFunc(entity);

  encompassingTiles.forEach(tileIndex => {
    if(this.spatialHashmap.has(tileIndex) === false){
      this.spatialHashmap.set(tileIndex, new Set().add(entity));
    }
    else {
      let entitySet = this.spatialHashmap.get(tileIndex);
      entitySet.add(entity);
    }
  });
};

// Precondition: entity exists in hashmap
Scene.prototype._removeEntityfromHashmap = function(entity){
  let tileGetterFunc = this._getTilesEntityIsIn.bind(this);
  let encompassingTiles = tileGetterFunc(entity);

  encompassingTiles.forEach(tileIndex => {
    let entitySet = this.spatialHashmap.get(tileIndex);

    if(entitySet.size <= 1){
      this.spatialHashmap.delete(tileIndex);
    }
    else {
      // Remove entity from set.
      entitySet.delete(entity);
    }
  });
};

Scene.prototype.createEntity = function(entityName, id=undefined){
  let entity;
  switch (entityName) {
    case "player":
      entity = new PlayerEntity(this.engine);
      break;
    case "anna":
      entity = new AnnaEntity(this.engine);
      break;
    case "darius":
      entity = new DariusEntity(this.engine);
      break;
    case "dummyMan":
      entity = new DummyManEntity(this.engine);
      break;
    case "tower_watch1":
    case "tower_watch2":
      entity = new TowerWatchEntity(this.engine, entityName.slice(-1));
      break;
    default:
      console.error(`entityName ${entityName} is invalid!`);
  };

  if(id != undefined){entity.id = id}
  else entity.id = this._getGenericID();
  return entity;
};

Scene.prototype.addEntity = function(entity){
  this.entities.set(entity.id, entity);
  let location = [entity.attributes["x"], entity.attributes["y"]];
  this._addEntityToHashmap(entity);
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
  this._addEntityToHashmap(entity);
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

// Calculates world coordinates of entity's topLeft.
Scene.prototype.getEntityTopLeft = function(entity){
  let topLeftX = entity.attributes["x"] - (entity.attributes["width"] / 2);
  let topLeftY = entity.attributes["y"] - (entity.attributes["height"] / 2);
  return [topLeftX, topLeftY];
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

// Return the index of the nearest TOPLEFT tile.
// position is an object's TRUE position (i.e. in pixels).
// If position is out of bounds a value of undefined is returned
TileMap.prototype.getNearestTileIndex = function(position){
  let posX = position[0];
  let posY = position[1];
  // Create a rect representing the tileMap in pixels.
  let tileMapRect = new Rect([0, 0], this.width * this.tileSize, this.height * this.tileSize);
  // let errorFunc = () => console.error(`${position} is out of tileMap bounds.`);

  if(Engine.prototype.pointInRect(posX, posY, tileMapRect) === true){
    let tileX = Math.floor(posX / this.tileSize);
    let tileY = Math.floor(posY / this.tileSize);
    let tileIndex = this.convertCoordsToIndex(tileX, tileY);

    // Potential edge cases.
    if(tileIndex >= this.tiles.length || posX === tileMapRect.width ||
      posY === tileMapRect.height){
      return undefined
    }

    else return tileIndex;

  } else return undefined
}

// Shorthand.
// position is an object's TRUE position (i.e. in pix
TileMap.prototype.getNearestTile = function(position){
  let nearestTileFunc = this.getNearestTileIndex.bind(this);
  return this.tiles[nearestTileFunc(position)];
};

// Returns the index of the nearby tile.
// The coordinates of the tiles are calculated using the passed location.
// the related operation calculates relative to the input tile index.
// If no such tile exists (i.e. out of bounds) the method returns null
TileMap.prototype.getNearbyTileIndex = function(index, location){
  let convertFunc = this.convertPos.bind(this);
  let inBetweenFunc = Engine.prototype.inBetween

  let allOperations = {
    "leftOf": pos => pos[0] -= 1,
    "rightOf": pos => pos[0] += 1,
    "above": pos => pos[1] -= 1,
    "below": pos => pos[1] += 1,
  }

  let operation = allOperations[location];
  let pos = convertFunc(index); // i -> [x, y]

  operation(pos);

  // calculated position is still in bounds.
  if(inBetweenFunc(pos[0], 0, this.width - 1, true) === true && inBetweenFunc(pos[1], 0, this.height - 1, true) === true){
    return convertFunc(pos) // [x, y] -> i
  } else return null;
};

// Shorthand.
TileMap.prototype.getNearbyTile = function(index, location){
  let nearbyTileindex = this.getNearbyTileIndex(index, location);
  if(nearbyTileindex !== null){
    return this.tiles[nearbyTileindex];
  } else return null;
};

// Shorthand for converting indexes to 1D/2D.
// position is a TILE position. [col, row];
TileMap.prototype.convertPos = function(position){
  if(Array.isArray(position) === true){
    return this.convertCoordsToIndex(position[0], position[1]);
  }
  else if(typeof position === "number"){
    return this.convertIndexToCoords(position);
  } else {
    console.error(`${position} is not a valid position type for conversion.`);
  };
};

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
 * NOTE: most coordinates used by the camera are "world coordinates".
 * with a few exceptions that need to account for spriteScaling.
*/
function Camera(parent){
  this.parent = parent // A reference to the Scene the camera belongs to.
  this.topLeft; // An array in format [x, y]
  this.centerX;
  this.centerY;
  this.viewWidth;
  this.viewHeight;
  this.spriteScale = parent.engine.spriteScale;
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

// Centers the camera at (x, y)
Camera.prototype.center = function(x, y){
  this.centerX = x;
  this.centerY = y;
  this.calculateTopLeft();
  this.clampView();
};

// Shorthand centering method.
Camera.prototype.centerOnEntity =  function(entity){
  this.center(entity.attributes["x"] * this.spriteScale, entity.attributes["y"] * this.spriteScale);
};

// Check if position is in view of camera.
// Precondition: rect coordinates are relative to the view.
Camera.prototype.rectInView = function(rect){
  let engine = this.parent.engine;
  let intersectFunc = engine.rectIntersects.bind(engine);
  let cameraRect = new Rect([0, 0], this.viewWidth, this.viewHeight);
  return intersectFunc(rect, cameraRect);
};

// Get the relative position based on given coordinates.
Camera.prototype.getRelative = function(trueX, trueY){
  return [trueX - this.topLeft[0], trueY - this.topLeft[1]];
};

// Prevents the camera view from going off the level bounds.
Camera.prototype.clampView = function(){
  let engine = this.parent.engine;
  let tileMap = this.parent.tileMap;

  let sceneWidth = tileMap.width * tileMap.tileSize * engine.spriteScale;
  let sceneHeight = tileMap.height * tileMap.tileSize * engine.spriteScale;

  // If for whatever reason the level is smaller than the viewport,
  // we should just not bother clamping it.
  if(sceneWidth < this.viewWidth || sceneHeight < this.viewHeight){
    return;
  };

  // topLeft
  let x0 = this.topLeft[0];
  let y0 = this.topLeft[1];

  // bottomLeft
  let x1 = this.topLeft[0] + this.viewWidth;
  let y1 = this.topLeft[1] + this.viewHeight;

  // center.
  let newX = this.centerX;
  let newY = this.centerY;

  // check horizontal axises.
  if(x0 < 0){
    newX = 0 + (this.viewWidth / 2);
  }
  else if(x1 > sceneWidth){
    newX = sceneWidth - (this.viewWidth / 2);
  };

  // check vertical axises.
  if(y0 < 0){
    newY = 0 + (this.viewHeight / 2);
  }
  else if(y1 > sceneHeight){
    newY = sceneHeight - (this.viewHeight / 2);
  };

  // Only center if there is a change.
  // This also prevents infinite recursion.
  if(newX !== this.centerX || newY !== this.centerY){
    this.center(newX, newY);
  };
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
  this._defaultMode = "keyboard";
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
// If array, all the ARRAY ELEMENTS are added to this.commands.
Controller.prototype.addCommands = function(e){
  if(e.constructor === Array){
    this.commands = this.commands.concat(e);
  } else this.commands.push(e);
};

// Gets and returns all inputs from active devices (based on mode);
Controller.prototype.getInputs = function(events, data){
  let inputs = []; // Inputs detected this frame.

  if(this.mode === "keyboard"){
    let inputEvents = events.get("inputEvents");

    if(inputEvents.has("keyboard") === true){
      inputs = inputs.concat(inputEvents.get("keyboard"));
    };

    if(inputEvents.has("mouse") === true){
      inputs = inputs.concat(inputEvents.get("mouse"));
    };

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
    if(p.timeLimit != "none"){
      engine.timerManager.setTimer(p.timeLimit, name);
    }
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

    // If pattern time limit passes, reset pattern.
    // note that if the pattern has no timelimit, then it doesn't have a timer
    // so timerComplete will be false.
    if(this.patternActive(p) === true && timerComplete === true){
      console.log("reset")
      this.resetPattern(p)
    };

    for(const i of inputs){
      if(this.patternIncludes(p, i) === true){
        let commandInputted = this.nextState(p); // Log if the command has been inputted or not while also moving to the next.
        // Fire command on input start if it's tap. Assumes p.pattern.length > 0
        if(p.type === 'tap' && p.state === 0){this.commands.push(name)}
        if(commandInputted === true){
          // Fire command on input completion if it's not tap.
          if(p.type != 'tap'){this.commands.push(name)};
          console.log(`COMMAND INPUTTED! | COMMAND: ${name}`);
          this.resetPattern(p);
        };
      };
    };

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
  this.type = inputData["type"] ? inputData["type"] : "default";
  this.timeLimit = inputData["timeLimit"] ? inputData["timeLimit"] : this._defaultTimeLimit;
  this.pattern = inputData["pattern"]; // There's no check, meaning that this must be explicitly defined.

  this.state = this._initialState; // The index of the current input of the active pattern. Starts at 0.
};
