/**
 * game.js contains the game object  itself. It separates the systems code
 * from all the code that will be unique to the application.
 * game.js will be in charge of changing game state (not system state)
 * and setting up how levels and menus will be organized.
*/

function Game(engine){
  this.engine = engine;

  // Create aliases for engine components.
  this.renderer = engine.renderer;
  this.animationManager = this.renderer.animationManager;
  this.timerManager = engine.timerManager;

  this.debugModeOn = true;
  this.debugMenu = new DebugMenu(this);

  this.gameStateObject = {
    "events": new Map(), // A map of game events. Currently unused.
    "frameData": null, // The main loop data.
    "scene": null, // Current scene.
  };

  // An empty copy of the gameStateObject for refreshing purposes.
  this._emptyGSO = Object.assign({}, this.gameStateObject);

  // Create game components.
  this.controller = new Controller(engine);

  let allStates = {
    "starting": null,
    "mainMenu": [this._loadMenu.bind(this, "debugMenu"), this._clearGameStateObject.bind(this)],
    "inLevel": [this._loadTestLevel.bind(this), this._clearGameStateObject.bind(this)],
    "options": null,
    "credits": null,
    "paused": null,
  };

  this.startingState = "starting";

  // Create components.
  this.stateMachine = new StateMachine(this, allStates, this.startingState);
  this.sceneManager = new SceneManager();
  this.physicsManager = new PhysicsManager(this.engine);

  // Setup callbacks.
  this.callbacks = {
    "startGame":  this.stateMachine.changeState.bind(this.stateMachine,"inLevel"),
    "openOptions": this.stateMachine.changeState.bind(this.stateMachine, "options"),
    "openCredits": this.stateMachine.changeState.bind(this.stateMachine, "credits"),
    "resizeTest": this.renderer.requestFullscreen.bind(this.renderer),
    "resizeTest2": this.renderer.resizeScreen.bind(this.renderer, 1280, 720),
    "resizeTest3": this.renderer.resizeScreen.bind(this.renderer, 960, 540)
  };
};

Game.prototype.update = function(){
  this._updateFrameData(data);
  this._refreshEvents(); // Init / re-init the game events.
  let currentState = this.stateMachine.currentState;
  let events = this.gameStateObject["events"] // Create an alias.
  let inputs = this.engine.getInputEvents();
  events.set("inputEvents", this.engine.getInputEvents());

  this.debugMenu.updateVariable("game fps", this.engine.frameData["fps"]);
  switch(currentState){
    case "starting": // For loading stuff specific to the game.
      this.controller.createPatterns(data["timeStamp"]);
      this.stateMachine.changeState("mainMenu")
      break;
    case "mainMenu":
      let menu = this.gameStateObject["menu"]
      this.engine.guiManager.checkHover(menu);
      if(events.get("inputEvents").size > 0){
        this.engine.guiManager.checkClicks(menu)
      };
      break;
    case "inLevel":
      let scene = this.gameStateObject["scene"];
      if(this.controller.hasCommands() === true){this.controller.clearCommands()}; // Clear any leftover commands.
      let inputData = this.controller.getInputs(events, data);
      this.controller.addCommands(inputData); // Raw input data is added to command stack.
      this.controller.updatePatterns(inputData); // Check for complex command inputs.
      this._updateLevel(scene);
      let level = this.gameStateObject["scene"];
      let player = this.gameStateObject["scene"].getEntity("player");
      let camera = level.camera;
      let posArray = [player.attributes["x"], player.attributes["y"]]
      camera.center(posArray[0], posArray[1]);
      let relPosArray = camera.getRelative(posArray[0], posArray[1]);
      player.attributes["sprite"] = this.animationManager.getSprite(player.attributes["currentAnimation"]);
      this.animationManager.nextFrame(player.attributes["currentAnimation"]);

      this.debugMenu.updateVariable("singleTap-space state", this.controller.patterns.get("singleTap-space")["state"]);
      this.debugMenu.updateVariable("player state", player.attributes["state"]);
      this.debugMenu.updateVariable("player x", player.attributes["x"]);
      this.debugMenu.updateVariable("player y", player.attributes["y"]);
      this.debugMenu.updateVariable("canDodge", player.attributes["canDodge"]);
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
      let menu = this.gameStateObject["menu"]
      renderer.drawMenu(menu);
      break;
    case "inLevel":
      let level = this.gameStateObject["scene"];
      let player = this.gameStateObject["scene"].getEntity("player");
      let camera = level.camera;
      let sceneOrigin = camera.getRelative(0, 0);
      let playerCenter = this.engine.getSpriteScaledPosition(player.attributes["x"], player.attributes["y"]);

      playerCenter = camera.getRelative(playerCenter[0], playerCenter[1]);

      renderer.drawTiles(this.gameStateObject["scene"]);
      this.renderer.drawEntity(level, player);
      // renderer.drawRect(0xff0000, playerCenter[0], playerCenter[1], 4, 4);
      // renderer.drawRect(0xff0000, playerCenter[0] - (16 * this.engine.spriteScale), playerCenter[1] - (16 * this.engine.spriteScale), 4, 4);
      // renderer.drawRect(0xff0000, playerCenter[0] + (16 * this.engine.spriteScale), playerCenter[1] + (16 * this.engine.spriteScale), 4, 4);
      // renderer.drawRect(0xff0000, sceneOrigin[0], sceneOrigin[1], 4, 4);
  };

  if(this.debugModeOn === true){
    renderer.drawMenu(this.debugMenu);
  };
};

// =========================
// State transition methods.
// =========================
Game.prototype._clearGameStateObject = function(){
  this.gameStateObject = Object.assign({}, this._emptyGSO);
};

Game.prototype._loadMenu = function(menuName){
  let state = this.stateMachine.currentState;
  let gameStateObject = this.gameStateObject;

  if(gameStateObject["menu"] === undefined || gameStateObject["menu"].name !== menuName){
    gameStateObject["menu"] = this.engine.getLoadedAsset("menus").get(menuName);
  };
};

// Set the gameStateObject's scene.
Game.prototype._loadLevel = function(levelData){
  let levelSpriteSheet = this.engine.renderer.getSheetFromId(levelData.spriteSheet);
  let level = new Scene(levelSpriteSheet, levelData);
  level.camera.setup(0, 0, this.engine.windowWidth, this.engine.windowHeight, this.engine.spriteScale);
  this.gameStateObject["scene"] = level;
};

Game.prototype._loadTestLevel = function(){
  let spawnpoint = [16 + 32, 16 + 32];
  let levelData = this.engine.getLoadedAsset(this.engine.levelKey).get("testLevel");
  this._loadLevel(levelData);
  let scene = this.gameStateObject["scene"];
  let player = new PlayerEntity(this.engine, this);
  player.attributes["x"] = spawnpoint[0];
  player.attributes["y"] = spawnpoint[1];

  scene.addEntity(player);
  this.sceneManager.setScene(scene);
  let camera = scene.camera;
  let posArray = [player.attributes["x"], player.attributes["y"]];
  camera.center(posArray[0], posArray[1], player.attributes["sprite"].height);
};

// =======================
// Gemeral update methods.
// =======================
Game.prototype._updateLevel = function(scene){
  let events = this.gameStateObject["events"]
  if(scene.entities.has("player") === true){
    this._updatePlayer(scene);
  };
};

// ===============================
// gameStateObject update methods.
// ===============================
Game.prototype._updateFrameData = function(data){
  this.gameStateObject["frameData"] = data;
};

Game.prototype._refreshEvents = function(){
  this.gameStateObject["events"] = new Map();
};

Game.prototype._updateEvents = function(newEvents){
  this.gameStateObject["events"] = newEvents;
};

// ===============================
// General entity related methods.
// ===============================

// Checks for collision from point (x, y) to point (x + dx, y + dy)
// If there is a collision point, return that point. Otherwise return
// (x + dx, y + dy).
Game.prototype._handleCollision = function(x, y, dx, dy, scene){
  let newPos;
  let movVector = new Vector2D([x, y], [x + dx, y + dy]);

  let positiveDirections = Vector2D.prototype.isPositive(movVector);
  let directionX = positiveDirections[0] === true ? 1 : -1;
  let directionY = positiveDirections[1] === true ? 1 : -1;

  let collision = this.physicsManager.raycastCollision(movVector, scene);
  if(collision !== null){
    collision[0] = (collision[0] === x) ? x : collision[0] - (1 * directionX);
    collision[1] = (collision[1] === y) ? y : collision[1] - (1 * directionY);
    newPos = collision;
  }
  else { // No collision so we just go the full distance.
    newPos = [movVector.p2[0], movVector.p2[1]];
  };
  return newPos;
};

Game.prototype._resetEntityDisplacement = function(entity){
  entity.attributes["dx"] = 0;
  entity.attributes["dy"] = 0;
};

// =====================
// Player related methods.
// =====================
Game.prototype._updatePlayer = function(scene){
  let updateControlAttribs = this._handlePlayerControlAttributes.bind(this);
  let handleMove = this._handlePlayerMovement.bind(this);
  let updateAnim = this._updatePlayerAnimation.bind(this);

  updateControlAttribs(scene);
  handleMove(scene);
  updateAnim(scene);
};

Game.prototype._handlePlayerControlAttributes = function(scene){
  let player = scene.getEntity("player");
  if(this.timerManager.isComplete("playerDodgeCooldown") === true){
    player.attributes["canDodge"] = true;
  };
};

Game.prototype._handlePlayerMovement = function(scene){
  let player = scene.getEntity("player");
  let playerState = player.attributes["state"];
  let commands = this.controller.getCommands();
  let oldPos = [player.attributes["x"], player.attributes["y"]];
  let isMoving = false;

  if(playerState === "dodging"){
    isMoving = this._handlePlayerDodge(player, commands);
  }
  // Check if we want to dodge
  else if(player.attributes["canDodge"] === true && commands.includes("singleTap-space")){
    player.attributes["canDodge"] = false;
    this._handlePlayerDodgeStart(player, commands);
  }
  else {
    // This function also handles when the player is idling.
    isMoving = this._walkPlayer(player, commands);
  };

  if(isMoving === true){
    let newPos = this._handleCollision(player.attributes["x"], player.attributes["y"], player.attributes["dx"], player.attributes["dy"], scene);
    scene.moveEntity(player, newPos);
  };

  if(playerState === "idle"){
    this._resetEntityDisplacement(player);
  };
};

// Precondition: player.attribute["state"] === "walking" or "sprinting"
Game.prototype._handlePlayerDodgeStart = function(player, commands){
  let moveCommands = ["keyDown-left", "keyDown-right", "keyDown-up", "keyDown-down"];

  // Format: {"commandName": [coordinate, displacement, oppositeCommand]}
  // We use a magnitude of 1 for displacement so we know what direction
  // the player is going to move in. The player does NOT move the same frame a dodge is called.
  let movMap = {
    "keyDown-left": ["dx", -1, "keyDown-right"],
    "keyDown-right": ["dx", +1, "keyDown-left"],
    "keyDown-up": ["dy", -1, "keyDown-down"],
    "keyDown-down": ["dy", +1, "keyDown-up"]
  };

  let dMap = {
    "dx": 0,
    "dy": 0
  };

  for(var i = 0; i < commands.length; i++){
    let c = commands[i];
    // Prioritize the last move input and move if one is detected. This should prevent standstill by pressing opposite keys.
    if(Object.keys(movMap).includes(c) === true && commands.slice(i, commands.length).includes(movMap[c][2]) === false){
      coordinate = movMap[c][0];
      dMap[coordinate] += movMap[c][1];
    };
  };

  player.attributes["state"] = "dodging";
  player.attributes["dx"] = dMap["dx"];
  player.attributes["dy"] = dMap["dy"];
};

// Precondition: player.attributes["state"] === "dodging"
Game.prototype._handlePlayerDodge = function(player, commands){
  let dodgeAnimation = player.attributes["currentAnimation"];
  if(dodgeAnimation.active === false){ // Dodge ends.
    player.attributes["state"] = "idle";
    this.timerManager.setTimer(player.attributes["dodgeCooldown"], 'playerDodgeCooldown');
    return false;
  }
  else {
    let physicsManager = this.physicsManager;
    let dodgeSpeed = player.attributes["dodgeSpeed"];

    for(const d of ["dx", "dy"]){
      if(player.attributes[d] > 0){
        player.attributes[d] = physicsManager.calculateVelocity(dodgeSpeed);
      }
      else if(player.attributes[d] < 0){
        player.attributes[d] = physicsManager.calculateVelocity(-dodgeSpeed);
      }
      // We do nothing if displacement is 0.
    };
    return true;
  };
};

Game.prototype._walkPlayer = function(player, commands){
  let physicsManager = this.physicsManager;
  let moveCommands = ["keyDown-left", "keyDown-right", "keyDown-up", "keyDown-down"];
  let sprintCommands = ["doubleTap-right", "doubleTap-left", "doubleTap-up", "doubleTap-down"];

  let isMoving = moveCommands.some(c => commands.includes(c) === true); // Booleans
  let startSprint = sprintCommands.some(c => commands.includes(c) === true);

  // Start sprinting.
  if(startSprint === true){
    player.attributes["state"] = "sprinting";
  } // Walk.
  else if(isMoving === true && player.attributes["state"] !== "sprinting"){
    player.attributes["state"] = "walking";
  } // Keep sprinting.
  else if(isMoving === true && player.attributes["state"] === "sprinting"){
    player.attributes["state"] = "sprinting";
  } // Player is not moving at all.
  else {
    player.attributes["state"] = "idle";
  };

  if(isMoving === true){
    let velocity = (player.attributes["state"] === "sprinting") ? player.attributes["sprintSpeed"] : player.attributes["speed"];

    // Format: {"commandName": [coordinate, displacement, oppositeCommand, direction]}
    let movMap = {
      "keyDown-left": ["dx", -velocity, "keyDown-right", "left"],
      "keyDown-right": ["dx", +velocity, "keyDown-left", "right"],
      "keyDown-up": ["dy", -velocity, "keyDown-down", "up"],
      "keyDown-down": ["dy", +velocity, "keyDown-up", "down"]
    };

    let dMap = {
      "dx": 0,
      "dy": 0
    };


    for(var i = 0; i < commands.length; i++){
      let c = commands[i];
      // Prioritize the last move input and move if one is detected. This should prevent standstill by pressing opposite keys.
      if(Object.keys(movMap).includes(c) === true && commands.slice(i, commands.length).includes(movMap[c][2]) === false){
        coordinate = movMap[c][0];
        dMap[coordinate] += physicsManager.calculateVelocity(movMap[c][1]);
        player.attributes["direction"] = movMap[c][3];
      };
    };

    player.attributes["dx"] = dMap["dx"];
    player.attributes["dy"] = dMap["dy"];

    return true; // Yes we are moving
  };
  this._resetEntityDisplacement(player);
  return false; // We are not moving this frame.
};

Game.prototype._updatePlayerAnimation = function(scene){
  // Can set aliases here because we we're just checking their values.
  let player = scene.getEntity("player");
  let playerState = player.attributes["state"];
  let playerDirection = player.attributes["direction"];
  let allAnims = player.attributes["animations"];
  let animMap;
  switch (playerState){
    case "walking":
    case "sprinting":
      animMap = {
        "up": allAnims.get("player_walk_back"),
        "down": allAnims.get("player_walk_front"),
        "left": allAnims.get("player_walk_left"),
        "right": allAnims.get("player_walk_right")
      };
      break;
    case "dodging":
      animMap = {
        "up": allAnims.get("player_dodge_back"),
        "down": allAnims.get("player_dodge_front"),
        "left": allAnims.get("player_dodge_left"),
        "right": allAnims.get("player_dodge_right")
      };
      break;
    default: // Let's treat idle as default.
      animMap = {
        "up": allAnims.get("player_idle_back"),
        "down": allAnims.get("player_idle_front"),
        "left": allAnims.get("player_idle_left"),
        "right": allAnims.get("player_idle_right")
      };
  };

  let oldAnimation = player.attributes["currentAnimation"];
  let newAnimation = animMap[playerDirection];

  // If there's a change in animation...
  if(oldAnimation !== newAnimation){
    // Switch to new animation.
    this.animationManager.deactivateAnimation(oldAnimation);
    this.animationManager.activateAnimation(newAnimation);
    player.attributes["currentAnimation"] = newAnimation;
  };
};
