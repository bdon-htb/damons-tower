/**
 * main.js contains the game's mainloop.
*/

const HTML_DOM = document.getElementById("game");
let game = new Engine(HTML_DOM);
let timeStep = 1000 / game.FPS;
let oldTimeStamp = 0;
let accumulator = 0;
let data;
let fps;

/**
 * Fixed physics timestep with variable drawing.
 * Currently there's no interpolation.
*/
function main(timeStamp){
  /* Throttle the framerate
  if (timeStamp < oldTimeStamp + (1000 / 10)) {
      frameID = requestAnimationFrame(main);
      return;
  }
  */

  timeDelta = timeStamp - oldTimeStamp;

  data = {
    timeStamp: timeStamp,
    oldTimeStamp: oldTimeStamp,
    timeDelta: timeDelta,
    fps: Math.round(1 / (timeDelta / 1000))
  };

  accumulator += timeDelta;

  let numUpdateSteps = 0; // Track any additional updates.
  while(accumulator >= timeStep){
    game.run(data);
    accumulator -= timeStep;
    // Catch spiral of death.
    if(++numUpdateSteps >= 240){
      accumulator = 0; // Discard unsimulated time.
      console.warn('Potential spiral of death detected!');
      break;
    };
  };

  game.draw();
  oldTimeStamp = timeStamp;
  requestAnimationFrame(main);
};

// Start things off.
requestAnimationFrame(main);
