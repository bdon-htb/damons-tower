/**
 * entity.js contains all of the entities in the game.
*/

/**
 * Simple entity object. The base of all other entities.
 * For player, enemy, items, doors, switches, etc.
 * note that position (x, y) represent the position of the CENTER of the Entity.
 * wallCollider is a rect used for wall collision detection. the topLeft of the Rect
 * is relative to the entity's CENTER position.
*/
function Entity(id, sprite, type, state, x, y, width, height){
  this.id = id;
  // Default attributes.
  this.attributes = {
    "sprite": sprite,
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
 * Player entity object.
 * gameObject is NOT the gameStateObject. it is an instance of the Game class.
*/
function PlayerEntity(engine, gameObject){
  Entity.call(this, "player", null, "player", "idle", 0, 0, 32, 32);
  this._allStates = [
    "idle",
    "walking",
    "sprinting"
  ];
  this._allDirections = [
    "up",
    "down",
    "left",
    "right"
  ];
  // this.attributes["wallCollider"] = new Rect([-7, 9], 14, 7); // position relative to topLeft: [9, 25]
  this.attributes["animations"] = new Map(); // Animations is a map of all the available animations.
  this.attributes["speed"] = 3; // Set the default player movement speed.
  this.attributes["sprintSpeed"] = this.attributes["speed"] * 2;
  this.attributes["dodgeSpeed"] = 4;
  this.attributes["direction"] = "down";
  this.attributes["dodgeCooldown"] = 400 // In miliseconds.

  // Set relevant flags for player controls.
  this.attributes["canDodge"] = true;

  let spriteSheet;
  let animation;
  // Create all player animations from data in animation.json
  for(const [animationName, animationData] of engine.assets.get(engine.animKey).entries()){
    if(animationName.startsWith('player_')){
      spriteSheet = engine.renderer.getSheetFromId(animationData["spriteSheet"]);
      animation = new Animation(animationName, spriteSheet, animationData);
      this.attributes["animations"].set(animationName, animation);
    };
  };

  // Set the default sprite.
  let defaultAnimation = this.attributes["animations"].get("player_idle_front");
  gameObject.animationManager.activateAnimation(defaultAnimation);
  this.attributes["currentAnimation"] = defaultAnimation;
  this.attributes["sprite"] = gameObject.animationManager.getSprite(defaultAnimation);
};
