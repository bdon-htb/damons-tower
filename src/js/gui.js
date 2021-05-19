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
  let horizontalRatio;
  let verticalRatio;
  // Account for fullscreen / screen resizing.
  if(engine.renderer.isFullscreen === true){
    let screenSize = engine.renderer.getScreenSize()
    horizontalRatio = (screenSize[0] / engine.windowWidth);
    verticalRatio = (screenSize[1] / engine.windowHeight);
  }
  else {
    horizontalRatio = engine.renderer.horizontalRatio;
    verticalRatio = engine.renderer.verticalRatio;
  };

  let scaledX = guiObject.x * horizontalRatio;
  let scaledY = guiObject.y * verticalRatio;
  let scaledWidth = guiObject.width * horizontalRatio;
  let scaledHeight = guiObject.height * verticalRatio;

  let rect = new Rect([scaledX, scaledY], scaledWidth, scaledHeight);
  return engine.pointInRect(mouse.x, mouse.y, rect);
};

// Note to self: If I ever implement other layouts, objects will need to be positioning.
GUIManager.prototype._createGUIObject = function(objectTag){
  let objectAttributes = this.getXMLAttributes(objectTag);

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
  let createFunc = this._createLabel.bind(this);
  let parentObj = createFunc(buttonTag);
  let parentAttributes = parentObj.attributes

  let callback = parentAttributes.has("callback") ? parentAttributes.get("callback") : null;
  parentAttributes.delete("callback");

  return new Button(parentObj, callback);
};

GUIManager.prototype._createListWidget = function(listTag){
  let createFunc = this._createGUIObject.bind(this);
  let parentObj = createFunc(listTag);
  let listAttributes = parentObj.attributes
  let listItems = this._createAllGUIObjects(listTag);

  let orientation = listAttributes.get("orientation");
  if(["h", "v", "horizontal", "vertical"].includes(orientation) != true){
    orientation = "v";
    listAttributes.set("orientation", orientation);
  };

  let spaceBetween = listAttributes.has("spaceBetween") ? Number(listAttributes.get("spaceBetween")) : 0;

  // Overwrite listItems positions to reflect orientation.
  let nextX = parentObj.x;
  let nextY = parentObj.y;
  for(const item of listItems){
    item.x = nextX;
    item.y = nextY;

    if(["h", "horizontal"].includes(orientation) === true){
      nextX += item.width + spaceBetween;
    }
    else {
      // center-contents only applies for vertical orientations.
      if(listAttributes.get("justifyContents") === "center"){
        item.x -= item.width / 2
      };
      nextY += item.height + spaceBetween; // assume orientation is vertical.
    };
  };

  return new ListWidget(parentObj, listItems)
};

GUIManager.prototype._setGUIObjectGraphic = function(guiObject){
  let renderer = this.parent.renderer;
};

// Return an array of all gui objects in the menu.
// Initially designed for the menu, but can be used to fetch and create
// guiObjects for all children in a parentTag.
GUIManager.prototype._createAllGUIObjects = function(menuTag){
  let renderer = this.parent.renderer;
  let guiObjectArray = []

  for(const child of menuTag.children){
    let guiObjectName = child.tagName;
    let createFunc;
    let guiObject;

    switch (guiObjectName) {
      case "label":
        createFunc = this._createLabel.bind(this);
        break;
      case "button":
        createFunc = this._createButton.bind(this);
        break;
      case "list":
        createFunc = this._createListWidget.bind(this);
        break;
      default:
        console.error(`Invalid gui object tag detected. tagName: ${guiObjectName}`);
    };

    guiObject = createFunc(child);

    // Update dimensions if there were any graphical changes.
    let size = renderer.getEntitySize(guiObject)
    guiObject.width = size[0];
    guiObject.height = size[1];

    guiObjectArray.push(guiObject);
  };

  return guiObjectArray;
};


// Parse menu data and return menu object based on it.
// data is a XMLDocument object.
GUIManager.prototype.createMenuFromData = function(data){
  let createAllGUIObjectsFunc = this._createAllGUIObjects.bind(this);

  let fileTag = data.children[0];
  let fileChildren = this.getXMLChildren(fileTag);

  let headerTag = fileChildren.get("header");
  let fileSettings = this.getXMLChildren(headerTag);

  let menuName = fileSettings.get("name").innerHTML;
  let layoutTag = fileSettings.get("layout")
  let menuLayoutType = layoutTag.innerHTML;
  let menuLayoutSettings = this.getXMLAttributes(layoutTag);

  let menuTag = fileChildren.get("menu");
  let menuGUIObjects = createAllGUIObjectsFunc(menuTag);

  let menu = new Menu(menuName, menuLayoutType, menuLayoutSettings, menuGUIObjects);
  return menu
};

GUIManager.prototype.executeCallback = function(entity){
  let callbackName = entity.callback;
  let callback = this.parent.callbacks[callbackName];
  if(callback !== undefined){
    callback();
  } else console.error(`Error executing callback: ${callbackName} is not a valid callback.`);
};

// Mouse event for whenever it moves.
GUIManager.prototype.checkHover = function(widget){
  let engine = this.parent;
  let hoverCheckFunc = this._mouseOverGUIObject.bind(this);
  let recursiveFunc = this.checkHover.bind(this);
  let mouse = engine.getInputDevice("mouse")

  switch (widget.constructor) {
    case Menu:
      for(const guiObject of widget.guiObjects){
        recursiveFunc(guiObject)
      };
      break;
    case Button:
      if(hoverCheckFunc(mouse, widget) === true){
        widget.state = "hover"
      } else widget.state = "default";
      break;
    case ListWidget:
      for(const listItem of widget.listItems){
        recursiveFunc(listItem);
      };
  };
};

// Mouse event for whenever a click is detected
GUIManager.prototype.checkClicks = function(widget){
  let engine = this.parent;
  let hoverCheckFunc = this._mouseOverGUIObject.bind(this);
  let recursiveFunc = this.checkClicks.bind(this);
  let inputs = engine.getInputEvents();

  if(inputs.get("mouse").includes("leftClick")){
    let mouse = engine.getInputDevice("mouse");

    switch (widget.constructor) {
      case Menu:
        for(const guiObject of widget.guiObjects){
          recursiveFunc(guiObject)
        };
        break;
      case Button:
        if(hoverCheckFunc(mouse, widget) === true){this.executeCallback(widget)};
        break;
      case ListWidget:
        for(const listItem of widget.listItems){
          recursiveFunc(listItem);
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
  this.guiObjects = guiObjects;
};

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
  this.state = "default"
};

function Label(guiObject, text){
  Object.assign(this, guiObject);
  this.text = text;
};

function Button(labelObject, callback){
  Object.assign(this, labelObject);
  this.callback = callback;
};

function ListWidget(guiObject, listItems){
  Object.assign(this, guiObject);
  this.listItems = listItems;
};

/**
 * Custom button style class for guis.
 * styleObj is an optional object parameter to add / overwrite
 * the default properties.
*/
function ButtonStyle(styleObj){
  this.color = "0xFFBF75";
  this.borderColor = "0xCA826C";
  this.borderThickness = 2;
  this.alpha = 1;

  if(styleObj !== undefined){
    Object.assign(styleObj)
  };
};

/**
 * A special menu type used specifically for debugging purposes.
*/
function DebugMenu(parent){
  Menu.call(this, "debugMenu", "floatLayout", new Map(), []);

  this.parent = parent;
  this.debugVariables = new Map();
  this.textStyle = "debug"
  this.topLeft = [700, 0];

  let titleLabel = this._createLabel("Debug Display", "debug")
  titleLabel.x = this.topLeft[0]
  titleLabel.y = this.topLeft[1]
  this.guiObjects.push(titleLabel);
};

DebugMenu.prototype.removeVariable = function(varName){
  if(this.debugVariables.has(varName) === true){
    let nameLabel = this.debugVariables.get(varName)[0];
    let valueLabel = this.debugVariables.get(varName)[1];

    // Remove objects.
    this.guiObject.splice(this.guiObjects.indexOf(nameLabel), 1);
    this.guiObject.splice(this.guiObjects.indexOf(valueLabel), 1);
    this.debugVariables.delete(varName);
  };

  // Update positions.
  this.organize();
};

DebugMenu.prototype.clear = function(){
  this.guiObjects = [];
  this.debugVariables.clear();
};

// TODO: Implement.
// This function both sets and updates rows.
DebugMenu.prototype.updateVariable = function(varName, varValue){

  if(this.parent.debugModeOn === true){
    // If varName exists, update valueLabel.
    if(this.debugVariables.has(varName) === true){
      let valueLabel = this.debugVariables.get(varName)[1];
      valueLabel.text = String(varValue);
      this._updateSize(valueLabel);
    }
    else {
      // Create object.
      let nameLabel = this._createLabel(varName + ":");
      let valueLabel = this._createLabel(varValue);

      // Add gui objects.
      this.guiObjects.push(nameLabel);
      this.guiObjects.push(valueLabel);
      this.debugVariables.set(varName, [nameLabel, valueLabel]);

      // Update positions.
      this.organize();
    };
  };
};

DebugMenu.prototype._createLabel = function(text, textStyle=this.textStyle){
  let labelAttributes = new Map().set("style", textStyle);
  let label = new Label(new GUIObject(0, 0, 0, 0, labelAttributes), String(text));
  return label;
};

DebugMenu.prototype._updateSize = function(label){
  let renderer = this.parent.renderer;
  let textStyle = renderer.textStyles[label.attributes.get("style")];
  let textSize = renderer.calculateTextSize(label.text, textStyle);
  label.width = textSize[0];
  label.height = textSize[1];
};

// Repositions all items in gui.
// Should be safe to assume that if we ignore the title label,
// this.guiObjects.length should be a multiple of 2.
DebugMenu.prototype.organize = function(){
  let titleLabel = this.guiObjects[0];
  let spaceBetween = 15

  if(titleLabel.width === 0 || titleLabel.height === 0){
    this._updateSize(titleLabel);
  };

  let nextY = this.topLeft[1] + titleLabel.height;
  for(let i = 1; i < this.guiObjects.length; i += 2){

    this.guiObjects[i].x = this.topLeft[0];
    this.guiObjects[i].y = nextY;

    if(this.guiObjects[i].width === 0 || this.guiObjects[i].height === 0){
      this._updateSize(this.guiObjects[i]);
    };

    this.guiObjects[i + 1].x = this.guiObjects[i].x + this.guiObjects[i].width + spaceBetween;
    this.guiObjects[i + 1].y = nextY;

    if(this.guiObjects[i + 1].width === 0 || this.guiObjects[i + 1].height === 0){
      this._updateSize(this.guiObjects[i + 1]);
    };

    nextY += spaceBetween
  };
};
