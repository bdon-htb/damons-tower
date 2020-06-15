/**
 * main.js contains the game's mainloop.
*/

let secondsPassed = 0;
let oldTimeStamp = 0;
let fps;
const HTML_DOM = document.getElementById("game");
let game = new Engine(HTML_DOM);

function update(){}

function draw(){
  game.drawText(fps);
  game.drawRect(100,100,50,50);
  game.drawImage();
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
requestAnimationFrame(main);
