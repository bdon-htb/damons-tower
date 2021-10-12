function fillCell(x, y, colour) {
  ctx.fillStyle = colour;
  ctx.fillRect(x, y, CELLSIZE, CELLSIZE);
};

function drawGrid() {
  for (let y = 0; y < GRIDHEIGHT; y++) {
    for (let x = 0; x < GRID_WIDTH; x++) {
      drawCellOutline(x * CELLSIZE, y * CELLSIZE);
    };
  };
};

function clearCanvas() {
  ctx.clearRect(0, 0, ctx.canvas.width, ctx.canvas.height)
};

function drawLevel(level){
  let x = 0;
  let y = 0;

  for(let cell of level.tileData){
    fillCell(x * CELLSIZE, y * CELLSIZE, COLOURS[cell]);
    x += 1;

    if(x >= level.width){
      x = 0;
      y += 1;
    };
  }
}
