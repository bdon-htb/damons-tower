/*
 * physics.js is where all the game physics calculations go.
 * all game physics should account for the framerate.
*/

function PhysicsManager(engine){
  this.FPS = engine.FPS;
};

PhysicsManager.prototype.calculateVelocity = function(velocity, timeDelta){
  return velocity * (1/this.FPS) * timeDelta;
};
