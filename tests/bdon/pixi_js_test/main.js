// Check that Pixi.js works.
let type = "WebGL"
if(!PIXI.utils.isWebGLSupported()){
  type = "canvas"
}

PIXI.utils.sayHello(type)

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


// Add the canvas that Pixi automatically creates for you to the HTML document.
document.body.appendChild(app.view);
