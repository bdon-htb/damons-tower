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
  // TODO: implement image storage and identification.
  this.images;

  this.renderer = new Renderer(this);
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
