/**
 * engine.js contains a majority of the game's system logic
 * and contains all components.
 * The Engine is essentially the game itself in a way.
 * htmlDOM refers to the html element the game will run in.
 * For this particular case it refers to the canvas element.
 */

/**
 * The game engine itself..
*/
function Engine(htmlDOM){
  this.context = htmlDOM
  this.FPS = 60; // Intended fps.
  this.windowWidth = 960;
  this.windowHeight = 540;
  // Should be a whole number; determines sprite render size.
  this.spriteScale = 3;
  // Canvas background colour.
  this.backgroundColor = 0xB8D5EE;

  // the image key in assets only stores links to images.
  this.assets = new Map();
  // Key in this.assets that contains maps of image urls.
  this.imageKey = "images";
  // contains maps of animation data.
  this.animKey = "animationData";
  // contains urls to menu data.
  this.levelKey = "levelData";
  // contains the urls to all the game's menus.
  this.menuDataKey = "menuData";
  // contains menu objects of the game's menus.
  this.menuKey = "menus";
  // contains the names of all the game's custom fonts.
  this.fontsKey = "fonts";
  // contains input command objects.
  this.inputsKey = "inputCommands";
  // contains data for drawing custom gui objects based on a spritesheet.
  this.guiConfigKey = "guiCustomStyle";

  // AssetLoader variables.
  this.dataLocation = "data";
  this.imgLocation = "img";
  this.menuLocation = this.dataLocation + "/" + "menus";
  this.fontLocation = "fonts";

  this.frameData = {
    "timeStamp": null,
    "oldTimeStamp": null,
    "timeDelta": null,
    "fps": null
  }

  // Array of all the engine's states.
  let allStates = [
    "starting",
    "running",
    "loading assets",
    "loading menus",
    "loading textures",
    "start loading fonts",
    "loading fonts"
  ];

  // Create components.
  this.stateMachine = new StateMachine(this, allStates, "starting");
  this.assetLoader = new AssetLoader(this);
  this.renderer = new Renderer(this);
  this.inputManager = new InputManager(this);
  this.timerManager = new TimerManager(this);
  this.guiManager = new GUIManager(this);
  this.audioManager = new AudioManager(this);

  this.app = new Game(this); // Create the game itself. Note that it must be created AFTER the components.

  // Setup callback functions.
  this.callbacks = this.app.callbacks;
};

Engine.prototype.updateFrameData = function(newData){
  this.frameData = Object.assign({}, data);
};

Engine.prototype.update = function(data){
  this.updateFrameData(data);
  this.timerManager.updateTimers();
  this.inputManager.captureInputs();

  if(this.stateMachine.currentState === "running"){
    this.app.update();
  } else this._runLoadingStates(); // If the engine is not running, then it must be loading something.
};

Engine.prototype.draw = function(){
  this.renderer.clear();
  if(this.stateMachine.currentState === "running"){
    this.app.draw();
  };
};

// ==============================
// Loader/Asset specific methods.
// ==============================

// loadAllAssets should be called before the game starts.
Engine.prototype.loadAllAssets = function(){
  let dataLocation = this.dataLocation;
  let imgLocation = this.imgLocation;

  this.assetLoader.getAsset(dataLocation + "/" + "image.json", true); // image urls.
  this.assetLoader.getAsset(dataLocation + "/" + "animations.json", true); // animation data.
  this.assetLoader.getAsset(dataLocation + "/" + "menus.json", true); // menu filenames.
  this.assetLoader.getAsset(dataLocation + "/" + "fonts.json", true); // custom font names.
  this.assetLoader.getAsset(dataLocation + "/" + "inputs.json", true); // input commands / patterns.
  this.assetLoader.getAsset(dataLocation + "/" + "guiCustomStyle.json", true); // input commands / patterns.

  this.assetLoader.getAsset(dataLocation + "/" + "levels.json", true); // (test) level data.
};

Engine.prototype.assetIsLoaded = function(id){
  return this.assets.has(id);
};

Engine.prototype.allAssetsLoaded = function(){
  let assetsKeys = [
    this.imageKey,
    this.animKey,
    this.levelKey,
    this.menuDataKey,
    this.fontsKey,
    this.inputsKey
  ];

  for(const key of assetsKeys){
    if(this.assets.has(key) === false){return false};
  };
  return true;
};

Engine.prototype.loadAllMenus = function(){
  if(this.assets.has(this.menuDataKey)){
    let menuURLS = this.assets.get(this.menuDataKey);
    for(let [id, url] of menuURLS){
      url = this.menuLocation + "/" + url;
      this.assetLoader.getAsset(url, true);
    };
  } else console.error(`Cannot load menus. ${this.menuDataKey} does not exist in assets.`);
};

Engine.prototype.allMenusLoaded = function(){
  let menuURLS = this.assets.get(this.menuDataKey);
  let menus = this.assets.get(this.menuKey);
  if(menus === undefined || menuURLS === undefined){
    return false;
  } else return menus.size === menuURLS.size;
};

Engine.prototype.loadAllFonts = function(callback){
  let allFonts = this.assets.get(this.fontsKey);
  this.renderer.loadBitmapFonts(allFonts, callback);
};

// ==========================
// Renderer specific methods.
// ==========================

Engine.prototype.loadAllTextures = function(callback){
  let imageMap = this.getLoadedAsset(this.imageKey);
  let imageArray = Array.from(imageMap.values());
  this.renderer.loadTextures(imageMap, callback);
};

// Get the image information from its id in assets.
Engine.prototype.getImage = function(id){
  // Error handling.
  if(this.assets.get(this.imageKey).has(id) === false){
    console.error(`Error while trying to get image ${id}. ${id} does not exist.`);
  };
  return this.getLoadedAsset(this.imageKey).get(id);
}

// Get asset from this.assets; includes error check. called getLoadedAsset to
// differentiate from assetLoader.getAsset()
Engine.prototype.getLoadedAsset = function(key){
  // Error handling.
  if(this.assets.has(key) === false){
    console.error(`Error while trying to get asset ${key}. ${key} does not exist in assets.`);
  };
  return this.assets.get(key);
}

// =====================
// File related methods.
// =====================

// Note: All accepted xmls for the engine must have a <header> within the <file>
Engine.prototype.verifyXML = function(data){
  let fileTag = data.children[0];
  let headerTag = fileTag.children[0];

  if(fileTag.tagName === "file" && headerTag.tagName === "header"){
    return true;
  } else {
    console.error(`Error verifying XML file.` +
      ` Detected fileTag: ${data.children[0].tagName}.` +
      ` Detected headerTag: ${data.children[0].children[0].tagName}`);
    return false;
  };
};

// Assumes the data is already verified.
Engine.prototype.getXMLType = function(data){
  let headerTag = data.children[0].children[0];
  let headerChildren = this.getXMLChildren(headerTag);
  if(headerChildren.has("type")){
    return headerChildren.get("type").innerHTML; // If it's anything other than raw text it might cause problems.
  } else console.error(`XML file's header has no type declared. Header: ${headerTag}`);
};

// Gets all xml children one level underneath tag and return them as a map.
// Note: This function only works properly if all children tags are unique.
// Otherwise it'll overwrite tags with the same name due to the nature of Map's set method.
Engine.prototype.getXMLChildren = function(tag){
  let children = new Map();
  for(const child of tag.children){
    children.set(child.tagName, child);
  };
  return children;
};

// Creates a map of attributes belonging to a single xml tag.
Engine.prototype.getXMLAttributes = function(tag){
  let attributes = Object.values(tag.attributes);
  let map = new Map();
  for(const a of attributes){
    map.set(a.name, a.value);
  };
  return map;
};

// Converts string input like "[1, 2, 3]" or  "1, 2, 3" to ["1", "2", "3"]
Engine.prototype.convertStringToArray = function(s){
  return s.replaceAll(' ','').replaceAll('[', '').replaceAll(']', '').split(',');
};

// =================================
// Gemeral common math calculations.
// =================================

// Convert the index of a 1d array to the cartesian coordinate
// equivalent of a similar 2d array.
Engine.prototype.convertIndexToCoords = function(index, arrayWidth){
  let index_Y = Math.floor(index / arrayWidth);
  let index_X = index % arrayWidth;
  return [index_X, index_Y];
};

// Convert the coords of a 2d array to the 1d index equivalent.
Engine.prototype.convertCoordsToIndex = function(index_X, index_Y, arrayWidth){
  return index_Y * arrayWidth + index_X;
};

Engine.prototype.inBetween = function(value, lower, upper, inclusive=false){
  let result;
  if(inclusive === false){
    result = (lower < value && value < upper);
  } else result = (lower <= value && value <= upper);
  return result;
};

// Get the row of a an array. Returns array of items in row.
Engine.prototype.getRow = function(array, row, totalCols){
  // Slice list from first item in row to the last item in row.
  return array.slice(row * totalCols, (row * totalCols) + totalCols);
};

// Get the column of an array. Returns array of items in column.
Engine.prototype.getColumn = function(array, col, totalCols){
  let colArray = [];
  for(let row = 0; row < totalCols; row++){
    colArray.push(array[row * totalCols + col]);
  };
  return colArray;
};

// Return true if the point exists inside the rectangle.
// rect = Rect not PIXI.Rectangle.
Engine.prototype.pointInRect = function(x, y, rect){
  let inBetween = this.inBetween.bind(this);
  let topLeftX = rect.topLeft[0];
  let topLeftY = rect.topLeft[1];
  let width = rect.width;
  let height = rect.height;
  let result = (
    inBetween(x, topLeftX, topLeftX + width, true) === true &&
    inBetween(y, topLeftY, topLeftY + height, true) === true
  );
  return result;
};

Engine.prototype.rectIntersects = function(rectA, rectB){
  let pointInRect = this.pointInRect.bind(this);
  let x1 = rectA.topLeft[0];
  let y1 = rectA.topLeft[1];

  let x2 = rectB.topLeft[0];
  let y2 = rectB.topLeft[1];

  let intersectX = Math.max(x1, x2);
  let intersectY = Math.max(y1, y2);
  let result = (
    pointInRect(intersectX, intersectY, rectA) == true &&
    pointInRect(intersectX, intersectY, rectB) == true
  );
  return result;
};

// If n is outside the bounds, set it as the nearest endpoint value.
// Precondition: a <= b
Engine.prototype.boundNum = function(n, a, b){
  if(a > b){console.error(`interval bounds are invalid! bounds: [${a}, ${b}]`)}

  if(n < a){n = a}
  else if(n > b){n = b};
  return n;
};
// ======================
// Input related methods.
// ======================

// Shorthand access for active input events.
Engine.prototype.getInputEvents = function(){
  return this.inputManager.events;
};

Engine.prototype.getInputDevice = function(deviceName){
  let devices = this.inputManager.inputDevices;
  if(devices.has(deviceName)){
    return devices.get(deviceName);
  } else console.error(`Error getting input device! ${deviceName} does not exist.`);
};

// ================
// Private methods.
// ================

// In hindsight, I should've just bit the bullet and learned promises. Oh well :|
Engine.prototype._runLoadingStates = function(){
  let state = this.stateMachine.currentState;
  // starting -> loading assets
  if(state === "starting"){
    this.stateMachine.changeState("loading assets");
    this.loadAllAssets();
  }

  // loading assets -> loading textures -> loading fonts
  else if(state === "loading assets" && this.allAssetsLoaded() === true){
    this.stateMachine.changeState("loading textures");
    const callback = () => {
      this.stateMachine.changeState("start loading fonts");
    };
    this.loadAllTextures(callback);
  }

  // loading fonts -> loading menus
  else if(state === "start loading fonts"){
    this.stateMachine.changeState("loading fonts");
    const callback = () => {
      this.stateMachine.changeState("loading menus");
      this.loadAllMenus();
    };
    this.loadAllFonts(callback);
  }

  // loading menus -> running
  else if(state === "loading menus" && this.allMenusLoaded() === true){
    this.stateMachine.changeState("running");
    this.app.stateMachine.changeState(this.app.startingState);
  };

};

// =======================
// Game related functions.
// =======================

Engine.prototype.getSpriteScaledPosition = function(x, y){
  return [x * this.spriteScale, y * this.spriteScale];
};

/**
 * Custom asset loader. Is responsible for loading data file assets
 * into the game.
*/
function AssetLoader(parent){
  this.parent = parent;
};

// Method has the option to immediately load the asset into the game.
AssetLoader.prototype.getAsset = function(url, load=false){
  let loadFunc;
  let loadMethods = {
    '.json': this.loadJson.bind(this), // Have to do bind for this keyword to be preserved.
    '.xml': this.loadXML.bind(this)};

  for(const [fileExt, method] of Object.entries(loadMethods)){
    if(url.endsWith(fileExt)){loadFunc = method};
  };

  let req = $.get(url);

  // If the request fails...
  req.fail((jqXHR, textStatus, errorThrown) => {
    console.error(`Error while trying to get asset (${url}): ${errorThrown}`)});

  if (load === true){
    req.done(loadFunc);
  } else return req;
};

AssetLoader.prototype.loadJson = function(data, success){
  let jsonKeys = Object.keys(data);
  jsonKeys.forEach((key) => {
    // If the value is an array just set it as an array.
    if(data[key].constructor === Array){
      this.parent.assets.set(key, data[key])
    } // Otherwise create a map out of the data.
    else {
      let assetMap = new Map();
      for(const [id, value] of Object.entries(data[key])){
        assetMap.set(id, value);
      };
      this.parent.assets.set(key, assetMap);
    };
  });
};

AssetLoader.prototype.loadXML = function(data, success){
  let verifyXML = this.parent.verifyXML;
  let getXMLType = this.parent.getXMLType.bind(this.parent);
  let loadFunc;
  if(verifyXML(data) === true){
    let type = getXMLType(data);
    switch(type){
      case "menu":
        loadFunc = this.loadMenu.bind(this);
        loadFunc(data);
        break;
      default:
        console.error(`Error loading an XML file. Not a valid type! Detected type: ${type}. File: ${data}`);
    };
  };
};

AssetLoader.prototype.loadMenu = function(data, success){
  let engine = this.parent;
  // let menu = new Menu(this.parent, data);
  let menu = engine.guiManager.createMenuFromData(data);
  let menuKey = engine.menuKey;
  if(engine.assets.has(menuKey) === false){
    engine.assets.set(menuKey, new Map()); // If first time loading menu, create the initial map.
  };
  engine.assets.get(menuKey).set(menu.name, menu);
};

/**
 * Custom state machine class. Is responsible for changing and keeping track
 * of states.
 *
 * [states] can be an array of strings if none of the states require methods to be called.
 * on change. i.e. ["starting", "loading", "runnng"]
 *
 * If any states in [states] DO require transition methods then an object must be passed,
 * where each key corresponds to an array.
 * i.e. "stateName": [transitionInMethod, transitionOutMethod]
*/
function StateMachine(parent, states, initialState){
  this.parent = parent;
  // A lot of the states are currently placeholder. Will be adapted as needed.
  this.allStates = states;
  this.currentState = initialState;
};

StateMachine.prototype.isValidState = function(string){
  let result;
  if(this.allStates.constructor === Array){
    result = this.allStates.includes(string);
  } else result = this.allStates[string] !== undefined; // Else; assume allStates is an object.
  return result;
};

StateMachine.prototype.changeState = function(newState){
  if(this.isValidState(newState) === true){
    if(this.allStates.constructor !== Array){ // Assume allStates is an object.
      this._callTransitionMethod(this.currentState, "out"); // Call the out method of the last state.
      this.currentState = newState; // Change state.
      this._callTransitionMethod(this.currentState, "in"); // Call the in method of the new state.
    } else this.currentState = newState; // Else; is an array. Just change the state.
  } else console.error(`${newState} is not a valid state.`); // Error handling.
};

// Precondition: stateName is a valid state. and this.allStates is an object.
StateMachine.prototype._callTransitionMethod = function(stateName, type){
  let validTypes = {"in": 0, "out": 1}
  let methodIndex = validTypes[type];
  if(this.allStates[stateName] !== null){
    let transitionMethod = this.allStates[stateName][methodIndex];
    transitionMethod();
  };
};

/**
 * Custom timer class. Suprised I didn't make this earlier.
 * Runs in miliseconds.
 * Not necessarily a true timer, just has a start and stop time.
 * It is up to whoever using them to properly check them every frame.
*/
function Timer(id, timeStamp, length){
  this.id = id;
  this.start = timeStamp;
  this.length = length;
  this.stop = timeStamp + length;
  this.complete = false;
};

/**
  * Time manager class. A simple interface for setting, checking, and updating
  * multiple timers.
*/
function TimerManager(parent){
  this.parent = parent; // A reference to engine.
  this.allTimers = new Map();
  // Store the most recently used generic id. For internal usage.
  this._genericID = 0
};

TimerManager.prototype._getTimeStamp = function(){
  return this.parent.frameData["timeStamp"];
};

TimerManager.prototype._getGenericID = function(){
  let id = this._genericID;
  this._genericID += 1;
  return 'timer_' + id.toString();
};

// The private methods (with an underscore) do not chec if timerName
// exists in this.allTimers or not.
TimerManager.prototype._getTimer = function(timerName){
  return this.allTimers.get(timerName);
};

TimerManager.prototype._removeTimer = function(timerName){
  this.allTimers.delete(timerName);
};

TimerManager.prototype._resetTimerAttributes = function(timerName){
  let getTimerFunc = this._getTimer.bind(this)
  let getTimeStampFunc = this._getTimeStamp.bind(this)
  timer = getTimerFunc(timerName);
  currentTimeStamp = getTimeStampFunc();

  timer.start = currentTimeStamp;
  timer.stop = currentTimeStamp + timer.length;
  timer.complete = false;

}
// Returns whether the timer is inactive / completed (bool)
// if deleteTimer is true, then the timer will be deleted after
TimerManager.prototype._getTimerComplete = function(timerName, deleteTimer=false){
  let getTimerFunc = this._getTimer.bind(this)
  let timer = getTimerFunc(timerName);
  let result =  timer.complete;

  if(result === true && deleteTimer === true){
    let deleteFunc = this._removeTimer.bind(this);
    deleteFunc(timerName);
  };
  return result;
};

// Make sure this is called after frameData in Engine is updated.
TimerManager.prototype.updateTimers = function(){
  let getTimeStampFunc = this._getTimeStamp.bind(this);
  let timeStamp = getTimeStampFunc();

  for(const timer of this.allTimers.values()){
    if(timeStamp > timer.stop){timer.complete = true}
  };
};

// Set the timer and return its id in allTimers
TimerManager.prototype.setTimer = function(length, timerName=null){
  let idGetterFunc = this._getGenericID.bind(this);
  let getTimeStampFunc = this._getTimeStamp.bind(this);

  let id = (timerName === null) ? idGetterFunc() : timerName;
  let timer = new Timer(id, getTimeStampFunc(), length);
  this.allTimers.set(timerName, timer);

  return id;
};

TimerManager.prototype.resetTimer = function(timerName){
  if(this.allTimers.has(timerName) === true){
    resetTimerFunc = this._resetTimerAttributes.bind(this);
    resetTimerFunc(timerName);
  };
};

// Checks if timer is complete. Can optionally set whether complete timers
// should be removed from the map or not.
TimerManager.prototype.isComplete = function(timerName, deleteTimer=true){
  if(this.allTimers.has(timerName) === false){
    return false;
  } else {
    let getCompleteFunc = this._getTimerComplete.bind(this);
    return getCompleteFunc(timerName, deleteTimer);
  };
};
