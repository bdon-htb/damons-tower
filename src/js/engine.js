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
  this.windowWidth = 800;
  this.windowHeight = 600;
  // Should be a whole number; determines sprite render size.
  this.scale = 3;
  this.backgroundColor = 0xB8D5EE;

  // the image key in assets only stores links to images.
  this.assets = new Map();
  // Key in this.assets that contains maps of image urls.
  this.imageKey = "images";
  // contains maps of animation data.
  this.animKey = "animationData";
  // contains urls to menu data.
  this.levelKey = "levelData";
  // contains menu objects of the game's menus.
  this.menuKey = "menus";

  // AssetLoader variables.
  this.dataLocation = "data";
  this.imgLocation = "img";

  // Create components.
  this.stateMachine = new StateMachine(this);
  this.assetLoader = new AssetLoader(this);
  this.renderer = new Renderer(this);
  this.inputManager = new InputManager(this);

  // Placeholder component - purely for testing purposes.
  this.tester = new Tester(this);

};

Engine.prototype.draw = function(data){
  this.renderer.clear();
  this.tester.testDraw(data);
};

Engine.prototype.update = function(data){
  // console.log(this.inputManager.inputDevices)
  this.inputManager.captureInputs();
  this.tester.testUpdate(data);
  //if(this.inputManager.events.size > 0){
    // console.log(this.inputManager.events.get("mouse"));
  // };
};

// This will obviously have to be more elaborate when the actual game is being made.
Engine.prototype.run = function(data){
  let state = this.stateMachine.currentState;
  // console.log(state);
  if(state == "starting"){
    this.stateMachine.changeState("loading assets"); // Start loading the assets.
    this.loadAllAssets();
  }
  // Check if current state is "loading assets" and the engine assets has images loaded.
  else if(state == "loading assets" && this.allAssetsLoaded() === true){
    this.stateMachine.changeState("loading textures");
    // Set it so that when the textures finish loading, the state changes to "running."
    let callback = () => {
      this.stateMachine.changeState("running");
      this.tester.init();
    };
    this.loadAllTextures(callback);
  }
  else if(state == "running"){
    this.update(data);
    this.draw(data);
  };
};

// Loader specific methods.

// loadAllAssets should be called before the game starts.
Engine.prototype.loadAllAssets = function(){
  // Set aliases.
  let dataLocation = this.dataLocation;
  let imgLocation = this.imgLocation;

  // Load image locations.
  this.assetLoader.getAsset(dataLocation + "/" + "image.json", true);
  // Load animation data.
  this.assetLoader.getAsset(dataLocation + "/" + "animations.json", true);

  // Load TEST level data.
  this.assetLoader.getAsset(dataLocation + "/" + "levels.json", true);

  // Load mm.xml
  this.assetLoader.getAsset(dataLocation + "/" + "menus/mm.xml", true);
};

Engine.prototype.assetIsLoaded = function(id){
  return this.assets.has(id);
};

Engine.prototype.allAssetsLoaded = function(){
  let assetsKeys = [
    this.imageKey,
    this.animKey,
    this.levelKey,
    this.menuKey,
  ];

  for(const key of assetsKeys){
    if(this.assets.has(key) === false){return false};
  };
  return true;
};

// Renderer specific methods.

Engine.prototype.loadAllTextures = function(callback){
  let imageMap = this.getLoadedAsset(this.imageKey);
  let imageArray = Array.from(imageMap.values());
  this.renderer.loadTextures(imageMap, callback);
};

// Get the image filename from its id in assets.
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

// File related methods.

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

// Puts all the xml children one level under into a map.
// Note: This function only works properly if all children tags are unique.
// Otherwise it'll overwrite tags with the same name due to the nature of Map's set method.
Engine.prototype.getXMLChildren = function(tag, overwrite=false){
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

// Gemeral common math calculations.
// Convert the index of a 1d array to the cartesian coordinate
// equivalent of a similar 2d array.
Engine.prototype.convertIndexToCoords = function(index, arrayWidth){
  let index_Y = Math.floor(index / arrayWidth);
  let index_X = index % arrayWidth;
  return [index_X, index_Y];
};

// Convert the coords of a 2d array to the 1d index equivalent.
Engine.prototype.convertCoordsToIndex = function(index_X, index_Y, arrayWidth){
  return index_X * arrayWidth + index_Y;
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
  let assetMap = new Map();
  jsonKeys.forEach((key) => {
    for(const [id, value] of Object.entries(data[key])){
      assetMap.set(id, value);
    };
    this.parent.assets.set(key, assetMap);
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
  let menu = new Menu(this.parent, data);
  let menuKey = this.parent.menuKey;
  if(this.parent.assets.has(menuKey) === false){
    this.parent.assets.set(menuKey, new Map()); // If first time loading menu, create the map.
  };
  this.parent.assets.get(menuKey).set(menu.name, menu);
  console.log(this.parent.assets);
};

/**
 * Custom state machine class. Is responsible for chaning and keeping track
 * of ENGINE state.
*/
function StateMachine(parent){
  this.parent = parent;
  // A lot of the states are currently placeholder. Will be adapted as needed.
  this.allStates = [
    "starting",
    "running",
    "paused",
    "loading assets",
    "loading textures",
    "error",
    "debug"
  ];
  this.currentState = "starting";
};

StateMachine.prototype.isValidState = function(string){
  return this.allStates.includes(string);
};

StateMachine.prototype.changeState = function(newState){
  if(this.isValidState(newState) === true){
    this.currentState = newState;
  } else console.error(`${newState} is not a valid state.`);
};
