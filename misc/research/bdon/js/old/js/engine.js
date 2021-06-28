/**
 * engine.js contains a majority of the game's system logic.
 * the Engine class is basically the game object.
 */

class Engine {
  constructor(htmlDOM){
    this.windowWidth = 800;
    this.windowHeight = 600;

    this.verifyPixi();
    this.createApp(htmlDOM);
    this.loadAssets();
    }

  verifyPixi(){
    let type = "WebGL";
    if(!PIXI.utils.isWebGLSupported()){
      type = "canvas";
    }
    PIXI.utils.sayHello(type);
  }

  createApp(element){
    this.app = new PIXI.Application({
      view: element,
      width: this.windowWidth,
      height: this.windowHeight,
      backgroundColor: 0xB8D5EE
    })
  }

  // These functions are placeholders.
  drawText(msg){
    let style = new PIXI.TextStyle({
      fontFamily: "Arial",
      fontSize: 36,
      fill: "white",
      stroke: '#ff3300',
      strokeThickness: 4,
      dropShadow: true,
      dropShadowColor: "#000000",
      dropShadowBlur: 4,
      dropShadowAngle: Math.PI / 6,
      dropShadowDistance: 6,
    });

    let message = new PIXI.Text(msg, style);
    this.app.stage.addChild(message);
  }

  drawRect(x, y, width, height){
    let rectangle = new PIXI.Graphics();
    rectangle.beginFill(0x66CCFF);
    rectangle.drawRect(x, y, width, height);
    rectangle.endFill();
    this.app.stage.addChild(rectangle)
  }

  loadAssets(){
    PIXI.Loader.shared
      .add("img/jo_the_pyro.png")
      .on("progress", this.progressHandler)
      .load(Engine.setup);
  }

  setup(){
    let texture = PIXI.utils.TextureCache["img/jo_the_pyro.png"];
    let rectangle = new PIXI.Rectangle(0, 0, 32, 32);
    texture.frame = rectangle;

    this.mini_jo = new PIXI.Sprite(texture);
    this.mini_jo.x = 32;
    this.mini_jo.y = 32;
    this.app.stage.addChild(this.mini_jo);

  }

  progressHandler(loader, resource){
    console.log(`loading: ${resource.url}`);
    console.log(`progress: ${loader.progress}%`);
  }

  drawImage(){
    this.jo = new PIXI.Sprite(PIXI.Loader.shared.resources["img/jo_the_pyro.png"].texture);
    this.app.stage.addChild(this.jo);
    this.app.stage.addChild(this.mini_jo);
  }
}
