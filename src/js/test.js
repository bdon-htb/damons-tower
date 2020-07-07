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
Tester.prototype.testUpdate = function(){};

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
  let level = parent.getLoadedAsset("levelData").get("testLevel");
  this.level = new Scene(parent, level);
  this.testAnim = new Animation("jtp", jo, anim);
};

Tester.prototype.firstTest = function(data){
  let parent = this.parent;
  let renderer = parent.renderer;
  renderer.drawTiles(this.level);
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
};

Tester.prototype.secondTest = function(data){
  let parent = this.parent;
  let renderer = parent.renderer;
  renderer.drawTiles(this.level);
  renderer.drawText(data.fps);
  renderer.drawSprite(this.testAnim.getSprite(), 96, 96);
  this.testAnim.nextFrame();
};
