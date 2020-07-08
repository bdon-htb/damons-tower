/**
 * debug.js will be responsible for any and all testing.
 * don't expect the cleanest code here.
*/

function Tester(parent){
  this.parent = parent;
};

// This is where you set the tests for drawing to be ran.
Tester.prototype.testDraw = function(data){
  // this.firstTest(data)
  this.secondTest(data)
};

// This where you set the tests for updating to be ran.
Tester.prototype.testUpdate = function(data){
  this.checkPresses();
  this.movePlayer();
};

// This is where you set the test inits to be ran.
Tester.prototype.init = function(){
  // this.firstTestInit()
  this.secondTestInit();
};

Tester.prototype.firstTestInit = function(){
  let parent = this.parent;
  let renderer = parent.renderer;
  // This is jo_the_pyro.png
  let jo = renderer.getSheetFromId("jtp");
  let anim = parent.getLoadedAsset(parent.animKey).get("jtp_walk_right");
  this.testAnim = new Animation("jtp", jo, anim);
};

Tester.prototype.firstTest = function(data){
  let parent = this.parent;
  let renderer = parent.renderer;
  renderer.drawText(data.fps);
  renderer.drawRect(0x66CCFF, 96, 96, 64, 64);
  renderer.drawSprite(this.testAnim.getSprite(), 96, 96);
  this.testAnim.nextFrame();
};

Tester.prototype.secondTestInit = function(){
  let parent = this.parent;
  let renderer = parent.renderer;
  let player = renderer.getSheetFromId("player");
  let anim = parent.getLoadedAsset(parent.animKey).get("swordbro_idle");
  let level = parent.getLoadedAsset("levelData").get("testLevel");
  this.level = new Scene(parent, level);
  this.testAnim = new Animation("player", player, anim);

  this.playerX = 96;
  this.playerY = 96;
  this.leftPressed = false;
  this.rightPressed = false;
  this.upPressed = false;
  this.downPressed = false;
};

Tester.prototype.secondTest = function(data){
  let parent = this.parent;
  let renderer = parent.renderer;
  renderer.drawTiles(this.level);
  renderer.drawText(data.fps);
  renderer.drawSprite(this.testAnim.getSprite(), this.playerX, this.playerY);
  this.testAnim.nextFrame();
};

Tester.prototype.checkPresses = function(){
  let parent = this.parent;
  if(parent.inputManager.events.has("keyboard") === true){
    presses = parent.inputManager.events.get("keyboard");
    if(presses.includes("up")){this.upPressed = true}
    else if (presses.includes("down")){this.downPressed = true}
    if (presses.includes("right")){this.rightPressed = true}
    else if (presses.includes("left")){this.leftPressed = true}
  };
};

Tester.prototype.movePlayer = function(){
  if(this.upPressed === true){this.playerY -= 5}
  if(this.downPressed === true){this.playerY += 5}
  if(this.rightPressed === true){this.playerX += 5}
  if(this.leftPressed === true){this.playerX -= 5}
  this.upPressed = false;
  this.downPressed = false;
  this.leftPressed = false;
  this.rightPressed = false;
};
