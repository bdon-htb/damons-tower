/**
 * gui.js contains all code involving the GUI layer objects.
*/

/**
 * Handles the parsing of menu xml information, and calculations
 * like gui object positioning.
 * To be attached to the engine directly.
*/
function GUIManager(parent){
  this.parent = parent;

  // Borrow some methods from the Engine.
  this.getXMLChildren = parent.getXMLChildren;
  this.getXMLAttributes = parent.getXMLAttributes;
};

// Return True if the mouse is hovering over a gui object.
GUIManager.prototype._mouseOverGUIObject = function(mouse, guiObject){
  let engine = this.parent;
  let rect = new Rect([guiObject.x, guiObject.y], guiObject.width, guiObject.height);
  return engine.pointInRect(mouse.x, mouse.y, rect);
};

// Note to self: If I ever implement other layouts, objects will need to be positioning.
GUIManager.prototype._createGUIObject = function(objectTag){
  let objectAttributes = this.getXMLAttributes(labelTag);

  let x = objectAttributes.has("x") ? Number(objectAttributes.get("x")) : 0;
  let y = objectAttributes.has("y") ? Number(objectAttributes.get("y")) : 0;
  let width = objectAttributes.has("width") ? Number(objectAttributes.get("width")) : 0;
  let height = objectAttributes.has("height") ? Number(objectAttributes.get("height")) : 0;

  // We remove the essential attributes from map to avoid redundancies.
  objectAttributes.delete("x");
  objectAttributes.delete("y");
  objectAttributes.delete("width");
  objectAttributes.delete("height");

  return new GUIObject(x, y, width, height, objectAttributes);
};

GUIManager.prototype._createLabel = function(labelTag){
  let createFunc = this._createGUIObject.bind(this);
  let parentObj = createFunc(labelTag);
  let parentAttributes = parentObj.attributes

  let text = parentAttributes.has("text") ? parentAttributes.get("text") : "";
  parentAttributes.delete("text");

  return new Label(parentObj, text);
};

GUIManager.prototype._createButton = function(buttonTag){
  let createFunc = this._createLabelObject.bind(this);
  let parentObj = createFunc(buttonTag);
  let parentAttributes = parentObj.attributes

  let callback = parentAttributes.has("callback") ? parentAttributes.get("callback") : null;
  parentAttributes.delete("callback");

  return new Button(parentObj, callback);
};

// Return an array of all gui objects in the menu.
GUIManager.prototype._createGUIObjects = function(menuTag){
  let guiObjectArray = []

  for(const child of menuTag.children){
    let guiObjectName = child.tagName;
    let createFunc;
    let guiObject;

    switch (guiObjectName) {
      case "label":
        createFunc = this._createLabel.bind(this)
        break;
      case "button":
        createFunc = this._createButton.bind(this)
        break;
      default:
        console.error(`Invalid gui object tag detected. tagName: ${guiObjectName}`);
    };

    guiObject = createFunc(child);
    guiObjectArray.push(guiObject);
  };

  return guiObjectArray;
};

// Parse menu data and return menu object based on it.
// data is a XMLDocument object.
GUIManager.prototype.createMenuFromData = function(data){
  let createGUIObjectsFunc = this._createGUIObjects.bind(this);

  let fileTag = data.children[0];
  let fileChildren = this.getXMLChildren(fileTag);

  let headerTag = fileChildren.get("header");
  let fileSettings = this.getXMLChildren(headerTag);

  let menuName = fileSettings.get("name").innerHTML;
  let layoutTag = fileSettings.get("layout")
  let menuLayoutType = layoutTag.innerHTML;
  let menuLayoutSettings = this.getXMLAttributes(layoutTag);

  let menuTag = fileChildren.get("menu");
  let menuGUIObjects = createGUIObjectsFunc(menuTag);

  let menu = new Menu(menuName, menuLayoutType, menuLayoutSettings, menuGUIObjects);
  return menu
};

GUIManager.prototype.executeCallback = function(entity){
  let callbackName = entity.callback;
  let callback = this.parent.callbacks[callbackName];
  if(callback !== undefined){
    callback();
  } else console.error(`Error executing callback: ${callName} is not a valid callback.`);
};

// Mouse event for whenever it moves.
/*
Will probably need this once I decide to implement hover functionality for buttons.
GUIManager.prototype.checkHover = function(menu){
  let engine = this.parent;
  let hoverCheckFunc = this._mouseInButton.bind(this);
  let mouse = engine.getInputDevice("mouse");

  for(const guiObject of menu.guiObjects){
    ... do stuff...
  };
};
*/

// Mouse event for whenever a click is detected
GUIManager.prototype.checkClicks = function(menu){
  let engine = this.parent;
  let hoverCheckFunc = this._mouseInButton.bind(this);
  let inputs = engine.getInputEvents();
  let mouse = engine.getInputDevice("mouse");

  if(inputs.get("mouse").includes("leftClick")){
    for(const guiObject of menu.guiObjects){
      if(guiObject.constructor === Button && hoverCheckFunc(mouse, button) === true){
        this.executeCallback(guiObject);
        break;  // I'm going to assume that only one button will be clicked at a time.
      };
    };
  };
};

/**
 * Menu class represents a single instance of a menu.
 * Will contain gui objects and layout information.
*/
function Menu(name, layoutType, layoutSettings, guiObjects){
  this.name = name;
  this.layoutType = layoutType;
  this.layoutSettings = layoutSettings;
  this.guiObjects = [];
  this.graphic;
}

/**
 * Parent class for all gui objects.
 * attibutes is a Map of all "non-essential" tag attributes.
 * for "child" gui objects, we pass an instance of their "parent"
 * class as the first argument so they can inherit its content.
*/
function GUIObject(x, y, width, height, attributes){
  this.x = x;
  this.y = y;
  this.width = width;
  this.height = height;
  this.attributes = attributes;
};

function Label(guiObject, text){
  this.assign(this, guiObject);
  this.text = text;
};

function Button(labelObject, callback){
  this.assign(this, labelObject);
  this.callback = callback;
};
