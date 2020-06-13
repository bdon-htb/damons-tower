/**
 * main.js contains the game's mainloop.
*/

let secondsPassed = 0;
let oldTimeStamp = 0;
let fps = 60;

let app = createGameWindow();

function initialize(){
  verifyPixiCompatibility();
  document.body.appendChild(app.view);
}

function update(){}

function draw(){
  changeWindowColor(0x061639);
  displayText(fps.toString());
}

function main(timeStamp){
  secondsPassed = (timeStamp - oldTimeStamp) / 1000;
  oldTimeStamp = timeStamp;

  fps = Math.round(1 / secondsPassed);
  update();
  draw();
  requestAnimationFrame(main);
}

// Start things off.
initialize();
requestAnimationFrame(main);
