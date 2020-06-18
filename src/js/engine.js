/**
 * engine.js contains a majority of the game's system logic
 * and contains all other components.
 * The Engine is essentially the game itself in a way.
 * htmlDOM refers to the html element the game will run in.
 * For this particular case it refers to the canvas.
 */

/**
 * The game engine. Will host the game.
*/
function Engine(htmlDOM){
  this.context = htmlDOM
  this.windowWidth = 800;
  this.windowHeight = 600;
  this.backgroundColor = 0xB8D5EE;

  // Loader variables.
  this.dataLocation = "data/";
  this.imgLocation = "img/";

  // Create components.
  this.loader = new Loader(this);
  this.renderer = new Renderer(this);

  // TODO: implement image storage and identification.
  this.data = new Map();
  // this.images should only store links to images.
  this.images = new Map();

  this.loadAllAssets();
}

Engine.prototype.draw = function(data){
  this.renderer.drawText(data.fps)
  this.renderer.drawRect(0x66CCFF, 96, 96, 50, 50)
  this.renderer.test()

}

Engine.prototype.update = function(data){}

Engine.prototype.run = function(data){
  this.draw(data);
  // this.update(data);
}

Engine.prototype.loadAllAssets = function(){
  dataLocation = this.dataLocation;
  imgLocation = this.imgLocation;
  // Load image locations
  this.loader.getAsset(dataLocation + "image.json");
}

/**
 * Custom loader. Is responsible for loading data file assets.
*/
function Loader(parent){
  this.parent = parent;
}

/**
 * Ajax is async. So we can only load the asset after the process is complete.
 * Name is currently misleading. The function gets AND loads the information.
 * Can easily add a parameter to prevent loading and instead return later if
 * needed.
*/

Loader.prototype.getAsset = function(url){
  // Have to do this for this to be preserved.
  let loadFunc;
  if (url.endsWith('.json')) {
    loadFunc = this.loadJson.bind(this)
    $.get(url, loadFunc);
  }
}

Loader.prototype.loadJson = function(data, success){
  let keys = Object.keys(data);
  // Arrow functions aren't too bad now.
  keys.forEach((key, index, array) => {
    values = Object.values(data[key])
    this.parent.data.set(key, values)
    })
}
