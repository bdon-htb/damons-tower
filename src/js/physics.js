/*
 * physics.js is where all the game physics and some other math related calculations go.
 * all game physics should account for the framerate.
*/

function PhysicsManager(engine){
  this.engine = engine; // Keep a persistant reference to the engine.
  this.FPS = engine.FPS;
};

/*
PhysicsManager.prototype.calculateVelocity = function(velocity){
  return velocity;
  if(this.engine.frameData["fps"] === 0){
    console.warn("fps detected as 0.")
    return velocity;
  } return Math.round(velocity * (1/this.engine.frameData["fps"]) * this.FPS);
};
*/

// Returns the point where a vector intersects a rect.
// Returns null if hits nothing.
PhysicsManager.prototype.rectPointofCollision = function(vector, rect){
  let vectorsIntersectFunc = Vector2D.prototype.vectorsIntersect;
  let rectVertical;
  let rectHorizontal;
  let lineSegments = [
    new Vector2D(rect.topLeft, rect.bottomLeft),
    new Vector2D(rect.topRight, rect.bottomRight),
    new Vector2D(rect.topLeft, rect.topRight),
    new Vector2D(rect.bottomLeft, rect.bottomRight)
  ]

  for(const line of lineSegments){
    let collisionPoint = vectorsIntersectFunc(vector, line);
    if(collisionPoint !== null){return collisionPoint};
  };
  return null;
};

// Carried by this helpful answer here:
// Kinda bummed I couldn't figure it out using the article alone, but whatever I guess.
// https://gamedev.stackexchange.com/questions/194356/need-help-with-fixing-optimized-raycasting-line-of-sight-algorithm

// This function is a general rayMarch implementation. It takes in the
// the rayVector being checked, the scene the ray is being casted in, and
// an evaluator method as arguments.
PhysicsManager.prototype.rayMarch = function(rayVector, scene, evaluator){
    let CELLSIZE = scene.tileMap.tileSize;
    let tileMap = scene.tileMap;
    let cellVector = {
      p1: [rayVector.p1[0] / CELLSIZE, rayVector.p1[1] / CELLSIZE],
      p2: [rayVector.p2[0] / CELLSIZE, rayVector.p2[1] / CELLSIZE]
    };

    // Decompose vector coordinates.
    let x0 = cellVector.p1[0];
    let y0 = cellVector.p1[1];
    let x1 = cellVector.p2[0];
    let y1 = cellVector.p2[1];

    let dx = x1 - x0;
    let dy = y1 - y0;
    dx = Math.abs(dx);
    dy = Math.abs(dy);
    //adjust dx / dy to avoid div-by-zero
    let dtDx = 1.0 / dx;
    let dtDy = 1.0 / dy;

    let xInc = 0//dx / steps;
    let yInc = 0//dy / steps;
    let txNext = 0;
    let tyNext = 0;

    let x = Math.floor(x0);
    let y = Math.floor(y0);

    let n = 1;

    if(dx === 0){
      xInc = 0;
      txNext = dtDx; // infinity
    }
    else if(x1 > x0){
      xInc = 1;
      n += Math.floor(x1) - x;
      txNext = (Math.floor(x0) + 1 - x0) * dtDx;
    }
    else {
      xInc = -1;
      n += x - Math.floor(x1);
      txNext = (x0 - Math.floor(x0)) * dtDx;
    }

    if(dy === 0){
      yInc = 0;
      tyNext = dtDy; // infinity
    }
    else if(y1 > y0){
      yInc = 1;
      n += Math.floor(y1) - y;
      tyNext = (Math.floor(y0) + 1 - y0) * dtDy;
    }
    else {
      yInc = -1;
      n += y - Math.floor(y1);
      tyNext = (y0 - Math.floor(y0)) * dtDy;
    }

    let t = 0;
    for(; n > 0; --n){
      tileIndex = tileMap.getNearestTileIndex([x * CELLSIZE, y * CELLSIZE]);
      result = evaluator(rayVector, scene, tileIndex);
      if(result != null){return result};

      // Determine which intersection is closer and add to appropriate component.
      if(tyNext < txNext){
        y += yInc;
        t = tyNext
        tyNext += dtDy;
      }
      else {
        x += xInc;
        t = txNext;
        txNext += dtDx;
      }
    }
  return null;
};

PhysicsManager.prototype.stupidAlgorithm = function(rayVector, scene){
  for(let i = 0; i < scene.tileMap.tiles.length; i++){
    collision = this._checkForCollision(rayVector, scene, i);
    if(collision != null){
      return collision
    };
  };
  return null;
};

// Return the coordinates of the point where rayVector hits something in the scene.
// Return null if the rayVector does not hit anything.
// Based on the simplified algorithm here https://playtechs.blogspot.com/2007/03/raytracing-on-grid.html
PhysicsManager.prototype.raycastCollision = function(rayVector, scene){
  let evaluator = this._checkForCollision.bind(this);
  result = this.rayMarch(rayVector, scene, evaluator);
  // result = this.stupidAlgorithm(rayVector, scene);
  return result;
};

PhysicsManager.prototype._checkForCollision = function(rayVector, scene, tileIndex){
  let tileMap = scene.tileMap;
  if(tileMap.tileIsCollidable(tileIndex) === true){
    let tilePos = tileMap.convertIndexToCoords(tileIndex, true);
    let tileRect = new Rect(tilePos, tileMap.tileSize);
    return this.rectPointofCollision(rayVector, tileRect);
  };
  return null;
};

/**
 * Custom rect class. Useful for getting information for rectangle calculations.
 * Note: use only for calculations. Use PIXI.Rectangle for drawing,
*/
function Rect(topLeft, width, height=undefined){
  this.width = width;
  if(height === undefined){
    this.height = width
  } else this.height = height;
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

Vector2D.prototype.copy = function(vector){
  let p1 = [vector.p1[0], vector.p1[1]];
  let p2 = [vector.p2[0], vector.p2[1]];
  return new Vector2D(p1, p2);
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
  let p1 = [vector.p1[0], vector.p1[1]]; // Returning a new object, so I should copy p1.
  let p2 = [vector.p2[0] * s, vector.p2[1] * s];
  return new Vector2D(p1, p2);
};

Vector2D.prototype.scalarDivide = function(vector, s){
  if(s != 0){
    let x = (vector.p2[0] - vector.p1[0]) / s;
    let y = (vector.p2[1] - vector.p1[0]) / s;

    let p1 = [vector.p1[0], vector.p1[1]]; // Returning a new object, so I should copy p1.
    let p2 = [vector.p1[0] + x, vector.p1[1] + y];
    return new Vector2D(p1, p2);
  };
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

// Returns the coordinate where two vectors intersect. Return null if they don't
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
    intersectionPoint = intersectionPoint.p2
  } else intersectionPoint = null;
  return intersectionPoint;
};

// Calculates the angle of the vector between its second point and the x axis.
// can optionally have the output be in degrees by setting inDegrees = true
// Precondition: vector.p1 = [0, 0]
Vector2D.prototype.calculateAngle = function(vector, inDegrees=false){
  let x = vector.p2[0];
  let y = vector.p2[1];
  let angle = Math.atan2(y, x);

  if(inDegrees === true){
    angle = Engine.prototype.convertRadiansToDegrees(angle);
  };
  return angle;
};

Vector2D.prototype.length = function(vector){
  let a = Math.abs(vector.p2[0] - vector.p1[0]);
  let b = Math.abs(vector.p2[1] - vector.p1[1]);
  return Math.sqrt(Math.pow(a, 2) + Math.pow(b, 2));
};

Vector2D.prototype.normalize = function(vector){
  let length = Vector2D.prototype.length(vector);
  if(length > 0){
    return Vector2D.prototype.scalarDivide(vector, length);
  };
};
