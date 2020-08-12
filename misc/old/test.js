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
  // this.thirdTest(data)
  // this.fourthTest(data)
  this.fifthTest(data);
};

// This where you set the tests for updating to be ran.
Tester.prototype.testUpdate = function(data){
  // this.firstTestUpdate();
};

// This is where you set the test inits to be ran.
Tester.prototype.init = function(){
  // this.firstTestInit()
  // this.secondTestInit();
  // this.thirdTestInit();
  // this.fourthTestInit();
  this.fifthTestInit();
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
  let levelSprite = parent.renderer.getSheetFromId(level.spriteSheet)
  level = new Scene(parent, levelSprite, level);
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

// Fourth test focuses on camera functionality.
Tester.prototype.fourthTestInit = function(){
  let parent = this.parent;
  let spawnpoint = [0, 0]
  let renderer = parent.renderer;
  this.sceneManager = new SceneManager();
  let level = parent.getLoadedAsset("levelData").get("testLevel");
  let levelSprite = parent.renderer.getSheetFromId(level.spriteSheet)
  level = new Scene(parent, levelSprite, level);
  level.camera.setup(spawnpoint[0], spawnpoint[1],
    parent.windowWidth, parent.windowHeight);
  // Create player entity.
  let spriteSheet = renderer.getSheetFromId("player");
  let animation = parent.getLoadedAsset(parent.animKey).get("swordbro_idle");
  animation = new Animation("player_idle", spriteSheet, animation);
  let sprite = animation.getSprite();
  let player = new Entity("player", sprite, "player", "idle", spawnpoint[0], spawnpoint[1]);
  level.addEntity(player);
  level.setEntityAttribute("player", "animations", [animation]);
  level.setEntityAttribute("player", "x", spawnpoint[0]);
  level.setEntityAttribute("player", "y", spawnpoint[1]);
  this.sceneManager.setScene(level);

  this.leftPressed = false;
  this.rightPressed = false;
  this.upPressed = false;
  this.downPressed = false;
};

Tester.prototype.fourthTest = function(data){
  // Set aliases.
  let parent = this.parent;
  let renderer = parent.renderer;
  let level = this.sceneManager.currentScene
  let camera = level.camera
  let player = level.getEntity("player")
  let sprite = level.getEntityAttribute("player", "sprite")
  let posX = level.getEntityAttribute("player", "x")
  let posY = level.getEntityAttribute("player", "y")
  let relPosArray = camera.getRelative(posX, posY)
  relPosX = relPosArray[0];
  relPosY = relPosArray[1];
  camera.center(posX, posY, sprite.height);

  let camRelPosArray = camera.getRelative(camera.centerX, camera.centerY)

  // Draw.
  // renderer.drawTiles(level);
  renderer.drawInView(level)
  // renderer.drawText(`${camera.centerX}, ${camera.centerY}`);
  renderer.drawSprite(sprite, relPosX, relPosY)

  // Draw Camera Lines
  // renderer.drawRect(0x66CCFF, 0, 0, 32, 32);
  // renderer.drawRect(0x66CCFF, camera.topLeft[0], camera.topLeft[1], 96, 96);
  /*
  renderer.drawLine(0x66CCFF, camRelPosArray[0] - 96, camRelPosArray[1],
    camRelPosArray[0] + 96, camRelPosArray[1], 5);
  renderer.drawLine(0x66CCFF, camRelPosArray[0], camRelPosArray[1] - 96,
    camRelPosArray[0], camRelPosArray[1] + 96, 5);
  */

  // Update.
  let animationsArray = level.getEntityAttribute("player", "animations")
  let animation = animationsArray[0];
  animation.nextFrame()
  sprite = animation.getSprite()
  level.setEntityAttribute("player", "sprite", sprite)
};

Tester.prototype.firstTestUpdate = function(){
  this.checkPresses();
  this.movePlayer();
};

// The fifth test focuses on menu.
Tester.prototype.fifthTestInit = function(){
  let parent = this.parent;
  let renderer = parent.renderer;
  this.menu = parent.getLoadedAsset("menus").get("mainMenu");
  this.menu.layout.organize();
};

Tester.prototype.fifthTest = function(data){
  // Set aliases.
  let parent = this.parent;
  let renderer = parent.renderer;
  let inputs = parent.getInputEvents();
  if(parent.getInputEvents().size > 0){
    this.menu.checkClicks();
  };
  renderer.drawMenu(this.menu);
};

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
  let velocity = 5

  if(this.upPressed === true){incrFunc("player", "y", -velocity)}
  if(this.downPressed === true){incrFunc("player", "y", velocity)}
  if(this.rightPressed === true){incrFunc("player", "x", velocity)}
  if(this.leftPressed === true){incrFunc("player", "x", -velocity)}
  this.upPressed = false;
  this.downPressed = false;
  this.leftPressed = false;
  this.rightPressed = false;
};
