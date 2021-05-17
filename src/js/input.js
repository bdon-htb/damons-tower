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
  // FIll out this.keyDown and this.keyUp; Set all their key values to false.
  let objKeys = Object.keys(this.keys);
  objKeys.forEach(objKey => this.keyDown[objKey] = false);
  objKeys.forEach(objKey => this.keyUp[objKey] = false);
}

// Return an array of strings of all the currently triggered keys in the specified keyObject.
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
    up:"KeyW", // W
    down:"KeyS", // S
    left:"KeyA", // A
    right:"KeyD", // D
    space: "Space" // Space
  };

  InputDevice.call(this, "keyboard", defaultKeys);
  this.orderedKeyDown = []; // An array that keeps track of key presses in order.
};

Keyboard.prototype.updateKeyOrder = function(key, value){
  item = `keyDown-${key}`; // Construct input command.
  index = this.orderedKeyDown.indexOf(item)
  if(index > -1){
    this.orderedKeyDown.splice(index, 1); // Remove item from array if it's already in it.
  };

  if(value === true){
    this.orderedKeyDown.push(item);
  };
};

Keyboard.prototype.captureInputs = function(){
  // Side note: the reason why I didn't just output an array here is to keep the data neat for checking.
  let inputs = new Map()
  // inputs.set("keyDown", InputDevice.prototype.captureInputs(this.keyDown));
  inputs.set("keyDown", this.orderedKeyDown);
  inputs.set("keyUp", InputDevice.prototype.captureInputs(this.keyUp));

  if(inputs.get("keyDown").length === 0 && inputs.get("keyUp").length === 0){
    return []; // If there are no detected inputs, just return an empty list as usual.
  };

  if(inputs.get("keyUp").length > 0){
    let resetFunc = this.resetKeyObject.bind(this);
    resetFunc(this.keyUp); // Once captured, reset stored keyUps.
  };
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

// Sets the value of the specified boolean keyObject. i.e. keyDown or keyUp.
// type can either be "keyDown" or "keyUp"
Keyboard.prototype.keyHandler = function(event, type, value){
  let keyCode = event.code;
  let updateFunc = this.updateKeyOrder.bind(this)
  let keyObject = (type === "keyDown") ? this.keyDown : this.keyUp; // Assumes keyUp otherwise.
  for (const [key, code] of Object.entries(this.keys)){
    if(keyCode == code){
      keyObject[key] = value;
      if(type === "keyDown"){updateFunc(key, value)};
    };
  };
};

Keyboard.prototype.keyDownHandler = function(event){
  this.keyHandler(event, "keyDown", true); // log keyDown
  this.keyHandler(event, "keyUp", false); // reset equivalent keyUp
};

Keyboard.prototype.keyUpHandler = function(event){
  this.keyHandler(event, "keyUp", true); // log keyUp
  this.keyHandler(event, "keyDown", false); // reset equivalent keyUp
};

Keyboard.prototype.setToDefaultKeys = InputDevice.prototype.setToDefaultKeys.bind(this)

Keyboard.prototype.changeKeyCode = function(key, newCode){
  InputDevice.prototype.changeKeyCode(this.keys, key, newCode);
};

// Sets all to false.
Keyboard.prototype.resetKeyObject = function(keyObject){
  keys = Object.keys(keyObject);
  keys.forEach((key) => keyObject[key] = false);
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
  element.addEventListener("click", this.mouseClickHandler.bind(this, "leftClick"));
  element.addEventListener("auxclick", this.mouseClickHandler.bind(this, "rightClick"));
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
