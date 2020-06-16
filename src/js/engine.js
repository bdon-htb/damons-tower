/**
 * engine.js contains a majority of the game's system logic
 * and contains all other components.
 * The Engine is essentially the game itself in a way.
 * htmlDOM refers to the html element the game will run in.
 * For this particular case it refers to the canvas.
 */

function Engine(htmlDOM){
  this.context = htmlDOM
  this.windowWidth = 800;
  this.windowHeight = 600;
  this.backgroundColor = 0xB8D5EE;

  this.renderer = new Renderer(this);
}

Engine.prototype.draw = function(data){
  this.renderer.drawText(data.fps)
  this.renderer.drawRect(0x66CCFF, 96, 96, 50, 50)
}

Engine.prototype.update = function(data){}

Engine.prototype.run = function(data){
  this.draw(data);
  // this.update(data);
}
/**
 * The following functions are placeholders.
 * todo: make cleaner versions and move over to graphic.js
 */


Engine.prototype.loadAssets = function(){
  PIXI.Loader.shared
    .add("img/jo_the_pyro.png")
    .on("progress", this.progressHandler)
    .load(this.setup);
}

Engine.prototype.setup = function(){
  // This code basically sets the sprite to the single jo_the_pyro frame.
  // I'm assuming this texture variable is an alias.
  // Cannot display two different sprites from the one image like this.
  let texture = PIXI.utils.TextureCache["img/jo_the_pyro.png"];
  let rectangle = new PIXI.Rectangle(0, 0, 32, 32);
  texture.frame = rectangle;
}

Engine.prototype.progressHandler = function(loader, resource){
  // console.log(`loading: ${resource.url}`);
  // console.log(`progress: ${loader.progress}%`);
}

Engine.prototype.drawImage = function(){
  this.jo = new PIXI.Sprite(PIXI.Loader.shared.resources["img/jo_the_pyro.png"].texture);
  this.jo.x = 150;
  this.jo.y = 120;
  this.app.stage.addChild(this.jo);
}
