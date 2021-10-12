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
  this.rect = new Rect([0, 0], width, height);

};

Room.prototype.setTopLeft = function(topLeft){
  this.rect.setTopLeft(topLeft);
};

/**
 * Procedural generation functions
*/

// Rooms are simply rects here.
function generateRoom(){
  let width = getRandomInt(10, 20);
  let height = getRandomInt(10, 20);
  return new Room(width, height);
}

function inLevelBounds(level, room){
  let points = ["topLeft", "bottomLeft", "topRight", "bottomRight"];
  let x;
  let y;
  for(let point of points){
    x = room.rect[point][0];
    y = room.rect[point][1];
    if(pointInRect(x, y, level.rect) === false){
      return false;
    }
  }
  return true;
};

function overlapsRooms(level, room){
  for(let otherRoom of level.rooms){
    if(rectIntersects(room.rect, otherRoom.rect)){return true}
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

function randomlyPlaceRoom(level, room, maxAttempts=10){
  let topLeft;

  let placed = false;
  let attempts = 0;
  while(!placed && attempts <= maxAttempts){
    topLeft = [getRandomInt(1, level.width - room.width), getRandomInt(1, level.height - room.height)];
    room.setTopLeft(topLeft);

    if(!overlapsRooms(level, room)){
      addRoomToLevel(level, room, topLeft);
      placed = true;
      level.rooms.push(room)
    }

    attempts++;
  }
  return placed;
};

function appendRoom(level, lastRoom, room){
  let sides = ["top", "bottom", "left", "right"];

  let placed = false;
  let maxAttempts = 10; // maxAttempts per side.
  let side;
  let attempts;
  let x;
  let y;
  while(!placed && sides.length > 0){
    attempts = 0;
    side = sides[getRandomInt(0, sides.length - 1)]; // Pick a random side.

    while(!placed && attempts <= maxAttempts){
      switch(side){
        case "top":
          x = getRandomInt(lastRoom.rect.topLeft[0], lastRoom.rect.topRight[0]);
          y = lastRoom.rect.topLeft[1] - room.height - 1;
          break;
        case "bottom":
          x = getRandomInt(lastRoom.rect.bottomLeft[0], lastRoom.rect.bottomRight[0]);
          y = lastRoom.rect.topLeft[1] + 1;
          break;
        case "left":
          x = lastRoom.rect.topLeft[0] - room.width - 1;
          y = getRandomInt(lastRoom.rect.topLeft[1], lastRoom.rect.bottomLeft[1]);
          break;
        case "right":
          x = lastRoom.rect.topRight[0] + 1;
          y = getRandomInt(lastRoom.rect.topRight[1], lastRoom.rect.bottomRight[1]);
          break;
      }

      room.setTopLeft([x, y]);
      if(!overlapsRooms(level, room) && inLevelBounds(level, room)){
        addRoomToLevel(level, room, room.rect.topLeft);
        placed = true;
        level.rooms.push(room);
      };

      attempts++;
    }

    if(placed === false){
      sides.splice(sides.indexOf(side), 1);
    };
  }
  return placed;
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

  let totalRooms = 10;
  let roomCount = 0;

  let room;
  let lastRoom;
  let placed;
  let maxAttempts = 100;
  let attempts = 0;
  while(roomCount < totalRooms && attempts < maxAttempts){
    room = generateRoom();

    if(roomCount === 0){
      placed = randomlyPlaceRoom(level, room); // Place starting room.
    }
    else {
      placed = appendRoom(level, lastRoom, room);
    }

    if(placed === true){
      lastRoom = room;
      roomCount++;
    }

    attempts++;
  };
  return level;
}
