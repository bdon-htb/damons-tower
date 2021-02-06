/*
 * physics.js is where all the game physics calculations go.
 * all game physics should account for the framerate.
*/

function PhysicsManager(engine){
  this.engine = engine; // Keep a persistant reference to the engine.
  this.FPS = engine.FPS;
};

PhysicsManager.prototype.calculateVelocity = function(velocity){
  return velocity * (1/this.engine.frameData["fps"]) * this.FPS;
};
