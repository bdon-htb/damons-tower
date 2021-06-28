app = new PIXI.Application({
  width: 800,
  height: 600,
  backgroundColor: 0xB8D5EE
  })

document.body.appendChild(app.view);

let loader = PIXI.loader;
let TextureCache = PIXI.utils.TextureCache;
let Sprite = PIXI.Sprite;
let Rectangle = PIXI.Rectangle;

loader
  .add("img/jo_the_pyro.png")
  .load(setup);

function setup() {

  //Create the `tileset` sprite from the texture
  let texture = TextureCache["img/jo_the_pyro.png"];

  //Create a rectangle object that defines the position and
  //size of the sub-image you want to extract from the texture
  //(`Rectangle` is an alias for `PIXI.Rectangle`)
  let rectangle = new Rectangle(0, 0, 32, 32);

  //Tell the texture to use that rectangular section
  texture.frame = rectangle;

  //Create the sprite from the texture
  let rocket = new Sprite(texture);

  //Position the rocket sprite on the canvas
  rocket.x = 32;
  rocket.y = 32;

  //Add the rocket to the stage
  app.stage.addChild(rocket);

  //Render the stage
  app.renderer.render(app.stage);
}
