// Check that Pixi.js works.
let type = "WebGL"
if(!PIXI.utils.isWebGLSupported()){
  type = "canvas"
}

PIXI.utils.sayHello(type)

console.log('Hello All')

// Create a Pixi Application
let app = new PIXI.Application({
    width: 256,         // default: 800
    height: 256,        // default: 600
    antialias: true,    // default: false
    transparent: false, // default: false
    resolution: 1       // default: 1
    // forceCanvas: true, // if for whatever reason I want to force the Canvas API
  }
);

app.renderer.backgroundColor = 0x061639; // <- change bg color.
// app.renderer.autoResize = true; // <- ensures canvas is resized to match the resolution.
// app.renderer.resize(512, 512); // <- If I want to resize.

function fullscreen(){
  if (app.renderer.width != window.innerWidth && app.renderer.height != window.innerHeight){
    app.renderer.view.style.position = "absolute";
    app.renderer.view.style.display = "block";
    app.renderer.autoResize = true;
    app.renderer.resize(window.innerWidth, window.innerHeight);
  }
}

// fullscreen();
// setInterval(fullscreen, 1000);

/* Loading Images */
// For Pixi.js an image file must be converted into a WebGL texture.
// let texture = PIXI.utils.TextureCache["assets/jo_the_pyro.png"]
// let sprite = new PIXI.Sprite(texture); // <- create the sprite.

// Add the canvas that Pixi automatically creates for you to the HTML document.
document.body.appendChild(app.view);

// To load the image file use Pixi's loader object.
PIXI.loader // <- wtf is this syntax?
  .add("assets/jo_the_pyro.png")
  .on("progress", loadProgressHandler)
  .load(setup);

// When making an actual game with multiple images do it this way.
/*
PIXI.loader
  .add([
    "images/imageOne.png",
    "images/imageTwo.png",
    "images/imageThree.png"
  ])
  .load(setup);
*/

// Code here executes once after each file is loaded.
function loadProgressHandler(loader, resource){
  console.log(`loading: ${resource.url}`);

  console.log(`progress: ${loader.progress}%`);
}
// Code here executes once ALL the file(s) are loaded.
function setup() {
  let jo = new PIXI.Sprite(PIXI.loader.resources["assets/jo_the_pyro.png"].texture);

  // Change jo's position.
  // jo.x = 96;
  // jo.y = 96;
  jo.position.set(96, 96)

  // Change jo's size
  // jo.width = 80;
  // jo.height = 120;

  // For scaling
  // jo.scale.x = 2;
  // jo.scale.y = 2;
  // jo.scale.set(0.5, 0.5);

  app.stage.addChild(jo)
  console.log("All files loaded")
}

// app.stage.removeChild(anySprite) <- if you ever need to remove a sprite from the stage.
// anySprite.visible = false; <- this is simpler and more efficient to make things disappear.
