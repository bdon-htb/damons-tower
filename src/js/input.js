/**
 * input.js contains any code that involves input devices.
 * keyboard key assignment goes here.
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
  // this.inputDevices.set("controller", new Controller());
};

InputManager.prototype.captureInputs = function(clearFirst=true){
  if (clearFirst === true) {
    this.clearEvents();
  };
  this.inputDevices.forEach((device) => {
    this.events.set(device, device.captureInputs())
  });
};

InputManager.prototype.clearEvents = function(){
  this.events.clear();
};

function Keyboard(){
  // An object of valid keys and their corresponding key code.
  this.defaultKeys = {
    up:87, // W
    down:83, // S
    left:65, // A
    right:68 // D
  };

  this.keys;
  this.setToDefaultKeys();

  // An object of valid keys and whether the keydown event for them has been triggered.
  this.keydown = {};
  // Apologize for the naming. This oneliner basically sets this.keydown = this.keys
  // but instead of keycodes, it's set to false.
  let objKeys = Object.keys(this.keys);
  objKeys.forEach((objKey) => this.keydown[objKey] = false);
};

Keyboard.prototype.captureInputs = function(){
  return Object.assign({}, this.keydown); // Return a copy of the current state of keydown.
}
Keyboard.prototype.addListeners = function(element){
  element.addEventListener('keydown', this.keyDownHandler.bind(this), false);
  element.addEventListener('keyup', this.keyUpHandler.bind(this), false);
};

Keyboard.prototype.removeListeners = function(element){
  element.removeEventListener('keydown', this.keyDownHandler.bind(this), false);
  element.removeEventListener('keyup', this.keyUpHandler.bind(this), false);
};

// Key handle function; key DOWN handler by default.
// If keyDown is false it will be treated as a key UP handler.
Keyboard.prototype.keyHandler = function(event, keyDown=true){
  for (const [key, code] of Object.entries(this.keys)){
    if(event.keyCode == code){
      this.keydown[key] = keyDown;
    };
  };
};

Keyboard.prototype.keyDownHandler = function(event){
  this.keyHandler(event);
};

Keyboard.prototype.keyUpHandler = function(event){
  this.keyHandler(event, false);
};

// Sets this.key to the default keys defined.
Keyboard.prototype.setToDefaultKeys = function(){
  // Create a copy of the default keys.
  this.keys = Object.assign(this.defaultKeys);
};

// Sets all of this.keyDown to false.
Keyboard.prototype.resetKeyDown = function(){
  keys = Object.keys(this.keydown);
  keys.forEach((key) => this.keydown.key = false);
};

// Will worry about these later.
function Mouse(){};
function Controller(){};
