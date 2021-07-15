/**
 * entity.js contains all of the entities in the game.
*/

/**
 * Simple entity object. The base of all other entities.
 * For player, enemy, items, doors, switches, etc.
 * note that position (x, y) represent the position of the CENTER of the Entity.
*/
function Entity(id, type, state, x, y, width, height){
  this.id = id;
  // Default attributes.
  this.attributes = {
    "sprite": null,
    "type": type,
    "state": state,
    "x": x,
    "y": y,
    "dx": 0,
    "dy": 0,
    "width": width,
    "height": height,
  };
};

/**
 * Character entity object. The base of entities like player and enemies.
*/
function Character(id, type, state, x, y, width, height){
  Entity.call(this, id, type, state, x, y, width, height);

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
};

/**
 * Player entity object.
*/
function PlayerEntity(engine){
  Character.call(this, "player", "player", "idle", 0, 0, 32, 32);
  this.attributes["speed"] = 3; // Set the default player movement speed.
  this.attributes["sprintSpeed"] = this.attributes["speed"] * 2;
  this.attributes["dodgeSpeed"] = 4;
  this.attributes["dodgeCooldown"] = 400 // In miliseconds.

  // Set relevant variables for player controls.
  this.attributes["canDodge"] = true;
  this.attributes["canAttack"] = true;
  this.attributes["attackVector"] = null; // A unit vector representing the direction of a precise attack.
  this.attributes["attackQueue"] = []; // For input buffering.
  this.attributes["wallCollider"] = new Circle([16, 25], 7); // For wall collision detection.
  this.attributes["hurtBox"] = new Rect([12, 9], 8, 15);

  let allAnimations = engine.getLoadedAsset(engine.animKey);
  let spriteSheet;
  let animation;
  // Create all player animations from data in animation.json
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

/**
 * "Dummy man" entity object.
 * Serves as an entity for the player to practice attacks  on.
*/
function DummyManEntity(engine){
  Character.call(this, "dummyMan", "dummyMan", "idle", 0, 0, 32, 32);

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
