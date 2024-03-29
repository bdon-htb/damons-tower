/*
 * physics.js is where all the game physics and some other math related calculations go.
*/

function PhysicsManager(engine){
  this.engine = engine; // Keep a persistant reference to the engine.
  this.FPS = engine.FPS;
};

// Checks the two most relevant line segments of the rect and
// Returns an array in the format: [collisionPoint, surfaceVector] if there's
// a collision. Return null if vector hits nothing.
// Can optionally specify edges to ignore using the edgesToIgnore parameter.
// Precondition: vector originates from outside rect.
PhysicsManager.prototype.rectPointofCollision = function(vector, rect, edgesToIgnore=[]){
  let vectorsIntersectFunc = Vector2D.prototype.vectorsIntersect;
  let rectVertical;
  let rectHorizontal;

  let lineSegments = {
    "top": new Vector2D(rect.topLeft, rect.topRight),
    "bottom": new Vector2D(rect.bottomLeft, rect.bottomRight),
    "right": new Vector2D(rect.topRight, rect.bottomRight),
    "left": new Vector2D(rect.topLeft, rect.bottomLeft),
  }

  // Remove references to edges that are specified to be ignored.
  for(const edge of edgesToIgnore){
    lineSegments[edge] = null;
  };

  let x0 = vector.p1[0];
  let y0 = vector.p1[1];

  let tileX = rect.topLeft[0] + (rect.width / 2);
  let tileY = rect.topLeft[1] + (rect.height / 2);

  // Remove references to edges that aren't relevant (according to vector initial position)
  if(x0 <= tileX){
    lineSegments["right"] = null;
  } else lineSegments["left"] = null;

  if(y0 <= tileY){
    lineSegments["bottom"] = null;
  } else lineSegments["top"] = null;

  let collisions = [];

  // At most one horizontal and one vertical line segment will be checked.
  for(const edgeVector of Object.values(lineSegments)){
    if(edgeVector !== null){
      let collisionPoint = vectorsIntersectFunc(vector, edgeVector);
      if(collisionPoint !== null){collisions.push([collisionPoint, edgeVector])};
    };
  };

  if(collisions.length === 0){
    return null;
  }
  // If two collisions are detected, then we've hit a corner.
  else if(collisions.length === 2){
    return this._handleCornerCollision(vector, rect, collisions)
  }
  else { // Only other case should be single collision, but you never know...
    return collisions[0]; // Return first detected collision.
  };
};

// Precondition: collisions.length === 2
PhysicsManager.prototype._handleCornerCollision = function(vector, rect, collisions){
  let pointsAreEqual = (p1, p2) => {return p1[0] === p2[0] && p1[1] === p2[1]};

  // Define the edges.
  let horizontal = collisions[0];
  let vertical = collisions[1];

  let verticalConditions;
  if(pointsAreEqual(horizontal[0], vertical[0]) === true){ // Collision points are equal
    let vertex = horizontal[0];
    verticalConditions = [
      pointsAreEqual(rect.topLeft, vertex) && vector.p1[0] < vertex[0] && vector.p1[1] > vertex[1],
      pointsAreEqual(rect.bottomLeft, vertex) && vector.p1[0] < vertex[0] && vector.p1[1] < vertex[1],
      pointsAreEqual(rect.topRight, vertex) && vector.p1[0] > vertex[0] && vector.p1[1] > vertex[1],
      pointsAreEqual(rect.bottomRight, vertex) && vector.p1[0] > vertex[0] && vector.p1[1] < vertex[1],
    ];
  }
  else {
    // Calculate the manhatten distance between the two collision points.
    var distanceH = Math.abs(vector.p1[0] - horizontal[0][0]) + Math.abs(vector.p1[1] - horizontal[0][1])
    var distanceV = Math.abs(vector.p1[0] - vertical[0][0]) + Math.abs(vector.p1[1] - vertical[0][1])
    verticalConditions = [distanceV < distanceH];
  }

  if(verticalConditions.includes(true)){return vertical}
  else return horizontal;
};

// Precondition: We can assume current tileIndex belongs to a collidable tile.
PhysicsManager.prototype.tilePointofCollision = function(vector, scene, tileIndex){
  let tileMap = scene.tileMap
  let tilePos = tileMap.convertIndexToCoords(tileIndex);
  let tilePixelPos = tileMap.convertIndexToCoords(tileIndex, true);
  let tileRect = new Rect(tilePixelPos, tileMap.tileSize);
  let edgesToIgnore = [];

  let lineSegments = {
    "top": "above",
    "bottom": "below",
    "right": "rightOf",
    "left": "leftOf"
  }

  // Remove any reference to edges that are blocked by nearby wall / collidable tiles.
  let line; // vector representing current edge.
  let location; // relative tile location that may block line.
  let nearbyTile;
  for(const edge of Object.keys(lineSegments)){
    location = lineSegments[edge];
    nearbyTileIndex = tileMap.getNearbyTileIndex(tileIndex, location);
    if(nearbyTileIndex !== null && tileMap.tileIsCollidable(nearbyTileIndex) === true){
      edgesToIgnore.push(edge);
    };
  };

  return this.rectPointofCollision(vector, tileRect, edgesToIgnore);

};

// Basically plagiarized this helpful answer here:
// Kinda bummed I couldn't figure it out using the article alone, but whatever I guess.
// https://gamedev.stackexchange.com/questions/194356/need-help-with-fixing-optimized-raycasting-line-of-sight-algorithm

// This function is a general rayMarch implementation. It takes in the
// the rayVector being checked, the scene the ray is being casted in, and
// an evaluator method as arguments.

// A null value is returned if there is no collision, and an undefined value is
// returned if the ray goes out of bounds. The function will otherwise return
// a precise collision point.
PhysicsManager.prototype.rayMarch = function(rayVector, scene, evaluator){
    let CELLSIZE = scene.tileMap.tileSize;
    let tileMap = scene.tileMap;
    let sceneRect = new Rect([0, 0], tileMap.width * CELLSIZE, tileMap.height * CELLSIZE);
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
    let tilePos;
    for(; n > 0; --n){
      tilePos = [x * CELLSIZE, y * CELLSIZE];

      tileIndex = tileMap.getNearestTileIndex(tilePos);
      if(tileIndex === undefined){return undefined};

      result = evaluator(tileIndex);
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

// Return the coordinates of the point where rayVector hits something in the scene
// and the surface vector the point touches.
PhysicsManager.prototype.raycastCollision = function(rayVector, scene){
  let evaluator = this._checkForCollision.bind(this, rayVector, scene);
  result = this.rayMarch(rayVector, scene, evaluator);
  return result;
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

PhysicsManager.prototype._checkForCollision = function(rayVector, scene, tileIndex){
  let tileMap = scene.tileMap;
  if(tileMap.tileIsCollidable(tileIndex) === true){
    return this.tilePointofCollision(rayVector, scene, tileIndex);
  }
  return null;
};

PhysicsManager.prototype.collisionSlide = function(movVector, collisionPoint, collisionSurface){
  let vScalarMultiply = Vector2D.prototype.scalarMultiply;
  let vDotProduct = Vector2D.prototype.dotProduct;
  let vSubtract = Vector2D.prototype.subtract;

  // let newPos = collisionPoint;
  let surfaceNormal = collisionSurface.orthogonal();
  surfaceNormal = surfaceNormal.normalize();

  let dotProduct = vDotProduct(movVector, surfaceNormal);
  let undesired = vScalarMultiply(surfaceNormal, dotProduct);
  let desired = vSubtract(movVector, undesired);

  return desired;
};

PhysicsManager.prototype.resolveCollision = function(movVector, collisionPoint) {
  let directionX = Math.sign(movVector.dx());
  let directionY = Math.sign(movVector.dy());
  collisionPoint[0] -= directionX;
  collisionPoint[1] -= directionY;
  return collisionPoint;
};

/**
 * Custom rect class. Useful for getting information for rectangle calculations.
 * Note: use only for calculations. Use PIXI.Rectangle for drawing,
*/
function Rect(topLeft, width, height=undefined){
  this.topLeft;
  this.topRight;
  this.bottomLeft;
  this.bottomRight;
  this.center;

  this.width;
  this.height;

  this.setTopLeft(topLeft, update=false);
  this.setDimensions(width, height, update=false);
  this._update();
};

Rect.prototype.setTopLeft = function(topLeft, update=true){
  this.topLeft = topLeft;
  if(update === true){this._update()};
};

Rect.prototype.setDimensions = function(width, height=undefined, update=true){
  this.width = width;
  if(height === undefined){
    this.height = width
  } else this.height = height;

  if(update === true){this._update()};
};

Rect.prototype._update = function(){
  this.topRight = [this.topLeft[0] + this.width, this.topLeft[1]];
  this.bottomLeft = [this.topLeft[0], this.topLeft[1] + this.height];
  this.bottomRight = [this.topLeft[0] + this.width, this.topLeft[1] + this.height];
  this.center = [this.topLeft[0] + (this.width / 2), this.topLeft[1] + (this.height / 2)];
};

/**
 * Custom circle class.
*/
function Circle(center, radius){
  this.center;
  this.radius;

  this.setCenter(center);
  this.setRadius(radius);
};

Circle.prototype.setCenter = function(center){
  this.center = center;
};

Circle.prototype.setRadius = function(radius){
  this.radius = radius;
};


/**
 * Custom vector class that doubles as an interface for basic vector calculations.
 * point1 and point2 are its coordinates (lists in the form of [1, 2]).
 * If point2 is not provided, then it'll be assumed that the vector originates
 * from the origin (0, 0).
 * For all Vector2D methods, if the only parameter is the vector object,
 * you can also call the method from witthin the vector itself.
 * i.e. vector1.dx() vs. Vector2D.prototype.dx(vector1)
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

// If the vector parameter is undefined, then return the vector
// that the function is being called from.
Vector2D.prototype._getVector = function(vector){
  if(vector === undefined){
    return this;
  } else return vector;
};

Vector2D.prototype.copy = function(vector){
  vector = this._getVector()
  let p1 = [vector.p1[0], vector.p1[1]];
  let p2 = [vector.p2[0], vector.p2[1]];
  return new Vector2D(p1, p2);
};

Vector2D.prototype.add = function(vector1, vector2){
  let dx = vector1.dx() + vector2.dx();
  let dy = vector1.dy() + vector2.dy();

  let p1 = [vector1.p1[0], vector1.p1[1]];
  let p2 = [vector1.p1[0] + dx, vector1.p1[1] + dy];
  return new Vector2D(p1, p2);
};

Vector2D.prototype.subtract = function(vector1, vector2){
  let dx = vector1.dx() - vector2.dx();
  let dy = vector1.dy() - vector2.dy();

  let p1 = [vector1.p1[0], vector1.p1[1]];
  let p2 = [vector1.p1[0] + dx, vector1.p1[1] + dy];
  return new Vector2D(p1, p2);
};

Vector2D.prototype.scalarMultiply = function(vector, s){
  let dx = vector.dx() * s;
  let dy = vector.dy() * s;

  let p1 = [vector.p1[0], vector.p1[1]];
  let p2 = [vector.p1[0] + dx, vector.p1[1] + dy];
  return new Vector2D(p1, p2);
};

Vector2D.prototype.scalarDivide = function(vector, s){
  if(s != 0){
    let dx = vector.dx() / s;
    let dy = vector.dy() / s;

    let p1 = [vector.p1[0], vector.p1[1]];
    let p2 = [vector.p1[0] + dx, vector.p1[1] + dy];
    return new Vector2D(p1, p2);
  };
};

Vector2D.prototype.dotProduct = function(vector1, vector2){
  return (vector1.dx() * vector2.dx()) + (vector1.dy() * vector2.dy());
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
  vector = this._getVector(vector);
  let x = vector.p2[0];
  let y = vector.p2[1];
  let angle = Math.atan2(y, x);

  if(inDegrees === true){
    angle = Engine.prototype.convertRadiansToDegrees(angle);
  };
  return angle;
};

Vector2D.prototype.dx = function(vector){
  vector = this._getVector(vector);
  return vector.p2[0] - vector.p1[0];
};

Vector2D.prototype.dy = function(vector){
  vector = this._getVector(vector);
  return vector.p2[1] - vector.p1[1];
};

// Return magnitude of horizontal component of vector.
Vector2D.prototype.width = function(vector){
  vector = this._getVector(vector);
  return Math.abs(vector.dx())
};

// Return magnitude of vertical component of vector.
Vector2D.prototype.height = function(vector){
  vector = this._getVector(vector);
  return Math.abs(vector.dy())
};

Vector2D.prototype.length = function(vector){
  vector = this._getVector(vector);
  let a = vector.width();
  let b = vector.height();
  return Math.sqrt(Math.pow(a, 2) + Math.pow(b, 2));
};

Vector2D.prototype.normalize = function(vector){
  vector = this._getVector(vector);
  let length = vector.length();
  if(length > 0){
    return Vector2D.prototype.scalarDivide(vector, length);
  };
};

// Return the vector orthogonal to the input vector.
Vector2D.prototype.orthogonal = function(vector){
  vector = this._getVector(vector);
  let p1 = [vector.p1[0], vector.p1[1]];
  return new Vector2D(p1, [vector.p1[0] - vector.dy(), vector.p1[1] + vector.dx()]);
};
