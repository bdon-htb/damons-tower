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
 * Helper functions
*/

// Stolen / borrowed from mdn. Why don't they just make a proper random library :/
function getRandomInt(min, max) {
  min = Math.ceil(min);
  max = Math.floor(max);
  return Math.floor(Math.random() * (max - min) + min);
}


function inBetween(value, lower, upper, inclusive=false){
  let result;
  if(inclusive === false){
    result = (lower < value && value < upper);
  } else result = (lower <= value && value <= upper);
  return result;
};

function pointInRect(x, y, rect){
  let topLeftX = rect.topLeft[0];
  let topLeftY = rect.topLeft[1];
  let width = rect.width;
  let height = rect.height;
  let result = (
    inBetween(x, topLeftX, topLeftX + width, true) === true &&
    inBetween(y, topLeftY, topLeftY + height, true) === true
  );
  return result;
};

function rectIntersects(rectA, rectB){
  let x1 = rectA.topLeft[0];
  let y1 = rectA.topLeft[1];

  let x2 = rectB.topLeft[0];
  let y2 = rectB.topLeft[1];

  let intersectX = Math.max(x1, x2);
  let intersectY = Math.max(y1, y2);
  let result = (
    pointInRect(intersectX, intersectY, rectA) == true &&
    pointInRect(intersectX, intersectY, rectB) == true
  );
  return result;
};

function convertIndexToCoords(index, arrayWidth){
  let index_Y = Math.floor(index / arrayWidth);
  let index_X = index % arrayWidth;
  return [index_X, index_Y];
};

function convertCoordsToIndex(index_X, index_Y, arrayWidth){
  return index_Y * arrayWidth + index_X;
};

function clamp(n, min, max){
  if(min > max){console.error(`interval bounds are invalid! bounds: [${min}, ${max}]`)}

  if(n < min){n = min}
  else if(n > max){n = max};
  return n;
};

function inBetween(value, lower, upper, inclusive=false){
  let result;
  if(inclusive === false){
    result = (lower < value && value < upper);
  } else result = (lower <= value && value <= upper);
  return result;
};

// Return true if the point exists inside the rectangle.
// rect = Rect not PIXI.Rectangle.
function pointInRect(x, y, rect){
  let inBetween = this.inBetween.bind(this);
  let topLeftX = rect.topLeft[0];
  let topLeftY = rect.topLeft[1];
  let width = rect.width;
  let height = rect.height;
  let result = (
    inBetween(x, topLeftX, topLeftX + width, true) === true &&
    inBetween(y, topLeftY, topLeftY + height, true) === true
  );
  return result;
};

/**
 * Procedural gneeration classes.
*/

// Rectangular room.
function Room(width, height, margin=1){
  this.width = width;
  this.height = height;

  this.margin = margin;

  this.rect = new Rect([0, 0], width, height);
  // space outside room that cannot be occupied by other rooms.
  this.boundRect = new Rect([0, 0], width + (2 * margin), height + (2 * margin));
};

Room.prototype.setTopLeft = function(topLeft, update=true){
  this.rect.setTopLeft(topLeft);
  this.boundRect.setTopLeft([topLeft[0] - this.margin, topLeft[1] - this.margin]);
};

/**
 * Procedural generation functions
*/

// Rooms are simply rects here.
function generateRoom(){
  let width = getRandomInt(5, 20);
  let height = getRandomInt(5, 20);
  return new Room(width, height);
}

function inLevelBounds(level, room){
  let points = ["topLeft", "bottomLeft", "topRight", "bottomRight"];
  let x;
  let y;
  for(let point of points){
    x = room[point][0];
    y = room[point][1];
    if(pointInRect(x, y, level.rect) === false){
      return false;
    }
  }
  return true;
};

function overlapsRooms(level, room){
  for(let otherRoom of level.rooms){
    if(rectIntersects(room.boundRect, otherRoom.boundRect)){return true}
  }
  return false;
};

function addRoomToLevel(level, room, topLeft){

  // Starting index.
  let index = convertCoordsToIndex(topLeft[0], topLeft[1], level.width);

  for(let y = 0; y < room.height; y++){
    for(let x = 0; x < room.width; x++){
      level.tileData[index] = ROOMVALUE;
      index += 1
    };
    index += level.width - room.width;
  };
};

function markNextToRoom(level, room){
  let index;

  let width;
  let height;

  let startX;
  let startY;

  let endX;
  let endY;

  let margins = {
    "top": {
      "startX": room.boundRect.topLeft[0],
      "startY": room.boundRect.topLeft[1],
      "endX": room.boundRect.topRight[0],
      "endY": room.boundRect.topLeft[1] + room.margin
    },
    "bottom": {
      "startX": room.boundRect.bottomLeft[0],
      "startY": room.boundRect.bottomLeft[1] - room.margin,
      "endX": room.boundRect.bottomRight[0],
      "endY": room.boundRect.bottomLeft[1]
    },
    "left": {
      "startX": room.boundRect.topLeft[0],
      "startY": room.boundRect.topLeft[1] + 1,
      "endX": room.boundRect.topLeft[0] + room.margin,
      "endY": room.boundRect.bottomLeft[1] - 1
    },
    "right": {
      "startX": room.boundRect.topRight[0] - room.margin,
      "startY": room.boundRect.topRight[1] + 1,
      "endX": room.boundRect.topRight[0],
      "endY": room.boundRect.bottomRight[1] - 1
    },
  }

  // Mark horizontal margins of room.
  for(let [side, margin] of Object.entries(margins)){
    startX = clamp(margin.startX, 0, level.width);
    startY = clamp(margin.startY, 0, level.height);

    endX = clamp(margin.endX, 0, level.width);
    endY = clamp(margin.endY, 0, level.height);

    // If the starting spot is inside the rect then there is no space for margin.
    // right side bricks if margin === 1, so I added the extra condition to account for that.
    if((side !== "right" && room.margin !== 1) && pointInRect(startX, startY, room.rect) === true){
      continue;
    };

    width = endX - startX;
    height = endY - startY

    index = convertCoordsToIndex(startX, startY, level.width);

    for(let y = 0; y < height; y++){
      for(let x = 0; x < width; x++){
        level.tileData[index] = NEXTTOVALUE;
        index += 1;
      };
      index += level.width - width;
    }
  };
}

function placeRoom(level, room, maxAttempts=10){
  let levelData = level.array;
  let topLeft;

  let placed = false;
  let attempts = 0;
  while(!placed && attempts <= maxAttempts){
    topLeft = [getRandomInt(1, level.width - room.width), getRandomInt(1, level.height - room.height)];
    room.setTopLeft(topLeft);

    if(!overlapsRooms(level, room)){
      addRoomToLevel(level, room, topLeft);
      markNextToRoom(level, room);
      placed = true;
      level.rooms.push(room)
    }

    attempts++;
  }
  return placed;
};

// Check available tiles for corridors.
function getStartPoints(level){
  let startPoints = []; // Contains indexes of potential corridor start points.

  let banned = [ROOMVALUE, DOORVALUE, NEXTTOVALUE];

  let x = 0;
  let y = 0;

  let canPlace = false;

  index = 0;
  for(let y = 0; y < level.height; y++){
    for(let x = 0; x < level.width; x++){

      canPlace = !banned.includes(level.tileData[index]);

      // Check index to left.
      if(canPlace && x > 0){
        canPlace = !banned.includes(level.tileData[index - 1]);
      }

      // Check index to right.
      if(canPlace && x < level.width){
        canPlace = !banned.includes(level.tileData[index + 1]);
      }

      // Check index above.
      if(canPlace && y > 0){
        canPlace = !banned.includes(level.tileData[index - level.width]);
      }

      // Check index below.
      if(canPlace && y < level.height){
        canPlace = !banned.includes(level.tileData[index + level.width]);
      }

      // Don't place on border.
      if(x === 0 || x === level.width - 1 || y === 0 || y === level.height - 1){
        canPlace = false;
      }

      if(canPlace){
        startPoints.push(index);
      }
      index += 1;
    };
  };

  return startPoints;
};

function growCorridor(level, startIndex){
  let next = [startIndex];
  let visited = new Set();

  let index = startIndex;
  let startPos = convertIndexToCoords(startIndex, level.width); // Get current position;
  let x = startPos[0];
  let y = startPos[1];



  let possibleMoves;
  let banned = [ROOMVALUE, DOORVALUE, NEXTTOVALUE, CORRIDORVALUE];
  let max = 100;
  while(next.length > 0 && max > 0){

    index = next.pop();
    visited.add(index);
    level.tileData[index] = CORRIDORVALUE;

    possibleMoves = {
      "up": index - level.width,
      "down": index + level.width,
      "right": index + 1,
      "left": index - 1
    }

    // If at border, delete relevant options.
    if(x === 0){delete possibleMoves.left};
    if(x === level.width - 1){delete possibleMoves.right};
    if(y === 0){delete possibleMoves.up};
    if(y === level.height - 1){delete possibleMoves.down};

    for(let move of Object.values(possibleMoves)){
      if(!visited.has(move) && !banned.includes(level.tileData[move])){
        next.push(move)
        max -= 1
      };
    };
  }

};

function generateCorridors(level){
  let startPoints = getStartPoints(level);
  let start = startPoints[getRandomInt(0, startPoints.length)];
  growCorridor(level, start);
};

function generateLevel(){
  let level = {
    "rect": new Rect([0, 0], GRIDWIDTH, GRIDHEIGHT),
    "width": GRIDWIDTH,
    "height": GRIDHEIGHT,
    "tileData": null,
    "rooms": []
  };
  level.tileData = new Array(GRIDWIDTH * GRIDHEIGHT).fill(EMPTYVALUE) // Fill level with empty cells.

  let totalRooms = 20;
  let roomCount = 0;

  let room;
  let placed;
  while(roomCount < totalRooms){
    room = generateRoom();
    placed = placeRoom(level, room);
    if(placed === true){
      roomCount++;
    }
  };

  generateCorridors(level);

  return level;
}
