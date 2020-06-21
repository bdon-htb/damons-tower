/**
 * engine.js contains a majority of the game's system logic
 * and contains all components.
 * The Engine is essentially the game itself in a way.
 * htmlDOM refers to the html element the game will run in.
 * For this particular case it refers to the canvas element.
 */

// TODO: Implement a state machine with a loading state. Do this whenever I need to load assets.

/**
 * The game engine itself..
*/
function Engine(htmlDOM){
  this.context = htmlDOM
  this.windowWidth = 800;
  this.windowHeight = 600;
  this.backgroundColor = 0xB8D5EE;
  // this.allAssetsLoaded = false; <- would have to rework assetLoader.getAsset.
  // this.allTexturesLoaded = false;

  // TODO: implement image storage and identification.
  // the image array in assets only stores links to images.
  this.assets = new Map();
  // Key in this.assets that contains the array of image urls.
  this.imageKey = "images"

  // AssetLoader variables.
  this.dataLocation = "data";
  this.imgLocation = "img";

  // Create components.
  this.assetLoader = new AssetLoader(this);
  this.loadAllAssets(); // Loader must be initialized first.
  this.renderer = new Renderer(this);
  this.loadAllTextures();

};

Engine.prototype.draw = function(data){
  this.renderer.drawText(data.fps)
  this.renderer.drawRect(0x66CCFF, 96, 96, 50, 50)
  this.renderer.test()
};

Engine.prototype.update = function(data){}

Engine.prototype.run = function(data){
  this.draw(data);
  // this.update(data);
};

// Loader specific methods.

// loadAllAssets should be called before the game starts.
Engine.prototype.loadAllAssets = function(){
  // Set aliases.
  dataLocation = this.dataLocation;
  imgLocation = this.imgLocation;

  // Load image locations.
  this.assetLoader.getAsset(dataLocation + "/" + "image.json", true);
};

Engine.prototype.assetIsLoaded = function(id){
  return this.assets.has(id);
};

// Renderer specific methods.

// loadAllGraphics should be called before the game starts.
Engine.prototype.loadAllTextures = function(){
  // TODO: PROBLEM: this does not account for if the assets have been loaded yet.
  imageArray = this.assets.get(this.imageKey);
  this.renderer.loadTextures(imageArray, () => {this.allTexturesLoaded = true});
};

/**
 * Custom loader. Is responsible for loading data file assets.
*/
function AssetLoader(parent){
  this.parent = parent;
};

AssetLoader.prototype.getAsset = function(url, load=false){
  let loadFunc;
  if (url.endsWith('.json')){
    // Have to do bind for this keyword to be preserved.
    loadFunc = this.loadJson.bind(this);
  };
  let req = $.get(url);
  if (load === true){
    req.done(loadFunc);
  } else return req;
};

AssetLoader.prototype.loadJson = function(data, success){
  let keys = Object.keys(data);
  keys.forEach((key, index, array) => {
    values = Object.values(data[key]);
    this.parent.assets.set(key, values);
  });
};

function StateMachine(parent){
  this.allStates;
  this.currentState;
};
