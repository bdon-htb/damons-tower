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
    "mainMenu": [this._loadMenu.bind(this, "mainMenu"), this._clearGameStateObject.bind(this)],
    "inLevel": [this._loadTestLevel.bind(this), this._clearGameStateObject.bind(this)],
    "options": null,
    "credits": null,
    "paused": null,
  };

  this.startingState = "mainMenu"
  this.stateMenus = {
    "mainMenu": "mainMenu"
  };

  // Create components.
  this.stateMachine = new StateMachine(this, allStates, "mainMenu");
  this.sceneManager = new SceneManager();

  // Setup callbacks.
  this.callbacks = {
    "startGame":  this.stateMachine.changeState.bind(this.stateMachine,"inLevel"),
    "openOptions": this.stateMachine.changeState.bind(this.stateMachine, "options"),
    "openCredits": this.stateMachine.changeState.bind(this.stateMachine, "credits")
  };
};

Game.prototype.update = function(){
  let currentState = this.stateMachine.currentState;
  switch(currentState){
    case "mainMenu":
      let inputs = this.engine.getInputEvents();
      if(inputs.size > 0){
        this.gameStateObject["menu"].checkClicks();
    };
  };
};

Game.prototype.draw = function(){
  let currentState = this.stateMachine.currentState;
  let renderer = this.engine.renderer;
  switch(currentState){
    case "mainMenu":
      renderer.drawMenu(this.gameStateObject["menu"]);
      break;
    case "inLevel":
      renderer.drawTiles(this.gameStateObject["scene"])
  };
};

// =========================
// State transition methods.
// =========================
Game.prototype._loadMenu = function(menuName){
  let state = this.stateMachine.currentState;
  let gameStateObject = this.gameStateObject;

  if(gameStateObject["menu"] === undefined || gameStateObject["menu"].name !== menuName){
    gameStateObject["menu"] = this.engine.getLoadedAsset("menus").get(menuName);
    gameStateObject["menu"].layout.organize();
  };
};

Game.prototype._loadTestLevel = function(){
  let spawnpoint = [0, 0];
  let levelData = this.engine.getLoadedAsset("levelData").get("testLevel");
  let levelSpriteSheet = this.engine.renderer.getSheetFromId(levelData.spriteSheet);
  let level = new Scene(this.engine, levelSpriteSheet, levelData);
  level.camera.setup(spawnpoint[0], spawnpoint[1], this.engine.windowWidth, this.engine.windowHeight);
  this.gameStateObject["scene"] = level;
};

Game.prototype._clearGameStateObject = function(){
  this.gameStateObject = {};
};
