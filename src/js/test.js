/**
 * debug.js will be responsible for any all testing.
 * don't expect the cleanest code here.
*/

function Tester(parent){
  this.parent = parent;
};

// This is where you set the tests for drawing to be ran.
Tester.prototype.testDraw = function(data){
  this.firstTest(data)
};

// This where you set the tests for updating to be ran.
Tester.prototype.testUpdate = function(){};

// This is where you set the test inits to be ran.
Tester.prototype.init = function(){
  this.firstTestInit()
};

Tester.prototype.firstTestInit = function(){
  let parent = this.parent;
  let renderer = parent.renderer;
  // This is jo_the_pyro.png
  let image = parent.getImage("jtp");
  let imageURL = parent.imgLocation + "/" + image
  let texture = renderer.getTexture(imageURL);
  let jo = new SpriteSheet(imageURL, texture, 192, 96, 32);
  let anim = parent.getLoadedAsset(parent.animKey).get("jtp_walk_right");
  let tiles = parent.getLoadedAsset("levelData").get("testLevel");
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
