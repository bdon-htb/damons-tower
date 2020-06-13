const maxFPS = 60; // Maximum FPS we want to allow.
var lastFrameTime = 0; // The last time the game loop was ran.
    delta = 0; //

function update(){}

function draw(){}

function main(){
  update();
  draw();
  if (timestamp < lastFrameTime + (1000 / maxFPS))
  requestAnimationFrame(main);
}

// Start things off.
requestAnimationFrame(main);
