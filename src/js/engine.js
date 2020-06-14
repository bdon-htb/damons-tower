/**
 * engine.js contains a majority of the game's system logic.
 */

// :)
class Engine {
  constructor(htmlDOM){
    this.windowWidth = 800;
    this.windowHeight = 600;

    this.verifyPixi();
    this.createApp(htmlDOM);
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

}
