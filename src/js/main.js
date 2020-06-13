/**
 * main.js contains the game's mainloop.
*/

const maxFPS = 60; // Maximum FPS we want to allow.
var lastFrameTime = 0; // The last time the game loop was ran.
    delta = 0; //

let app = createGameWindow();

function initialize(){
  verifyPixiCompatibility();
  changeWindowColor(0x061639);
  document.body.appendChild(app.view);
}

function update(){}

function draw(){}

function main(){
  update();
  draw();
  requestAnimationFrame(main);
}

// Start things off.
initialize();
requestAnimationFrame(main);
