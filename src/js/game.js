/**
 * game.js contains the "game object"  itself. It separates the systems code
 * from all the code that will be unique to the application.
 * game.js will be in charge of changing game state (not system state)
 * and setting up how levels and menus will be organized.
 * (will probably be combined into one file with logic.js at a later date).
*/

function Game(engine){
  this.engine = engine;
  // Create aliases for engine components.
  this.renderer = engine.renderer;
  this.animationManager = this.renderer.animationManager;
  this.gameStateObject = {};

  // Create game components.
  this.controller = new Controller();

  let allStates = {
    "starting": null,
    "mainMenu": [this._loadMenu.bind(this, "mainMenu"), this._clearGameStateObject.bind(this)],
    "inLevel": [this._loadTestLevel.bind(this), this._clearGameStateObject.bind(this)],
    "options": null,
    "credits": null,
    "paused": null,
  };

  this.startingState = "starting"
  this.stateMenus = {
    "mainMenu": "mainMenu"
  }; // Wtf is this?

  // Create components.
  this.stateMachine = new StateMachine(this, allStates, this.startingState);
  this.sceneManager = new SceneManager();

  // Setup callbacks.
  this.callbacks = {
    "startGame":  this.stateMachine.changeState.bind(this.stateMachine,"inLevel"),
    "openOptions": this.stateMachine.changeState.bind(this.stateMachine, "options"),
    "openCredits": this.stateMachine.changeState.bind(this.stateMachine, "credits")
  };
};

Game.prototype.update = function(data){
  let currentState = this.stateMachine.currentState;
  this.gameStateObject["events"] = new Map(); // Init / re-init the game events.
  let events = this.gameStateObject["events"] // Create an alias.
  let inputs = this.engine.getInputEvents();
  events.set("inputEvents", this.engine.getInputEvents());

  switch(currentState){
    case "starting": // For loading stuff specific to the game.
      this.controller.createPatterns(this.engine, data["timeStamp"]);
      this.stateMachine.changeState("mainMenu")
      break;
    case "mainMenu":
      if(events.get("inputEvents").size > 0){
        this.gameStateObject["menu"].checkClicks()};
      break;
    case "inLevel":
      let scene = this.gameStateObject["scene"];
      if(this.controller.hasCommands() === true){this.controller.clearCommands()}; // Clear any leftover commands.
      let inputData = this.controller.getInputs(events, data);
      this.controller.addCommands(inputData[0]); // Raw input data is added to command stack.
      this.controller.updatePatterns(inputData[0], inputData[1]); // Check for complex command inputs.
      this._updateLevel(scene);
      let level = this.gameStateObject["scene"];
      let player = this.gameStateObject["scene"].getEntity("player");
      let camera = level.camera;
      let posArray = [player.attributes["x"], player.attributes["y"]]
      camera.center(posArray[0], posArray[1], player.attributes["sprite"].height);
      let relPosArray = camera.getRelative(posArray[0], posArray[1]);
      this.animationManager.nextFrame(player.attributes["currentAnimation"]);
      player.attributes["sprite"] = this.animationManager.getSprite(player.attributes["currentAnimation"]);
      break;
  };
};

Game.prototype.draw = function(){
  let currentState = this.stateMachine.currentState;
  let renderer = this.engine.renderer;
  switch(currentState){
    case "starting":
      break;
    case "mainMenu":
      renderer.drawMenu(this.gameStateObject["menu"]);
      break;
    case "inLevel":
      let level = this.gameStateObject["scene"];
      let player = this.gameStateObject["scene"].getEntity("player");
      let camera = level.camera;
      let posArray = [player.attributes["x"], player.attributes["y"]]
      let relPosArray = camera.getRelative(posArray[0], posArray[1]);

      renderer.drawTiles(this.gameStateObject["scene"])
      this.renderer.drawSprite(player.attributes["sprite"], relPosArray[0], relPosArray[1])
      renderer.drawText(this.controller.patterns.get("doubleTap-right")["state"])
      renderer.drawText(player.attributes["state"], 100);
  };
};

// =========================
// State transition methods.
// =========================
Game.prototype._clearGameStateObject = function(){
  this.gameStateObject = {};
};

Game.prototype._loadMenu = function(menuName){
  let state = this.stateMachine.currentState;
  let gameStateObject = this.gameStateObject;

  if(gameStateObject["menu"] === undefined || gameStateObject["menu"].name !== menuName){
    gameStateObject["menu"] = this.engine.getLoadedAsset("menus").get(menuName);
    gameStateObject["menu"].layout.organize();
  };
};

// Set the gameStateObject's scene.
Game.prototype._loadLevel = function(levelData){
  let levelSpriteSheet = this.engine.renderer.getSheetFromId(levelData.spriteSheet);
  let level = new Scene(this.engine, levelSpriteSheet, levelData);
  level.camera.setup(0, 0, this.engine.windowWidth, this.engine.windowHeight);
  this.gameStateObject["scene"] = level;
};

Game.prototype._loadTestLevel = function(){
  let spawnpoint = [0, 0];
  let levelData = this.engine.getLoadedAsset(this.engine.levelKey).get("testLevel");
  this._loadLevel(levelData);
  let level = this.gameStateObject["scene"];
  let player = this._createPlayerObject();
  level.addEntity(player);
  this.sceneManager.setScene(level);
  let camera = level.camera;
  let posArray = [player.attributes["x"], player.attributes["y"]];
  camera.center(posArray[0], posArray[1], player.attributes["sprite"].height);
};

// ===============
// Update methods.
// ===============

Game.prototype._updateLevel = function(scene){
  let events = this.gameStateObject["events"]
  if(scene.entities.has("player") === true){
    let player = scene.getEntity("player");
    this._handlePlayerMovement(player);
  };
};

Game.prototype._handlePlayerMovement = function(player){
  let moveCommands = ["keyDown-left", "keyDown-right", "keyDown-up", "keyDown-down"];
  let sprintCommands = ["doubleTap-right", "doubleTap-left", "doubleTap-up", "doubleTap-down"];

  let commands = this.controller.getCommands();
  let isMoving = moveCommands.some(c => commands.includes(c) === true); // Booleans
  let startSprint = sprintCommands.some(c => commands.includes(c) === true);

  // Sprint state check.
  if(startSprint === true && player["state"] != "sprinting"){
    player.attributes["state"] = "sprinting";
  } else if(player.attributes["state"] === "sprinting" && isMoving === false){
    player.attributes["state"] = "idle";
  };

  // Set speed.
  let velocity = (player.attributes["state"] === "sprinting") ? player.attributes["sprintSpeed"] : player.attributes["speed"];

  let movMap = {
    "keyDown-left": ["x", -velocity],
    "keyDown-right": ["x", +velocity],
    "keyDown-up": ["y", -velocity],
    "keyDown-down": ["y", +velocity]
  };

  commands.forEach(c => {
    if(Object.keys(movMap).includes(c)){
      let moveProperty = movMap[c]; // This is the key / value pair in movMap.
      // Adjust the player's x / y coordinate accprdomg tp the movMap.
      player.attributes[moveProperty[0]] += moveProperty[1];
    }
  });
};

Game.prototype._updatePatterns = function(){

};
// ===============================
// Entity Object creation methods.
// ===============================

// Create the player object.
// LIST OF CURRENT PLAYER STATES (for documentation purposes)
// idle, sprinting
Game.prototype._createPlayerObject = function(){
  let engine = this.engine // create alias.
  let player = new Entity("player", null, "player", "idle", 0, 0);
  player.attributes["animations"] = new Map(); // Animations is a map of all the available animations.
  player.attributes["speed"] = 5; // Set the default player movement speed.
  player.attributes["sprintSpeed"] = player.attributes["speed"] * 2;

  let idleAnimations = {
    "idle_front": engine.getLoadedAsset(engine.animKey).get("player_idle_front"),
    "idle_back": engine.getLoadedAsset(engine.animKey).get("player_idle_back"),
    "idle_left": engine.getLoadedAsset(engine.animKey).get("player_idle_left"),
    "idle_right": engine.getLoadedAsset(engine.animKey).get("player_idle_right")
  };

  let allAnimations = [idleAnimations];

  // Add all of the animations in allAnimations to the player's attribute "animations".
  allAnimations.forEach(object => {
    let spriteSheet;
    let animation;
    for(let [key, value] of Object.entries(object)){
      spriteSheet = this.renderer.getSheetFromId(value["spriteSheet"]);
      animation = new Animation(key, spriteSheet, value);
      player.attributes["animations"].set(key, animation)
    }
  });

  // Set the default sprite.
  let defaultAnimation = player.attributes["animations"].get("idle_front");
  this.animationManager.activateAnimation(defaultAnimation);
  player.attributes["currentAnimation"] = defaultAnimation;
  player.attributes["sprite"] = this.animationManager.getSprite(defaultAnimation);
  return player
};
