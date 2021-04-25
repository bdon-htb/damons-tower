/*
 * physics.js is where all the game physics and some other math related calculations go.
 * all game physics should account for the framerate.
*/

function PhysicsManager(engine){
  this.engine = engine; // Keep a persistant reference to the engine.
  this.FPS = engine.FPS;
};

PhysicsManager.prototype.calculateVelocity = function(velocity){
  return velocity * (1/this.engine.frameData["fps"]) * this.FPS;
};

// Returns the point where a vector intersects a rect.
// Returns null if hits nothing.
// We check only TWO of the rectangle's line segments.
// because a straight line can't hit opposite sides (unless it goes through).
// This function assumes the vector doesn't orignate inside the rect.
PhysicsManager.prototype.rectPointofCollision = function(vector, rect){
  let vectorsIntersectFunc = Vector2D.prototype.vectorsIntersect;
  let rectVeritcal;
  let rectHorizontal;

  // Check if vector originates to the left of rect topleft.
  if(vector.p1[0] <= rect.topLeft[0]){
    rectVeritcal = Vector2D(rect.topLeft, rect.bottomLeft);
  } else rectVeritcal = Vector2D(rect.topRight, rect.bottomRight);

  // Check if vector originates from above the rect topleft.
  if(vector.p1[1] <= rect.topLeft[1]){
    rectHorizontal = Vector2D(rect.topLeft, rect.topRight);
  } else rectHorizontal = Vector2D(rect.bottomLeft, rect.bottomRight);

  for(lineSegment of [rectVeritcal, rectHorizontal]){
    let collisionPoint = vectorsIntersectFunc(vector, lineSegment);
    if(collisionPoint !== null){return collisionPoint};
  };
  return null;
};

PhysicsManager.prototype._checkForCollision = function(scene, rayVector, tileIndex){
  let tileMap = scene.tileMap;
  if(tileMap.tileIsCollidable(tileIndex) === true){
    let tilePos = tileMap.convertIndexToCoords(tileIndex, true);
    let tileRect = new Rect(tilePos, tileMap.tileSize);
    return this.rectPointofCollision(rayVector, tileRect);
  };
};

// Return the coordinates of the point where rayVector hits something in the scene.
// Return null if the rayVector does not hit anything.
PhysicsManager.prototype.raycastCollision = function(rayVector, scene){
  let tileMap = scene.tileMap;

  let positiveDirections = Vector2D.prototype.isPositive(rayVector);
  let directionX = positiveDirections[0] === true ? 1 : -1;
  let directionY = positiveDirections[1] === true ? 1 : -1;

  let initialTilePos = tileMap.convertIndexToCoords(tileMap.getNearestTileIndex(rayVector.p1));
  let finalTilePos = tileMap.convertIndexToCoords(tileMap.getNearestTileIndex(rayVector.p2));
  let tileRangeX = (finalPos[0] - initialPos[0]) / tileMap.tileSize;
  let tileRangeY = (finalPos[1] - initialPos[1]) / tileMap.tileSize;
  let tilePos;
  let tileIndex;
  let collision;

  // tile at each relevant x coordinate.
  let rise = rayVector.p2[1] - rayVector.p1[1];
  let run = rayVector.p2[0] - rayVector.p1[0];

  if(rise === 0){ // Line is horizontal.
    for(let i = 0; i < tileRangeX; i++){
      tilePos = [initialTIlePos[0] + (directionX * i), initialPos[1]];
      tileIndex = tileMap.convertCoordsToIndex(tilePos);
      collision = this._checkForCollision(scene, rayVector, tileIndex);
      if(collision !== null){return collision};
    };
    return null;
  }
  else if(run === 0){ // Line is vertical.
    for(let i = 0; i < tileRangeY; i++){
      tilePos = [initialTIlePos[0], initialPos[1] + (directionY * i)];
      tileIndex = tileMap.convertCoordsToIndex(tilePos);
      collision = this._checkForCollision(scene, rayVector, tileIndex);
      if(collision !== null){return collision};
    };
    return null;
  }
  else {
    // Line is some sort of diagonal.
    // For diagonals, we utilize the equation of a line and calculate the nearest.
    let m = (rise / run)
    let b = rayVector.p1[1] - ((rise / run) * rayVector.p1[0]) // b = y - mx
    let rayX;
    let rayY;
    for(let i = 0; i < tileRangeX; i++){
      rayX = rayVector.p1[0] + (directionY * (i * tileMap.tileSize));
      rayY = (rayX * m) + b; // y = mx + b
      tileIndex = tileMap.convertCoordsToIndex([rayX, rayY]);
      collision = this._checkForCollision(scene, rayVector, tileIndex);
      if(collision !== null){return collision};
    };
    return null;
  };
};

/**
 * Custom rect class. Useful for getting information for rectangle calculations.
 * Note: use only for calculations. Use PIXI.Rectangle for drawing,
*/
function Rect(topLeft, width, height=undefined){
  if(height === undefined){height = width};
  this.width = width;
  this.height = height;
  this.topLeft = topLeft;

  this.topRight = [this.topLeft[0] + this.width, this.topLeft[1]];
  this.bottomLeft = [this.topLeft[0], this.topLeft[1] + this.height];
  this.bottomRight = [this.topLeft[0] + this.width, this.topLeft[1] + this.height];
};

/**
 * Custom vector class that doubles as an interface for basic vector calculations.
 * point1 and point2 are its coordinates (lists in the form of [1, 2]).
 * If point2 is not provided, then it'll be assumed that the vector originates
 * from the origin (0, 0).
*/
function Vector2D(point1, point2){
  if(point2 != undefined){
    this.p1 = point1;
    this.p2 = point2;
  }
  else {
    this.p1 = [0, 0];
    this.p2 = point1;
  };
};

// Return an array in the form [boolX, boolY] where each index
// corresponds to whether the vector is positive or negative in that direction.
Vector2D.prototype.isPositive = function(vector){
  return [vector.p1[0] < vector.p2[0], vector.p1[1] < vector.p2[1]]
};

Vector2D.prototype.add = function(vector1, vector2){
  let p1 = [vector1.p1[0] + vector2.p1[0], vector1.p1[1] + vector2.p1[1]];
  let p2 = [vector1.p2[0] + vector2.p2[0], vector1.p2[1] + vector2.p2[1]];
  return new Vector2D(p1, p2);
};

Vector2D.prototype.subtract = function(vector1, vector2){
  let p1 = [vector1.p1[0] - vector2.p1[0], vector1.p1[1] - vector2.p1[1]];
  let p2 = [vector1.p2[0] - vector2.p2[0], vector1.p2[1] - vector2.p2[1]];
  return new Vector2D(p1, p2);
};

Vector2D.prototype.scalarMultiply = function(vector, s){
  let p2 = [vector.p2[0] * s, vector.p2[1] * s];
  return new Vector2D(vector.p1, p2);
};

// Function assumes that both vectors originate from the same point.
Vector2D.prototype.dotProduct = function(vector1, vector2){
  return (vector1.p2[0] * vector2.p2[0]) + (vector1.p2[1] * vector2.p2[1]);
};

// This function assumes that both vectors originate from the same point i.e. the origin..
// Note that taking the cross product of 2d vectors will return a 3d vector in the
// form (0, 0, z). This function returns the z value and not the full vector.
Vector2D.prototype.crossProduct = function(vector1, vector2){
  return (vector1.p2[0] * vector2.p2[1]) - (vector1.p2[1] * vector2.p2[0])
};

//Returns the coordinate where two vectors intersect. Return null if they don't
// intersect at all.
// This function assumes that vector1 and vector2 will be free vectors.
Vector2D.prototype.vectorsIntersect = function(vector1, vector2){
  let intersectionPoint;
  let vAdd = Vector2D.prototype.add;
  let vScalarMultiply = Vector2D.prototype.scalarMultiply;
  let vSubtract = Vector2D.prototype.subtract;
  let vDotProduct = Vector2D.prototype.dotProduct;
  let vCrossProduct = Vector2D.prototype.crossProduct;

  let a = new Vector2D(vector1.p1);
  let b = new Vector2D(vector1.p2);
  let c = new Vector2D(vector2.p1);
  let d = new Vector2D(vector2.p2);

  let r = vSubtract(b, a);
  let s = vSubtract(d, c);

  let t = vCrossProduct(vSubtract(c, a), s) / vCrossProduct(r, s);
  let u = vCrossProduct(vSubtract(a, c), r) / vCrossProduct(s, r);

  if(t >= 0 && t <= 1 && u >= 0 && u <= 1){
    intersectionPoint = vAdd(a, vScalarMultiply(r, t));
  } else intersectionPoint = null;
  return intersectionPoint;
};
