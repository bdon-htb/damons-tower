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
  this.audioManager = engine.audioManager;

  this.debugModeOn = true;
  this.debugMenu = null;

  this.gameStateObject = {
    "frameData": null, // The main loop data.
    "scene": null, // Current scene.
  };

  // An empty copy of the gameStateObject for refreshing purposes.
  this._emptyGSO = Object.assign({}, this.gameStateObject);

  // Create game components.
  this.controller = new Controller(engine);

  let allStates = {
    "starting": null,
    "mainMenu": [this._loadGame.bind(this), this._clearGameStateObject.bind(this)],
    "settingsMenu": [this._loadMenu.bind(this, "settingsMenu"), this._clearGameStateObject.bind(this)],
    "credits": [this._loadMenu.bind(this, "creditsMenu"), this._clearGameStateObject.bind(this)],
    "inLevel": [this._loadTestLevel.bind(this), this._clearGameStateObject.bind(this)],
    "paused": null,
  };

  this.startingState = "starting";

  // Create components.
  this.stateMachine = new StateMachine(this, allStates, this.startingState);
  this.physicsManager = new PhysicsManager(this.engine);

  // Setup callbacks.
  this.callbacks = {
    "startGame":  this.stateMachine.changeState.bind(this.stateMachine,"inLevel"),
    "openSettings": this.stateMachine.changeState.bind(this.stateMachine, "settingsMenu", true),
    "openCredits": this.stateMachine.changeState.bind(this.stateMachine, "credits", true),
    "applySettings": this._applySettings.bind(this),
    "goToPreviousState": this.stateMachine.goToPreviousState.bind(this.stateMachine)
  };

  this._addListeners();
};

Game.prototype.update = function(){
  this._updateFrameData();
  this._refreshEvents(); // Init / re-init the game events.
  let currentState = this.stateMachine.currentState;
  let events = this.gameStateObject["events"]; // Create an alias.
  let inputs = this.engine.getInputEvents();
  events.set("inputEvents", this.engine.getInputEvents());

  if(this.debugMenu != null){
    this.debugMenu.updateVariable("game fps", this.engine.frameData["fps"]);
  };

  switch(currentState){
    case "starting": // For loading stuff specific to the game.
      this.controller.createPatterns(data["timeStamp"]);
      this.stateMachine.changeState("mainMenu");
      break;
    case "mainMenu":
    case "settingsMenu":
    case "credits":
      this._updateMenu(this.gameStateObject["menu"], events);
      break;
    case "inLevel":
      this._updateLevel(this.gameStateObject["scene"], events);

      // Debug menu crap.
      let player = this.gameStateObject["scene"].getEntity("player")
      let scene = this.gameStateObject["scene"]
      this.debugMenu.updateVariable("singleTap-space state", this.controller.patterns.get("singleTap-space")["state"]);
      this.debugMenu.updateVariable("player state", player.attributes["state"]);
      this.debugMenu.updateVariable("player x", player.attributes["x"]);
      this.debugMenu.updateVariable("player y", player.attributes["y"]);
      this.debugMenu.updateVariable("canDodge", player.attributes["canDodge"]);
      this.debugMenu.updateVariable("animation frame", player.attributes["currentAnimation"].frameIndex);
      this.debugMenu.updateVariable("current animation", player.attributes["currentAnimation"].id);
      this.debugMenu.updateVariable("commands", this.controller.getCommands());
      this.debugMenu.updateVariable("camera topLeft", scene.camera.topleft);
      break;
  };
};

Game.prototype.draw = function(){
  let currentState = this.stateMachine.currentState;
  let renderer = this.renderer;
  switch(currentState){
    case "starting":
      break;
    case "mainMenu":
    case "settingsMenu":
    case "credits":
      renderer.drawMenu(this.gameStateObject["menu"]);
      break;
    case "inLevel":
      this._drawLevel(this.gameStateObject["scene"]);
  };

  if(this.debugModeOn === true && this.debugMenu != null){
    this.renderer.drawMenu(this.debugMenu)
  };
};

// ========================================
// gameStateObject specific update methods.
// ========================================

Game.prototype._updateFrameData = function(){
  this.gameStateObject["frameData"] = this.engine.data;
};

Game.prototype._refreshEvents = function(){
  this.gameStateObject["events"] = new Map();
};

Game.prototype._updateEvents = function(newEvents){
  this.gameStateObject["events"] = newEvents;
};

// =======================
// Gemeral update methods.
// =======================

Game.prototype._updateLevel = function(scene, events){
  this.controller.clearCommands(); // Clear any commands from last cycle.

  // Get input data and update command stack.
  let inputData = this.controller.getInputs(events, data);
  this.controller.addCommands(inputData); // Raw input data is added to command stack.
  this.controller.updatePatterns(inputData);

  for(let entity of scene.entities.values()){
    this._updateEntity(scene, entity);
  };
};

Game.prototype._updateEntity = function(scene, entity){
  switch(entity.attributes["type"]){
    case "player":
      this._handleHitboxCollision(entity, scene);
      this._updatePlayer(scene);
      this._updateCharacterAnimation(entity);
      this._updateEntityAnimations(entity);
      break;
    case "darius":
    case "anna":
    case "tower_watch1":
    case "tower_watch2":
    this._updateCharacterAnimation(entity);
     this._updateEntityAnimations(entity);
     break;
  };

  this._handleEntityMove(entity, scene);
  if(entity.attributes["type"] === "player"){scene.camera.centerOnEntity(entity)};
};

// Set entity.hitBoxes to the current Animation's hitboxes if applicable.
// Precondition: entity.attributes["currentAnimation"] exists.
Game.prototype._updateEntityHitboxes = function(entity){
  let currentAnimation = entity.attributes["currentAnimation"];
  if(currentAnimation.active === true && currentAnimation.hitBoxes !== null &&
    currentAnimation.hitBoxes[currentAnimation.frameIndex] !== undefined){
      entity.attributes["hitBoxes"] = currentAnimation.hitBoxes[currentAnimation.frameIndex];
  } else entity.attributes["hitBoxes"] = null;
};

// =====================
// Gemeral draw methods.
// =====================

Game.prototype._drawLevel = function(scene){
  this.renderer.drawTiles(scene);
  for(let entity of scene.entities.values()){
    this._drawEntity(scene, entity);
    // this._drawEntityColliders(scene, entity);
  };
};

Game.prototype._drawEntity = function(scene, entity){
  this.renderer.drawEntity(scene, entity);

  switch(entity.attributes["type"]){
    case "player":
      // Draw any effects.
      let currentAnimation = entity.attributes["currentAnimation"];
      if(currentAnimation.effects.length > 0 && currentAnimation.active === true){
        for(const effect of entity.attributes["currentAnimation"].effects){
          this.renderer.drawEffect(scene, entity, entity.attributes["animations"].get(effect));
        };
      };
      break;
  };
};

// Mostly for debugging purposes.
Game.prototype._drawEntityColliders = function(scene, entity){
  let renderer = this.renderer;
  let camera = scene.camera;
  let entityTopLeft = [entity.attributes["x"] - (entity.attributes["width"] / 2), entity.attributes["y"] - (entity.attributes["height"] / 2)];

  let colliders = [
    entity.attributes["wallCollider"]
  ];

  if(entity.attributes["hitBoxes"] !== null){
    for(let rectData of Object.values(entity.attributes["hitBoxes"])){
      colliders.push(new Rect(rectData.topLeft, rectData.width, rectData.height));
    };
  };

  if(entity.attributes["hurtBox"] !== null){colliders.push(entity.attributes["hurtBox"])}

  let x;
  let y;
  let scaledPos;
  for(const c of colliders){
    // TODO: Scaling only works for default resolution right now. Change that.
    switch(c.constructor){
      case Circle:
        x = entityTopLeft[0] + c.center[0];
        y = entityTopLeft[1] + c.center[1];
        scaledPos = this.engine.getSpriteScaledPosition(x, y);
        scaledPos = camera.getRelative(scaledPos[0], scaledPos[1]);
        renderer.drawCircle(0xff0000, scaledPos[0], scaledPos[1], c.radius * this.engine.spriteScale);
        break;
      case Rect:
        x = entityTopLeft[0] + c.topLeft[0];
        y = entityTopLeft[1] + c.topLeft[1];
        scaledPos = this.engine.getSpriteScaledPosition(x, y);
        scaledPos = camera.getRelative(scaledPos[0], scaledPos[1]);
        renderer.drawRect(0xff0000, scaledPos[0], scaledPos[1], c.width * this.engine.spriteScale, c.height * this.engine.spriteScale);
        break;
    };
  };

};

// ======================================
// Game callbacks + menu related methods.
// ======================================

Game.prototype._addListeners = function(){
  let element = this.engine.context;
  element.addEventListener("fullscreenchange", this._fullScreenHandler.bind(this));
};

Game.prototype._fullScreenHandler = function(){
  if(this.gameStateObject["menu"]){
    this.engine.guiManager.updateMenuGraphics(this.gameStateObject["menu"]);

    // In settingsMenu and we're exiting fullscreen mode.
    if(this.stateMachine.currentState === "settingsMenu" && this.renderer.isFullscreen === false){
      // let resolution = this.engine.guiManager.getWidgetbyId(menu, "gameResolution");
      console.log("test");
    };
  };
};

Game.prototype._applySettings = async function(){
  if(this.stateMachine.currentState != "settingsMenu"){
    console.error(`Invalid state to apply settings! Detected state: ${this.stateMachine.currentState}`)
  }
  else {
    let menu = this.gameStateObject["menu"];

    // Apply resolution.
    let resolution = this.engine.guiManager.getWidgetbyId(menu, "gameResolution");
    resolution = this.engine.guiManager.getCurrentSelection(resolution).text;
    if(resolution.toLowerCase() === "fullscreen"){
      this.renderer.requestFullscreen();
    }
    else {
      if(this.renderer.isFullscreen === true){
        await this.renderer.exitFullscreen()
      };

      // Assumes resolution text will be in the format "WidthxHeight"
      let oldScreenSize = this.renderer.getScreenSize();
      let newScreenSize = resolution.split('x').map(e => Number(e));
      if(oldScreenSize[0] != newScreenSize[0] || oldScreenSize[1] != newScreenSize[1]){
        this.renderer.resizeScreen(newScreenSize[0], newScreenSize[1]);
        this.engine.guiManager.updateMenuGraphics(menu);
      };
    };

    let bgmVolume = this.engine.guiManager.getWidgetbyId(menu, "bgmVolume");
    bgmVolume = this.engine.guiManager.getCurrentSelection(bgmVolume).text;
    this.audioManager.setVolume(Number(bgmVolume.replace("%", '')) / 100, "bgm")

    let sfxVolume = this.engine.guiManager.getWidgetbyId(menu, "sfxVolume");
    sfxVolume = this.engine.guiManager.getCurrentSelection(sfxVolume).text;
    this.audioManager.setVolume(Number(sfxVolume.replace("%", '')) / 100, "sfx")

  };
};

Game.prototype._updateMenu = function(menu, events){
  let currentState = this.stateMachine.currentState;
  let mouseEvents = events.get("inputEvents").get("mouse");
  let guiManager = this.engine.guiManager;

  this.engine.guiManager.checkHover(menu);
  if(mouseEvents != undefined && (mouseEvents.includes("keyDown-leftPress") || mouseEvents.includes("leftClick"))){
    this.engine.guiManager.checkPressesAndClicks(menu);
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
  this.engine.guiManager.updateMenuGraphics(gameStateObject["menu"]);
};

Game.prototype._loadGame = function(){
  this._loadMenu("mainMenu");

  // We only want this occurring when the game boots up.
  if(this.debugModeOn === true && this.debugMenu === null){
    this.debugMenu = new DebugMenu(this);
  };
};

// Set the gameStateObject's scene.
Game.prototype._loadLevel = function(levelName){
  let levelData = this.engine.getLoadedAsset(this.engine.levelKey).get(levelName);
  let levelSpriteSheet = this.engine.renderer.getSheetFromId(levelData.spriteSheet);
  let level = new Scene(this.engine, levelSpriteSheet, levelData);
  level.camera.setup(0, 0, this.engine.windowWidth, this.engine.windowHeight, this.engine.spriteScale);
  this.gameStateObject["scene"] = level;
  this.audioManager.playSong("dungeon1", true);
};

Game.prototype._loadTestLevel = function(){
  let spawnpoint = [16 + (32 * 10), 16 + (32 * 18)];
  this._loadLevel("startingArea");
  let scene = this.gameStateObject["scene"];
  let player = new PlayerEntity(this.engine);
  player.attributes["x"] = spawnpoint[0];
  player.attributes["y"] = spawnpoint[1];

  let dummy = new DummyManEntity(this.engine);
  dummy.attributes["x"] = spawnpoint[0] + 64;
  dummy.attributes["y"] = spawnpoint[1] + 64;

  scene.addEntity(player);
  scene.addEntity(dummy);
  let camera = scene.camera;
  camera.centerOnEntity(player);
};

// =======================
// Entity related methods.
// =======================

Game.prototype._applyEntityForce = function(entity, fx, fy){
  let vAdd = Vector2D.prototype.add
  let forceVector = new Vector2D([fx, fy]);
  if(entity.attributes["appliedForces"] === null){
    entity.attributes["appliedForces"] = forceVector;
  }
  else {
    entity.attributes["appliedForces"] = vAdd(entity.attributes["appliedForces"], forceVector);
  }
};

Game.prototype._resetEntityForce = function(entity){
  entity.attributes["appliedForces"] = null;
};

// Assumes wallCollider.constructor === Circle
Game.prototype._handleEntityWallCollision = function(entity, scene){
  let collider = entity.attributes["wallCollider"];
  let directionX = Math.sign(entity.attributes["dx"]);
  let directionY = Math.sign(entity.attributes["dy"]);

  // Player center relative to its top left.
  let entityCenter = [entity.attributes["width"] / 2, entity.attributes["height"] / 2];

  // Offset between the collider's center and the player's center.
  let offsetX = collider.center[0] - entityCenter[0];
  let offsetY = collider.center[1] - entityCenter[1];

  let circleDx = collider.radius * directionX;
  let circleDy = collider.radius * directionY;

  let entityTopLeft = scene.getEntityTopLeft(entity);
  // Calculate true world position of collider's center.
  let colliderTruePos = [entityTopLeft[0] + collider.center[0], entityTopLeft[1] + collider.center[1]];

  let dx = entity.attributes["dx"] + circleDx;
  let dy = entity.attributes["dy"] + circleDy;
  let x = colliderTruePos[0];
  let y = colliderTruePos[1];
  let newPos = this._handleCollision(x, y, dx, dy, scene, entity);
  newPos[0] -= offsetX + circleDx;
  newPos[1] -= offsetY + circleDy;
  return newPos;
};

Game.prototype._handleEntityMove = function(entity, scene){
  if(entity.attributes["appliedForces"] === null){return};

  entity.attributes["dx"] = entity.attributes["appliedForces"].dx();
  entity.attributes["dy"] = entity.attributes["appliedForces"].dy();
  let newPos = this._handleEntityWallCollision(entity, scene);
  scene.moveEntity(entity, newPos);
  this._resetEntityForce(entity);
};

// Checks for collision from point (x, y) to point (x + dx, y + dy)
// If there is a collision point, return that point. Otherwise return
// (x + dx, y + dy).
Game.prototype._handleCollision = function(x, y, dx, dy, scene){
  let newPos;
  let collision;
  let movVector = new Vector2D([x, y], [x + dx, y + dy]);

  collision = this.physicsManager.raycastCollision(movVector, scene);
  this.debugMenu.updateVariable("collision? ", collision !== null);
  if(collision !== null){
    if(collision === undefined){collision = this._handleBoundaryCollision(movVector, scene)};
    if(collision[1] === undefined){
      this._handleBoundaryCollision(movVector, scene);
    }

    // Initial collision.
    newPos = this.physicsManager.resolveCollision(movVector, collision[0]);

    // Post collision; slide if applicable, and then check slide for additional collision.
    if(dx != 0 && dy != 0){
      movVector.p1 = newPos;
      movVector = this.physicsManager.collisionSlide(movVector, collision[0], collision[1]);
      collision = this.physicsManager.raycastCollision(movVector, scene);
      if(collision !== null){
        if(collision === undefined){collision = this._handleBoundaryCollision(movVector, scene)};
        newPos = this.physicsManager.resolveCollision(movVector, collision[0]);
      } else newPos = [movVector.p2[0], movVector.p2[1]];
    };

  }
  else { // No collision so we just go the full distance.
    newPos = [movVector.p2[0], movVector.p2[1]];
  };
  return newPos;
};

// Precondition: movVector.p2 is out of bounds.
Game.prototype._handleBoundaryCollision = function(movVector, scene){
  let engine = this.engine;
  let tileMap = scene.tileMap;
  let sceneWidth = tileMap.width * tileMap.tileSize;
  let sceneHeight = tileMap.height * tileMap.tileSize;

  let collision = [];
  // Calculate the collision point with boundary.
  let x = engine.clamp(movVector.p2[0], 0, sceneWidth);
  let y = engine.clamp(movVector.p2[1], 0, sceneHeight);
  collision.push([x, y]);

  let boundaries = []

  // Figure out the collision boundary
  if(x === 0){
    boundaries.push(new Vector2D([0, 0], [0, sceneHeight])); // Left boundary.
  }
  else if(x === sceneWidth){
    boundaries.push(new Vector2D([sceneWidth, 0], [sceneWidth, sceneHeight])); // Right boundary.
  }

  if(y === 0){
    boundaries.push(new Vector2D([0, 0], [sceneWidth, 0])); // Top boundary.
  }
  else if(y === sceneHeight){
    boundaries.push(new Vector2D([0, sceneHeight], [sceneWidth, sceneHeight])); // Bottom boundary.
  }

  // Corner case doesn't appaear to happen ever soooooo guess I'm good with this.
  collision.push(boundaries[0]);

  return collision
};

Game.prototype._handleHitboxCollision = function(sourceEntity, scene){
  if(sourceEntity.attributes["hitBoxes"] == null){return};

  let attacked = new Set(); // Since entities can occupy more than one tile, we keep track.
  let attackForce;
  let knockBack;
  // Iterate through active hitboxes.
  for(let hitBox of sourceEntity.attributes["hitBoxes"]){
    knockBack = hitBox.knockBack;
    hitBox = this._getHitboxRect(sourceEntity, hitBox);
    // get all tiles hitbox intersects.
    for(let tileIndex of scene.getTilesRectIntersects(hitBox)){
      if(scene.entitiesInTile(tileIndex)){
        // Iterate through potential attacked enemies.
        let hurtBox;
        for(let otherEntity of scene.getTileEntities(tileIndex)){
          if(otherEntity === sourceEntity || attacked.has(otherEntity)){continue};
          hurtBox = this._getHitboxRect(otherEntity, otherEntity.attributes["hurtBox"]);
          if(Engine.prototype.rectIntersects(hitBox, hurtBox) === true){
            attackForce = this._calculateHitboxForce(sourceEntity, otherEntity, hitBox, hurtBox, knockBack);
            this._applyEntityForce(otherEntity, Math.round(attackForce.dx()), Math.round(attackForce.dy()));
            attacked.add(otherEntity);
          };
        };
      };
    };
  };
};

// Precondition: hitBox.knockBack != null and
// hitBox and hurtBox have already been converted via this._getHitboxRect()
Game.prototype._calculateHitboxForce = function(sourceEntity, otherEntity, hitBoxRect, hurtBoxRect, knockBack){
  let directionVector;

  if(sourceEntity.attributes["attackVector"] != null){
    directionVector = sourceEntity.attributes["attackVector"].copy();
  }
  else {
    let dx = Engine.prototype.clamp(hurtBoxRect.center[0] - hitBoxRect.center[0], -1, 1);
    let dy = Engine.prototype.clamp(hurtBoxRect.center[1] - hitBoxRect.center[1], -1, 1);
    directionVector = new Vector2D([dx, dy]);
  }
  return Vector2D.prototype.scalarMultiply(sourceEntity.attributes["attackVector"], knockBack);
}

// Calculates the true world position of a given hitbox relative to its
// sourceEntity and returns the information as a new Rect object.
// this also works for hurtboxes too.
Game.prototype._getHitboxRect = function(sourceEntity, hitBox){
  let x = sourceEntity.attributes["x"] + hitBox.topLeft[0];
  let y = sourceEntity.attributes["y"] + hitBox.topLeft[1];
  return new Rect([x, y], hitBox.width, hitBox.height);
};

Game.prototype._resetEntityDisplacement = function(entity){
  entity.attributes["dx"] = 0;
  entity.attributes["dy"] = 0;
};

Game.prototype._updateEntityAnimations = function(entity){
  entity.attributes["sprite"] = this.animationManager.getSprite(entity.attributes["currentAnimation"]);

  let currentAnimation = entity.attributes["currentAnimation"];
  this.animationManager.nextFrame(currentAnimation);
  if(currentAnimation.effects.length > 0){
    for(const effect of currentAnimation.effects){
      effectAnim = entity.attributes["animations"].get(effect);
      this.animationManager.setFrame(effectAnim, currentAnimation.frameIndex);
    };
  };

  this._updateEntityHitboxes(entity);
};

Game.prototype._changeEntityAnimation = function(entity, oldAnimation, newAnimation){
  this.animationManager.deactivateAnimation(oldAnimation);
  this.animationManager.activateAnimation(newAnimation);
  entity.attributes["currentAnimation"] = newAnimation;

  this._deactiveEntityEffects(entity, oldAnimation);
  this._activateEntityEffects(entity, newAnimation);
  this._updateEntityHitboxes(entity);
};

Game.prototype._activateEntityEffects = function(entity, animation){
  let effectAnim;
  for(const effect of animation.effects){
    effectAnim = entity.attributes["animations"].get(effect);
    this.animationManager.activateAnimation(effectAnim);
  };
};

Game.prototype._deactiveEntityEffects = function(entity, animation){
  let effectAnim;
  for(const effect of animation.effects){
    effectAnim = entity.attributes["animations"].get(effect);
    this.animationManager.deactivateAnimation(effectAnim);
  };
};

// =======================
// Player related methods.
// =======================

Game.prototype._updatePlayer = function(scene){
  let handleStates = this._handlePlayerStates.bind(this);

  this._handlePlayerControlAttributes(scene);
  handleStates(scene);
};

Game.prototype._handlePlayerControlAttributes = function(scene){
  let player = scene.getEntity("player");
  if(this.timerManager.isComplete("playerDodgeCooldown") === true){
    player.attributes["canDodge"] = true;
  };
};

Game.prototype._handlePlayerStates = function(scene){
  let player = scene.getEntity("player");
  let commands = this.controller.getCommands();

  // If I want to implement different controller modes, then I'd add a check here.
  let attackCommands = ["singleTap-leftPress", "singleTap-rightPress"];
  let playerState = player.attributes["state"];
  let oldPos = [player.attributes["x"], player.attributes["y"]];

  let test = attackCommands.some(c => commands.includes(c))

  if(playerState === "dodging"){
    this._handlePlayerDodge(player, commands);
  }
  // Check if we want to dodge
  else if(player.attributes["canDodge"] === true && commands.includes("singleTap-space") && ["walking", "sprinting"].includes(playerState)){
    player.attributes["canDodge"] = false;
    this._handlePlayerDodgeStart(player, commands);
  }
  else if(playerState === "attacking" || player.attributes["canAttack"] === true && attackCommands.some(c => commands.includes(c))
  && ["idle", "walking", "sprinting", "attacking"].includes(playerState)){
    this._handlePlayerAttack(scene, player, commands);
  }
  else {
    // This function also handles when the player is idling.
    this._walkPlayer(player, commands);
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
  player.attributes["dodgeVector"] = new Vector2D([dMap["dx"], dMap["dy"]]);
};

// Precondition: player.attributes["state"] === "dodging"
Game.prototype._handlePlayerDodge = function(player, commands){
  let dodgeAnimation = player.attributes["currentAnimation"];
  if(dodgeAnimation.active === false){ // Dodge ends.
    player.attributes["state"] = "idle";
    player.attributes["dodgeVector"] = null;
    this.timerManager.setTimer(player.attributes["dodgeCooldown"], 'playerDodgeCooldown');
    return false;
  }
  else {
    let dodgeSpeed = player.attributes["dodgeSpeed"];
    let dodgeVector = player.attributes["dodgeVector"];
    this._applyEntityForce(player, dodgeVector.dx() * dodgeSpeed, dodgeVector.dy() * dodgeSpeed);
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
        dMap[coordinate] += movMap[c][1];
        player.attributes["direction"] = movMap[c][3];
      };
    };

    this._applyEntityForce(player, dMap["dx"], dMap["dy"]);
  };
};

// Handles all of player attacking, including animations.
// Precondition: ["idle", "walking", "sprinting", "attacking"].includes(playerState)
Game.prototype._handlePlayerAttack = function(scene, player, commands){
  let basicAttackCommand = "singleTap-leftPress";
  let playerState = player.attributes["state"];
  let allAnims = player.attributes["animations"];
  let attackQueue = player.attributes["attackQueue"];
  let currentAnimation = player.attributes["currentAnimation"];

  // Check for basic attack command input.
  if(commands.includes(basicAttackCommand)){

    // Adding input to queue to continuing attack.
    if(playerState === "attacking" && currentAnimation.frameIndex >= currentAnimation.queueIndex
    && currentAnimation.active === true){ // We're trying to continue off a current attack.
      attackQueue.push(basicAttackCommand);
    }
    // Start basic attack.
    else if(playerState != "attacking"){
      let directionArray = this._calculatePlayerAttackDirection(scene, player);
      player.attributes["direction"] = directionArray[0];
      player.attributes["attackVector"] = directionArray[1];

      let direction = player.attributes["direction"];
      let animMap = {
        "up": allAnims.get("player_basic_attack1_back"),
        "down": allAnims.get("player_basic_attack1_front"),
        "left": allAnims.get("player_basic_attack1_left"),
        "right": allAnims.get("player_basic_attack1_right")
      };
      this._changeEntityAnimation(player, currentAnimation, animMap[direction]);
      currentAnimation = player.attributes["currentAnimation"];

      player.attributes["state"] = "attacking";
      playerState = player.attributes["state"];
    };
  }
  // If we're at the end of an attack with a followUp, and there is an input queued,
  // move on to the followUp animation.
  // If the attack has a specified cancelIndex then we check for followUp ONLY
  // at that point.
  else if(playerState === "attacking" && attackQueue[0] === basicAttackCommand
  && currentAnimation.followUp != undefined
  && (currentAnimation.frameIndex === currentAnimation.cancelIndex ||
    currentAnimation.cancelIndex === undefined && currentAnimation.active === false)){
    this._changeEntityAnimation(player, currentAnimation, allAnims.get(currentAnimation.followUp));
    currentAnimation = player.attributes["currentAnimation"];
    player.attributes["attackQueue"] = [];
  }

  // Reached end of attack animation. Reset to idle.
  else if(playerState === "attacking" && currentAnimation.active === false){
    // Go to return animation if there is one.
    if(currentAnimation.return != null){
      this._changeEntityAnimation(player, currentAnimation, allAnims.get(currentAnimation.return));
      currentAnimation = player.attributes["currentAnimation"];
    } else {
      player.attributes["state"] = "idle";
      playerState = player.attributes["state"];
      player.attributes["attackVector"] = null;
    };
    player.attributes["attackQueue"] = [];
  };

  if(playerState === "attacking" && player.attributes["attackVector"] != null && currentAnimation.velocity != undefined
    && currentAnimation.velocity[currentAnimation.frameIndex] != undefined){
      let magnitude = currentAnimation.velocity[currentAnimation.frameIndex];
      let movVector = Vector2D.prototype.scalarMultiply(player.attributes["attackVector"], magnitude);
      this._applyEntityForce(player, Math.round(movVector.dx()), Math.round(movVector.dy()));
  };
};


// Returns an array of 2 elements in the format ["direction", dirVector]
// where "direction" is the direction of the attack animation
// (can only be up, down, left, or right) and dirVector
// is a Vector2D object representing the unit vector formed between the player and the mouse.
Game.prototype._calculatePlayerAttackDirection = function(scene, player){
  if(this.controller.mode === "keyboard"){
    // Mouse coordinates are relative to game canvas.
    let mouseCoords = this.engine.inputManager.inputDevices.get("mouse").getCoords();

    // We want the center of where the player is being drawn on the screen.
    // So we calculate position the similar to how we calculate where to draw the player's sprite.
    let relPlayerCoords = scene.camera.getRelative(player.attributes["x"] * this.engine.spriteScale, player.attributes["y"] * this.engine.spriteScale);
    relPlayerCoords[0] *= this.renderer.horizontalRatio;
    relPlayerCoords[1] *= this.renderer.verticalRatio;

    let mouseVector = new Vector2D([mouseCoords[0] - relPlayerCoords[0], mouseCoords[1] - relPlayerCoords[1]]);
    let mouseAngle = Math.round(Vector2D.prototype.calculateAngle(mouseVector, true));
    if(mouseAngle < 0){mouseAngle = 360 + mouseAngle};

    // Map of directions and their corresponding angles.
    // Format: {direction: [array(s) of angles]}
    let angleMap = {
      "right": [[315, 360], [0, 45]],
      "down": [[46, 135]],
      "left": [[136, 225]],
      "up": [[226, 314]]
    };

    for(const [direction, angleArray] of Object.entries(angleMap)){
      for(const anglePair of angleArray){
        if(Engine.prototype.inBetween(mouseAngle, anglePair[0], anglePair[1], true) === true){
          return [direction, Vector2D.prototype.normalize(mouseVector)];
        };
      };
    };

  };
};

Game.prototype._updateCharacterAnimation = function(entity){
  let type = entity.attributes["type"];
  let direction = entity.attributes["direction"];
  let allAnims = entity.attributes["animations"];
  let state = entity.attributes["state"];

  switch (state){
    case "walking":
    case "sprinting":
      animMap = {
        "up": allAnims.get(type + "_walk_back"),
        "down": allAnims.get(type + "_walk_front"),
        "left": allAnims.get(type + "_walk_left"),
        "right": allAnims.get(type + "_walk_right")
      };
      break;
    case "dodging":
      animMap = {
        "up": allAnims.get(type + "_dodge_back"),
        "down": allAnims.get(type + "_dodge_front"),
        "left": allAnims.get(type + "_dodge_left"),
        "right": allAnims.get(type + "_dodge_right")
      };
      break;
    case "attacking":
      return; // Exit if we're in attacking state because that's handled elsewhere.
    default: // Let's treat idle as default.
      animMap = {
        "up": allAnims.get(type + "_idle_back"),
        "down": allAnims.get(type + "_idle_front"),
        "left": allAnims.get(type + "_idle_left"),
        "right": allAnims.get(type + "_idle_right")
      };
  };

  let oldAnimation = entity.attributes["currentAnimation"];
  let newAnimation = animMap[direction];

  // If there's a change in animation...
  if(oldAnimation !== newAnimation){
    // Switch to new animation.
    this._changeEntityAnimation(entity, oldAnimation, newAnimation);
  };
};
