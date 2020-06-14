/**
 * main.js contains the game's mainloop.
*/

let secondsPassed = 0;
let oldTimeStamp = 0;
let fps;

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

/**
 * timeStamp is the time it takes (in miliseconds) to reach the next iteration.
 * timeDelta is the difference between the current timestamp and previous timestamp in seconds.
*/
function main(timeStamp){
  timeDelta = (timeStamp - oldTimeStamp) / 1000;
  oldTimeStamp = timeStamp;

  fps = Math.round(1 / timeDelta);
  update();
  draw();
  requestAnimationFrame(main);
}

// Start things off.
initialize();
requestAnimationFrame(main);
