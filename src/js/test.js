/**
 * test.js will be responsible for any and all testing.
 * don't expect the cleanest code here.
*/

function Tester(parent){
  this.parent = parent;
};

// This is where you set the tests for drawing to be ran.
Tester.prototype.testDraw = function(data){
  // this.firstTest(data)
  // this.secondTest(data)
  this.thirdTest(data)
};

// This where you set the tests for updating to be ran.
Tester.prototype.testUpdate = function(data){
  this.checkPresses();
  this.movePlayer();
};

// This is where you set the test inits to be ran.
Tester.prototype.init = function(){
  // this.firstTestInit()
  // this.secondTestInit();
  this.thirdTestInit();
};

// First test focused on displaying a sprite.
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

// Second test focused on displaying tile/level information.
// Player movement is now incompatible.
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

// Third test focuses on working with an entity like structure.
Tester.prototype.thirdTestInit = function(){
  let parent = this.parent;
  let renderer = parent.renderer;
  this.sceneManager = new SceneManager();
  let level = parent.getLoadedAsset("levelData").get("testLevel");
  level = new Scene(parent, level);
  // Create player entity.
  let spriteSheet = renderer.getSheetFromId("player");
  let animation = parent.getLoadedAsset(parent.animKey).get("swordbro_idle");
  animation = new Animation("player_idle", spriteSheet, animation);
  let sprite = animation.getSprite();
  let player = new Entity("player", sprite, "player", "idle", 96, 96);
  level.addEntity(player);
  level.setEntityAttribute("player", "animations", [animation]);
  level.setEntityAttribute("player", "x", 96);
  level.setEntityAttribute("player", "y", 96);
  this.sceneManager.setScene(level);

  this.leftPressed = false;
  this.rightPressed = false;
  this.upPressed = false;
  this.downPressed = false;
};

Tester.prototype.thirdTest = function(data){
  // Set aliases.
  let parent = this.parent;
  let renderer = parent.renderer;
  let level = this.sceneManager.currentScene
  let player = level.getEntity("player")
  let sprite = level.getEntityAttribute("player", "sprite")
  let posX = level.getEntityAttribute("player", "x")
  let posY = level.getEntityAttribute("player", "y")

  // Draw.
  renderer.drawText(data.fps);
  renderer.drawTiles(level);
  renderer.drawSprite(sprite, posX, posY)

  // Update.
  let animationsArray = level.getEntityAttribute("player", "animations")
  let animation = animationsArray[0];
  animation.nextFrame()
  sprite = animation.getSprite()
  level.setEntityAttribute("player", "sprite", sprite)
};

Tester.prototype.createPlayer = function(){
  let parent = this.parent
  let renderer = parent.renderer
}
// Placeholder functions that track keypresses & player movement.
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
  let level = this.sceneManager.currentScene
  let player = level.getEntity("player")
  let incrFunc = level.incrementEntityAttribute.bind(level)

  if(this.upPressed === true){incrFunc("player", "y", -5)}
  if(this.downPressed === true){incrFunc("player", "y", 5)}
  if(this.rightPressed === true){incrFunc("player", "x", 5)}
  if(this.leftPressed === true){incrFunc("player", "x", -5)}
  this.upPressed = false;
  this.downPressed = false;
  this.leftPressed = false;
  this.rightPressed = false;
};
