let app = new PIXI.Application({
    width: 800,
    height: 600,
    antialias: false,
    transparent: false,
    resolution: 1
  }
)

let rectangle = new PIXI.Graphics();
    rectPosX = 170;
    rectPosY = 170;
    rectVel = 10;
    events = {};
    rightPressed = false;
    leftPressed = false;
    upPressed = false;
    downPressed = false;

function checkPixiCompatibility(){
  let type = "WebGL"
  if(!PIXI.utils.isWebGLSupported()){
    console.warn("WebGL is not supported for this browser.")
    type = "canvas"
  }
  PIXI.utils.sayHello(type)
}

function initialize(){
  checkPixiCompatibility();
  document.addEventListener('keydown', keyDownHandler, false);
  document.addEventListener('keyup', keyUpHandler, false);
  document.body.appendChild(app.view);
}

function drawRect(){
  rectangle.beginFill(4, 0x66FFCC, 1); // <- can't seem to change the colour for some reason.
  rectangle.drawRect(0, 0, 100, 100);
  rectangle.endFill();
  rectangle.x = rectPosX;
  rectangle.y = rectPosY;
  app.stage.addChild(rectangle);
}

function keyDownHandler(event) {
  if(event.keyCode == 39) {
    console.log('RIGHT KEY PRESSED')
    rightPressed = true;
  }
  else if(event.keyCode == 37) {
    leftPressed = true;
  }
  if(event.keyCode == 40) {
    downPressed = true;
  }
  else if(event.keyCode == 38) {
    upPressed = true;
  }
}

function keyUpHandler(event) {
  if(event.keyCode == 39) {
    console.log('RIGHT KEY PRESSED')
    rightPressed = false;
  }
  else if(event.keyCode == 37) {
    leftPressed = false;
  }
  if(event.keyCode == 40) {
    downPressed = false;
  }
  else if(event.keyCode == 38) {
    upPressed = false;
  }
}

function handleEvents(){
  if(rightPressed == true) {
    console.log('EVENT HANDLED')
    rectPosX += rectVel
  }
  else if(leftPressed == true) {
    rectPosX -= rectVel
  }
  if(downPressed == true) {
    rectPosY += rectVel
  }
  else if(upPressed == true) {
    rectPosY -= rectVel
  }
}

function update(){
  handleEvents()
}

function draw(){
  drawRect();
}

function main(){
  update();
  draw();
  requestAnimationFrame(main);
}

// Start things off.
initialize()
requestAnimationFrame(main);
