/**
 * main.js contains the game's mainloop.
*/

let secondsPassed = 0;
let oldTimeStamp = 0;
let fps;
let data;
const HTML_DOM = document.getElementById("game");
let game = new Engine(HTML_DOM);

/**
 * timeStamp is the time it takes (in miliseconds) to reach the next iteration.
 * timeDelta is the difference between the current timestamp and previous timestamp in seconds.
*/
function main(timeStamp){
  timeDelta = (timeStamp - oldTimeStamp) / 1000;

  fps = Math.round(1 / timeDelta);
  data = {
    timeStamp: timeStamp,
    oldTimeStamp: oldTimeStamp,
    timeDelta: timeDelta,
    fps: fps
  };

  oldTimeStamp = timeStamp;
  game.run(data);
  requestAnimationFrame(main);
}

// Start things off.
requestAnimationFrame(main);
