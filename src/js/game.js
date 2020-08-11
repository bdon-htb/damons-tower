/**
 * game.js contains the "game object"  itself. It separates the systems code
 * from all the code that will be unique to the application.
 * game.js will be in charge of changing game state (not system state)
 * and setting up how levels and menus will be organized.
 * (will probably be combined into one file with logic.js at a later date).
*/

function Game(engine){
  this.engine = engine;
  this.gameStateObject = {};

  // TODO: Figure out how to organize transition structure
  let allStates = {
    "mainMenu": null,
    "inLevel": null,
    "options": null,
    "credits": null,
    "paused": null,
  };
  this._setupTransitions(allStates);

  // Create components.
  this.stateMachine = new StateMachine(this, allStates, "mainMenu");
  this.sceneManager = new SceneManager();

  // Setup callbacks.
  this.callbacks = {
    "startGame": () => this.stateMachine.changeState("inLevel"),
    "openOptions": () => this.stateMachine.changeState("options"),
    "openCredits": () => this.stateMachine.changeState("credits")
  };
};

Game.prototype.update = function(){
  let currentState = this.stateMachine.currentState;
};

Game.prototype.draw = function(){
  let currentState = this.stateMachine.currentState;
  let renderer = this.engine.renderer;
  switch(currentState){
    case "mainMenu":
      renderer.drawMenu(this.gameStateObject["menu"]);
      break;
    case "inLevel":

  };
};

Game.prototype._updateMenu = function(menuName){
  if(gameStateObject["menu"] === undefined || gameStateObject["menu"].name !== menuName){
    gameStateObject["menu"] = this.engine.getLoadedAsset("menus").get(menuName);
  };
};

Game.prototype._setupTransitions = function(){}
