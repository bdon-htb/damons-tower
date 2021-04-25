/**
 * entity.js contains all of the entities in the game.
*/

/**
 * Simple entity object. The base of all other entities.
 * For player, enemy, items, doors, switches, etc.
*/
function Entity(id, sprite, type, state, x, y){
  this.id = id;
  // Default attributes.
  this.attributes = {
    "sprite": sprite,
    "type": type,
    "state": state,
    "x": x,
    "y": y,
    "dx": 0,
    "dy": 0
  };
};

/**
 * Player entity object.
 * gameObject is NOT the gameStateObject. it is an instance of the Game class.
*/
function PlayerEntity(engine, gameObject){
  Entity.call(this, "player", null, "player", "idle", 0, 0);
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
  this.attributes["animations"] = new Map(); // Animations is a map of all the available animations.
  this.attributes["speed"] = 6; // Set the default player movement speed.
  this.attributes["sprintSpeed"] = this.attributes["speed"] * 2;
  this.attributes["direction"] = "down";

  let idleAnimations = {
    "idle_front": engine.getLoadedAsset(engine.animKey).get("player_idle_front"),
    "idle_back": engine.getLoadedAsset(engine.animKey).get("player_idle_back"),
    "idle_left": engine.getLoadedAsset(engine.animKey).get("player_idle_left"),
    "idle_right": engine.getLoadedAsset(engine.animKey).get("player_idle_right")
  };

  let walkAnimations = {
    "walk_front": engine.getLoadedAsset(engine.animKey).get("player_walk_front"),
    "walk_back": engine.getLoadedAsset(engine.animKey).get("player_walk_back"),
    "walk_left": engine.getLoadedAsset(engine.animKey).get("player_walk_left"),
    "walk_right": engine.getLoadedAsset(engine.animKey).get("player_walk_right")
  };

  let allAnimations = [idleAnimations, walkAnimations];

  // Add all of the animations in allAnimations to the player's attribute "animations".
  allAnimations.forEach(object => {
    let spriteSheet;
    let animation;
    for(let [key, value] of Object.entries(object)){
      spriteSheet = engine.renderer.getSheetFromId(value["spriteSheet"]);
      animation = new Animation(key, spriteSheet, value);
      this.attributes["animations"].set(key, animation)}
  });

  // Set the default sprite.
  let defaultAnimation = this.attributes["animations"].get("idle_front");
  gameObject.animationManager.activateAnimation(defaultAnimation);
  this.attributes["currentAnimation"] = defaultAnimation;
  this.attributes["sprite"] = gameObject.animationManager.getSprite(defaultAnimation);
};
