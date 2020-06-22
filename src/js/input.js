/**
 * input.js contains any code that involves input devices.
 * keyboard key assignment goes here.
*/

function InputManager(parent){
  this.parent = parent;
  this.events = new Map();
  this.inputDevices = new Map();
};

InputManager.prototype.addDevices = function(){
  this.inputDevices.set("keyboard", new Keyboard());
  // this.inputDevices.set("controller", new Controller());
};

InputManager.prototype.captureInputs = function(events, clearFirst=true){
  if (clearFirst === true) {
    this.clearEvents();
  };
  this.inputDevices.forEach((device) => {
    this.events.set(device, device.captureInputs(events))
  });
};

InputManager.prototype.clearEvents = function(){
  this.events.clear();
}

function Keyboard = function(){
  // An object of valid keys and their corresponding key code.
  this.defaultKeys = {
    up:87, // W
    down:83, // S
    left:65, // A
    right:68 // D
  };

  this.keys;
  this.setDefaultKeys();

  // An object of valid keys and whether the keydown event for them has been triggered.
  this.keydown = {
    up:false,
    down:false,
    left:false,
    right:false
  };
};

Keyboard.prototype.addListeners = function(element){
  element.addEventListener('keydown', this.keyDownHandler, false);
  element.addEventListener('keyup', this.keyUpHandler, false);
};

Keyboard.prototype.removeListeners = function(element){
  element.removeEventListener('keydown', this.keyDownHandler, false);
  element.removeEventListener('keyup', this.keyUpHandler, false);
};

Keyboard.prototype.keyDownHandler = function(event){
  if(event.keyCode == this.keys.up){
    this.keydown.up = true;
  } else if(event.keyCode == this.keys.down){
    this.keydown.down = true;
  };
  if(event.keyCode == this.keys.left){
    this.keydown.left = true;
  } else if(event.keyCode == this.keys.right){
    this.keydown.right = true;
  };
};

Keyboard.prototype.keyUpHandler = function(event){
  if(event.keyCode == this.keys.up){
    this.keydown.up = false;
  } else if(event.keyCode == this.keys.down){
    this.keydown.down = false;
  };
  if(event.keyCode == this.keys.left){
    this.keydown.left = false;
  } else if(event.keyCode == this.keys.right){
    this.keydown.right = false;
  };
};

// Sets this.key to the default keys defined.
Keyboard.prototype.setDefaultKeys = function(){
  this.keys = Array.from(this.defaultKeys);
}

// Sets all of this.keyDown to false.
Keyboard.prototype.resetKeyDown = function(){
  keys = Object.keys(this.keydown);
  keys.forEach((key) => this.keydown.key = false);
}

// Will worry about this later.
function Controller(){};
