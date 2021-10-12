/**
 * entity.js contains all of the entities in the game.
*/

/**
 * Simple entity object. The base of all other entities.
 * For player, enemy, items, doors, switches, etc.
 * note that position (x, y) represent the position of the CENTER of the Entity.
*/
function Entity(type, state, width, height){
  this.id = null; // This will be set by the scene on entity creation.
  // Default attributes.
  this.attributes = {
    "sprite": null,
    "type": type,
    "state": state,
    "x": 0,
    "y": 0,
    "dx": 0,
    "dy": 0,
    "width": width,
    "height": height,
  };
};

/**
 * Character entity object. The base of entities like player and enemies.
*/
function Character(type, state, width, height){
  Entity.call(this, type, state, width, height);

  this._allStates = [
    "idle",
    "walking",
    "sprinting",
    "attacking",
    "dodging"
  ];

  this._allDirections = [
    "up",
    "down",
    "left",
    "right"
  ];

  this.attributes["animations"] = new Map(); // A map of all entity animations.
  this.attributes["direction"] = "down"; // Default direction is down.
  this.attributes["hitBoxes"] = null; // Contains a reference to any active hitboxes.
  this.attributes["hurtBox"] = null; // Character hurtbox.
  this.attributes["appliedForces"] = null;
  this.attributes["lastHit"] = null; // Stores previous hit.
  this.attributes["isNpc"] = false; // NPCs cannot be hit by the player.
  this.attributes["isMob"] = false;
};

/**
 * Player entity object.
*/
function PlayerEntity(engine){
  Character.call(this, "player", "idle", 32, 32);
  this.attributes["speed"] = 3; // Set the default player movement speed.
  this.attributes["sprintSpeed"] = this.attributes["speed"] * 2;
  this.attributes["dodgeSpeed"] = 4;
  this.attributes["dodgeCooldown"] = 400 // In miliseconds.
  this.attributes["dodgeVector"] = null; // A unit vector representing the direction of a player dodge.

  // Set relevant variables for player controls.
  this.attributes["canDodge"] = true;
  this.attributes["canAttack"] = true;
  this.attributes["attackVector"] = null; // A unit vector representing the direction of a precise attack.
  this.attributes["attackQueue"] = []; // For input buffering.
  this.attributes["wallCollider"] = new Circle([16, 25], 7); // For wall collision detection.
  this.attributes["hurtBox"] = new Rect([12, 9], 8, 15);

  let allAnimations = engine.getLoadedAsset(engine.animKey);
  let animation;
  // Create all animations from data in animation.json
  for(const animationName of allAnimations.keys()){
    if(animationName.startsWith('player_') || animationName.startsWith('iron_')){
      animation = engine.renderer.animationManager.createAnimation(animationName)
      this.attributes["animations"].set(animationName, animation);
    };
  };

  // Set the default sprite.
  let defaultAnimation = this.attributes["animations"].get("player_idle_front");
  engine.app.animationManager.activateAnimation(defaultAnimation);
  this.attributes["currentAnimation"] = defaultAnimation;
  this.attributes["sprite"] = engine.app.animationManager.getSprite(defaultAnimation);
};

function AnnaEntity(engine){
  Character.call(this, "anna", "idle", 32, 32);
  this.attributes["isNpc"] = true;

  let allAnimations = engine.getLoadedAsset(engine.animKey);
  let animation;
  // Create all animations from data in animation.json
  for(const animationName of allAnimations.keys()){
    if(animationName.startsWith('anna_')){
      animation = engine.renderer.animationManager.createAnimation(animationName)
      this.attributes["animations"].set(animationName, animation);
    };
  };

  // Set the default sprite.
  let defaultAnimation = this.attributes["animations"].get("anna_idle_front");
  engine.app.animationManager.activateAnimation(defaultAnimation);
  this.attributes["currentAnimation"] = defaultAnimation;
  this.attributes["sprite"] = engine.app.animationManager.getSprite(defaultAnimation);

  this.attributes["wallCollider"] = new Circle([16, 25], 7);
  this.attributes["hurtBox"] = new Rect([12, 9], 8, 15);
};

function DariusEntity(engine){
  Character.call(this, "darius", "idle", 32, 32);
  this.attributes["isNpc"] = true;

  let allAnimations = engine.getLoadedAsset(engine.animKey);
  let animation;
  // Create all animations from data in animation.json
  for(const animationName of allAnimations.keys()){
    if(animationName.startsWith('darius_')){
      animation = engine.renderer.animationManager.createAnimation(animationName)
      this.attributes["animations"].set(animationName, animation);
    };
  };

  // Set the default sprite.
  let defaultAnimation = this.attributes["animations"].get("darius_idle_front");
  engine.app.animationManager.activateAnimation(defaultAnimation);
  this.attributes["currentAnimation"] = defaultAnimation;
  this.attributes["sprite"] = engine.app.animationManager.getSprite(defaultAnimation);

  this.attributes["wallCollider"] = new Circle([16, 25], 7);
  this.attributes["hurtBox"] = new Rect([12, 9], 8, 15);
};

function TowerWatchEntity(engine, variant){
  Character.call(this, "tower_watch" + variant, "idle", 32, 32);
  this.attributes["isNpc"] = true;

  let allAnimations = engine.getLoadedAsset(engine.animKey);
  let animation;
  // Create all animations from data in animation.json
  for(const animationName of allAnimations.keys()){
    if(animationName.startsWith('tower_watch' + variant + "_")){
      animation = engine.renderer.animationManager.createAnimation(animationName)
      this.attributes["animations"].set(animationName, animation);
    };
  };

  // Set the default sprite.
  let defaultAnimation = this.attributes["animations"].get("tower_watch" + variant + "_idle_front");
  engine.app.animationManager.activateAnimation(defaultAnimation);
  this.attributes["currentAnimation"] = defaultAnimation;
  this.attributes["sprite"] = engine.app.animationManager.getSprite(defaultAnimation);

  this.attributes["wallCollider"] = new Circle([16, 25], 7);
  this.attributes["hurtBox"] = new Rect([12, 9], 8, 15);
};

/**
 * "Dummy man" entity object.
 * Serves as an entity for the player to practice attacks  on.
*/
function DummyManEntity(engine){
  Character.call(this, "dummyMan", "idle", 32, 32);
  this.attributes["isMob"] = true;

  let spriteSheet = engine.renderer.textureManager.getSheetFromId("dummy_man");
  this.attributes["spriteSheet"] = spriteSheet;
  // Indexes of all its sprites.
  this.attributes["allSprites"] = {
    "normal": [0, 0],
    "damaged1": [1, 0],
    "damaged2": [2, 0],
    "damaged3": [3, 0]
  };
  // Set default sprite to normal.
  this.attributes["sprite"] = engine.renderer.textureManager.getSpriteFromSheet(spriteSheet, 0, 0);

  this.attributes["wallCollider"] = new Circle([16, 25], 7);
  this.attributes["hurtBox"] = new Rect([12, 9], 8, 15);
};
