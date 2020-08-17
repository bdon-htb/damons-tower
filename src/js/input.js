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
    if(inputs.length > 0){this.events.set(device.name, inputs)};
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
  // FIll out this.keyDown; By default set all the keys to false.
  let objKeys = Object.keys(this.keys);
  objKeys.forEach(objKey => this.keyDown[objKey] = false);
}

// Return an array of strings of all the currently triggered keyDowns in the device.
InputDevice.prototype.captureInputs = function(keyObject, inputs=[]){
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
InputDevice.prototype.changeKeyCode = function(keyObject, key, newCode){
  keyObject[key] = newCode;
};

// Set all of the values in keyObject to false.
InputDevice.prototype.resetKeyObject = function(keyObject){
  Object.keys(keyObject).forEach((key) => keyObject[key] = false);
};
/**
 * Keyboard input device class.
*/
function Keyboard(){
  let defaultKeys = {
    up:"w", // W
    down:"s", // S
    left:"a", // A
    right:"d" // D
  };
  InputDevice.call(this, "keyboard", defaultKeys);
};

Keyboard.prototype.captureInputs = function(){
  return InputDevice.prototype.captureInputs(this.keyDown);
};

Keyboard.prototype.addListeners = function(element){
  element.addEventListener("keyDown", this.keyDownHandler.bind(this), false);
  element.addEventListener("keyup", this.keyUpHandler.bind(this), false);
};

Keyboard.prototype.removeListeners = function(element){
  element.removeEventListener("keyDown", this.keyDownHandler.bind(this), false);
  element.removeEventListener("keyup", this.keyUpHandler.bind(this), false);
};

// Key handle function; key DOWN handler by default.
// If keyDown is false it will be treated as a key UP handler.
Keyboard.prototype.keyHandler = function(event, keyDown=true){
  let keyCode = event.key;
  for (const [key, code] of Object.entries(this.keys)){
    if(keyCode == code){this.keyDown[key] = keyDown};
  };
};

Keyboard.prototype.keyDownHandler = function(event){
  this.keyHandler(event);
};

Keyboard.prototype.keyUpHandler = function(event){
  this.keyHandler(event, false);
};

Keyboard.prototype.setToDefaultKeys = InputDevice.prototype.setToDefaultKeys.bind(this)

Keyboard.prototype.changeKeyCode = function(key, newCode){
  InputDevice.prototype.changeKeyCode(this.keys, key, newCode);
};

// Sets all of this.keyDown to false.
Keyboard.prototype.resetKeyDown = function(){
  keys = Object.keys(this.keyDown);
  keys.forEach((key) => this.keyDown.key = false);
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
    rightClick: false
  };
};

Mouse.prototype.captureInputs = function(){
  let inputs = InputDevice.prototype.captureInputs(this.keyDown);
  inputs = InputDevice.prototype.captureInputs(this.clickEvents, inputs);
  this.resetClicks(); // All click events are set to false when the mouse button is released.
  return inputs;
};

Mouse.prototype.addListeners = function(element){
  element.addEventListener("mousedown", this.mouseDownHandler.bind(this), false);
  element.addEventListener("mouseup", this.mouseUpHandler.bind(this), false);
  element.addEventListener("mousemove", this.mouseMoveHandler.bind(this), false);
  element.addEventListener("click", this.mouseClickHandler.bind(this, "leftClick"));
  element.addEventListener("auxclick", this.mouseClickHandler.bind(this, "rightClick"));
  element.addEventListener("contextmenu", this.disableDefault.bind(this), false);
};

Mouse.prototype.removeListeners = function(element){
  element.removeEventListener("mousedown", this.mouseDownHandler.bind(this), false);
  element.removeEventListener("mouseup", this.mouseUpHandler.bind(this), false);
  element.removeEventListener("mousemove", this.mouseMoveHandler.bind(this), false);
  element.addEventListener("contextmenu", this.disableDefault.bind(this), false);
};

Mouse.prototype.getCoords = function(){
  return [this.x, this.y]
}

Mouse.prototype._updateCoords = function(x, y){
  this.x = x;
  this.y = y;
};

Mouse.prototype.mouseButtonHandler = function(event, keyDown=true){
  this.disableDefault(event);
  this._updateCoords(event.offsetX, event.offsetY);
  let keyCode = event.button;
  for (const [key, code] of Object.entries(this.keys)){
    if(keyCode == code){this.keyDown[key] = keyDown};
  };
};

Mouse.prototype.mouseDownHandler = function(event){
  this.mouseButtonHandler(event);
};

Mouse.prototype.mouseUpHandler = function(event){
  this.mouseButtonHandler(event, false);
};

Mouse.prototype.mouseMoveHandler = function(event){
  this._updateCoords(event.offsetX, event.offsetY);
};

Mouse.prototype.mouseClickHandler = function(type){
  this.clickEvents[type] = true;
};

Mouse.prototype.resetClicks = function(){
  InputDevice.prototype.resetKeyObject(this.clickEvents);
};

Mouse.prototype.disableDefault = function(event){
  event.preventDefault();
};

Mouse.prototype.setToDefaultKeys = InputDevice.prototype.setToDefaultKeys.bind(this)

Mouse.prototype.changeKeyCode = function(key, newCode){
  InputDevice.prototype.changeKeyCode(this.keys, key, newCode);
};

// Sets all of this.keyDown to false.
Mouse.prototype.resetKeyDown = function(){
  InputDevice.prototype.resetKeyObject(this.keyDown);
};

// TODO: For waaaaayyyy later.
function Gamepad(){};
