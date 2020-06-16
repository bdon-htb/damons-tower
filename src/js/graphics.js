/**
 * renderer.js contains all of the game's graphics code,
 * everything pixi.js related goes here!
 */

function Renderer(parent){
  this.parent = parent;
  this.verifyAPI();
  this.createApp();
}

Renderer.prototype.verifyAPI = function(){
  let type = "WebGL";
  if(!PIXI.utils.isWebGLSupported()){
    type = "canvas";
  }
  PIXI.utils.sayHello(type);
}

Renderer.prototype.createApp = function(){
  this.app = new PIXI.Application({
    view: this.parent.context,
    width: this.parent.windowWidth,
    height: this.parent.windowHeight,
    backgroundColor: this.parent.backgroundColor
  });
}

Renderer.prototype.loadAssets = function(){
  PIXI.Loader.shared
    .add("img/jo_the_pyro.png")
    .load();
}
