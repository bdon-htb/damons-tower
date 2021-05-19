/**
 * input.js contains any code that involves input devices.
 * keyboard key assignment goes here.
*/

/**
 * Custom input manager class. Responsible for the creation,
 * and retrieval of all inputs and input devices.
*/
function InputManager(parent){
  this.parent = parent;
  this.events = new Map();
  this.inputDevices = new Map();
  this.addDevices();
};

InputManager.prototype.addDevices = function(){
  this.inputDevices.set("keyboard", new Keyboard());
  this.inputDevices.get("keyboard").addListeners(this.parent.context);
  this.inputDevices.set("mouse", new Mouse());
  this.inputDevices.get("mouse").addListeners(this.parent.context);
  // this.inputDevices.set("controller", new Controller());
};

InputManager.prototype.captureInputs = function(clearFirst=true){
  // TODO: Maybe make more elaborate.
  // If the game is hosted on a regular site having it constantly focused.
  // might intercept navigating the website.
  this.parent.context.focus();
  if (clearFirst === true) {
    this.clearEvents();
  };
  this.inputDevices.forEach((device) => {
    let inputs = device.captureInputs();
    if(inputs.constructor === Array && inputs.length > 0 || inputs.constructor === Map && inputs.size > 0){
      this.events.set(device.name, inputs)};
  });
};

InputManager.prototype.clearEvents = function(){
  this.events.clear();
};

/**
 * Base input device class.
*/
function InputDevice(name, defaultKeys){
  // Name of the input device.
  this.name = name;
  // An object of valid keys and their corresponding key code.
  // default keys does not change; it is a hardcoded reference to the original setup.
  this.defaultKeys = defaultKeys;
  // Copy the contents of this.defaultKeys to this.keys.
  this.keys = Object.assign(this.defaultKeys);
  // An object of the valid keys and a boolean to represent if their event has been triggerred.
  this.keyDown = {};
  this.keyUp = {}; // For checking if a key has been released.
  this.orderedKeyDown = [];
  this.orderedKeyUp = [];
  // FIll out this.keyDown and this.keyUp; Set all their key values to false.
  let objKeys = Object.keys(this.keys);
  objKeys.forEach(objKey => this.keyDown[objKey] = false);
  objKeys.forEach(objKey => this.keyUp[objKey] = false);
}

InputDevice.prototype.captureInputs = function(){
  console.error('captureInputs() was called directly from the base InputDevice class');
};

// Return an array of strings of all the currently triggered keys in the specified keyObject.
InputDevice.prototype.getActiveInputs = function(keyObject){
  let inputs = [];
  for(const [key, bool] of Object.entries(keyObject)){
    if(bool == true){inputs.push(key)};
  };
  return inputs;
};

// Sets this.key to the default keys defined.
InputDevice.prototype.setToDefaultKeys = function(){
  this.keys = Object.assign(this.defaultKeys);
};

// Set the keyObject's code value to the specified newCode
InputDevice.prototype.changeKeyCode = function(key, newCode){
  this.keys[key] = newCode;
};

// Set all of the values in keyObject to false.
InputDevice.prototype.resetKeyObject = function(keyObject){
  Object.keys(keyObject).forEach((key) => keyObject[key] = false);
};

// Update the order of the keys listed in this.orderedKeyDown / this.orderedKeyUp.
// type can either be "KeyDown" or "KeyUp"
InputDevice.prototype.updateKeyOrder = function(key, value, type){
  let item = `${type}-${key}`;
  // i.e. keyDown -> orderedKeyDown
  type = "ordered" + type.slice(0,1).toUpperCase() + type.slice(1);
  let index = this[type].indexOf(item);
  if(index > -1){
    this[type].splice(index, 1); // Remove item from array if it's already in it.
  };

  if(value === true){
    this[type].push(item);
  };
};

// Sets the value of the specified boolean keyObject. i.e. keyDown or keyUp.
// type can either be "keyDown" or "keyUp"
InputDevice.prototype.keyHandler = function(keyCode, type, value){
  let updateFunc = this.updateKeyOrder.bind(this)
  let keyObject = (type === "keyDown") ? this.keyDown : this.keyUp; // Assumes keyUp otherwise.
  for (const [key, code] of Object.entries(this.keys)){
    if(keyCode == code){
      keyObject[key] = value;
      updateFunc(key, value, type);
      break;
    };
  };
};

// Return all active keyDown and keyUp inputs in the order they are pressed.
// The output will look something like ["keyDown-up", "keyUp-down"]
// Children of InputDevice will have to make sure that their ordered keys
// are updated properly indivudally.
InputDevice.prototype.getActiveKeys = function(){
  let inputs = [];
  inputs = inputs.concat(this.orderedKeyDown);
  inputs = inputs.concat(this.orderedKeyUp);

  // Reset any stored keyUps.
  this.resetKeyObject(this.keyUp);
  this.orderedKeyUp = [];
  return inputs;
};

/**
 * Keyboard input device class.
*/
function Keyboard(){
  let defaultKeys = {
    up:"KeyW", // W
    down:"KeyS", // S
    left:"KeyA", // A
    right:"KeyD", // D
    space: "Space" // Space
  };

  InputDevice.call(this, "keyboard", defaultKeys);
};

// Inherit methods from InputDevice;
Keyboard.prototype = Object.create(InputDevice.prototype);

Keyboard.prototype.captureInputs = function(){
  inputs = this.getActiveKeys();
  return inputs;
};

Keyboard.prototype.addListeners = function(element){
  element.addEventListener("keydown", this.keyDownHandler.bind(this), false);
  element.addEventListener("keyup", this.keyUpHandler.bind(this), false);
};

Keyboard.prototype.removeListeners = function(element){
  element.removeEventListener("keydown", this.keyDownHandler.bind(this), false);
  element.removeEventListener("keyup", this.keyUpHandler.bind(this), false);
};

Keyboard.prototype.keyDownHandler = function(event){
  this.keyHandler(event.code, "keyDown", true); // log keyDown
  this.keyHandler(event.code, "keyUp", false); // reset equivalent keyUp
};

Keyboard.prototype.keyUpHandler = function(event){
  this.keyHandler(event.code, "keyUp", true); // log keyUp
  this.keyHandler(event.code, "keyDown", false); // reset equivalent keyUp
};

function Mouse(){
  let defaultKeys = {
    leftPress:0,
    middlePress:1,
    rightPress:2,
  };
  InputDevice.call(this, "mouse", defaultKeys);
  // Mouse position.
  this.x;
  this.y;
  this.clickEvents = { // Let's make click events a separate thing.
    leftClick: false,
    middleClick: false,
    rightClick: false
  };
};

// Inherit methods from InputDevice.
Mouse.prototype = Object.create(InputDevice.prototype);

Mouse.prototype.captureInputs = function(){
  let inputs = this.getActiveKeys().concat(this.getActiveInputs(this.clickEvents));
  this.resetKeyObject(this.clickEvents);
  return inputs;
};

Mouse.prototype.addListeners = function(element){
  element.addEventListener("mousedown", this.mouseDownHandler.bind(this), false);
  element.addEventListener("mouseup", this.mouseUpHandler.bind(this), false);
  element.addEventListener("mousemove", this.mouseMoveHandler.bind(this), false);
  element.addEventListener("click", this.mouseClickHandler.bind(this), false);
  element.addEventListener("auxclick", this.mouseClickHandler.bind(this), false);
  element.addEventListener("contextmenu", this.disableDefault.bind(this), false);
};

Mouse.prototype.removeListeners = function(element){
  element.removeEventListener("mousedown", this.mouseDownHandler.bind(this), false);
  element.removeEventListener("mouseup", this.mouseUpHandler.bind(this), false);
  element.removeEventListener("mousemove", this.mouseMoveHandler.bind(this), false);
  element.removeEventListener("click", this.mouseClickHandler.bind(this), false);
  element.removeEventListener("auxclick", this.mouseClickHandler.bind(this), false);
  element.removeEventListener("contextmenu", this.disableDefault.bind(this), false);
};

Mouse.prototype.getCoords = function(){
  return [this.x, this.y]
}

Mouse.prototype._updateCoords = function(x, y){
  this.x = x;
  this.y = y;
};

Mouse.prototype.mouseDownHandler = function(event){
  this.keyHandler(event.button, "keyDown", true);
  this.keyHandler(event.button, "keyUp", false);
};

Mouse.prototype.mouseUpHandler = function(event){
  this.keyHandler(event.button, "keyUp", true);
  this.keyHandler(event.button, "keyDown", false);
};

Mouse.prototype.mouseMoveHandler = function(event){
  this._updateCoords(event.offsetX, event.offsetY);
};

Mouse.prototype.mouseClickHandler = function(event){
  // array index corresponds to event.button value.
  buttons = ["leftClick", "middleClick", "rightClick"];

  // auxclick could be theoretically fired for mouses with extra buttons.
  // so we account for that here.
  if(event.button >= 0 && event.button <= 2){
    this.clickEvents[buttons[event.button]] = true;
  };
};

Mouse.prototype.disableDefault = function(event){
  event.preventDefault();
};

// TODO: For waaaaayyyy later.
function Gamepad(){};
