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
  let listItems = this._createAllGUIObjects(listTag);
  return new ListWidget(parentObj, listItems);
};

GUIManager.prototype._positionListWidgetItems = function(listWidget){
  let listAttributes = listWidget.attributes;
  let listItems = listWidget.listItems;

  // Overwrite listItems positions to reflect orientation.
  let orientation = listAttributes.get("orientation");
  if(["h", "v", "horizontal", "vertical"].includes(orientation) != true){
    orientation = "v";
    listAttributes.set("orientation", orientation);
  };

  let spaceBetween = listAttributes.has("spaceBetween") ? Number(listAttributes.get("spaceBetween")) : 0;

  let nextX = listWidget.x;
  let nextY = listWidget.y;
  for(const item of listItems){
    if(item.constructor === Frame){continue};
    item.x = nextX;
    item.y = nextY;

    // center-contents only applies for vertical orientations.
    if(["v", "vertical"].includes(orientation) && listAttributes.get("justifyContents") === "center"){
      item.x -= item.width / 2
    }

    if(item.constructor === ListWidget){this._positionListWidgetItems(item)};

    if(["h", "horizontal"].includes(orientation) === true){
      nextX = item.x + item.width + spaceBetween;
    }
    else {
      nextY = item.y + item.height + spaceBetween; // assume orientation is vertical.
    };
    if(item.constructor === ArrowSelect){this._positionArrowSelectItems(item)};
  };
}

GUIManager.prototype._createFrame = function(frameTag){
  let createFunc = this._createGUIObject.bind(this);
  let parentObj = createFunc(frameTag);
  return new Frame(parentObj);
};

GUIManager.prototype._createImage = function(imageTag){
  let createFunc = this._createGUIObject.bind(this);
  let parentObj = createFunc(imageTag);
  let parentAttributes = parentObj.attributes;
  let spriteScale = parentAttributes.has("scale") ? Number(parentAttributes.get("scale")) : this.parent.spriteScale;
  parentAttributes.delete("scale");
  return new ImageWidget(parentObj, spriteScale);
};

GUIManager.prototype._createArrowSelect = function(frameTag){
  let renderer = this.parent.renderer;
  let createFunc = this._createGUIObject.bind(this);
  let parentObj = createFunc(frameTag);
  let parentAttributes = parentObj.attributes;
  // If I decide to add more arrowButton styles later, change this.
  parentAttributes.set("src", "arrowButton");
  let options = parentAttributes.has("options") ? Engine.prototype.convertStringToArray(parentAttributes.get("options")) : [];
  parentAttributes.delete("options");
  let optionsLoop = parentAttributes.has("optionsLoop") ? parentAttributes.get("optionsLoop") : "false";
  parentAttributes.delete("optionsLoop");
  widget = new ArrowSelect(parentObj, options, optionsLoop);
  if(optionsLoop === "false"){widget.leftBtn.state = "disabled"};
  return widget;
};

// probably some of the most scuffed code I've written in awhile.
// yes, I've effectively written the same code twice, the reason why I can't outright use
// this for createArrowSelectGraphic is because of how much the ordering matters and
// we don't know the size of pretty much anything until AFTER the graphic is made.
GUIManager.prototype._positionArrowSelectItems = function(arrowSelect){
  let leftBtn = arrowSelect.leftBtn;
  let rightBtn = arrowSelect.rightBtn;

  leftBtn.x = arrowSelect.x;
  leftBtn.y = arrowSelect.y;
  rightBtn.x = arrowSelect.x + arrowSelect.width - rightBtn.width;
  rightBtn.y = arrowSelect.y;

  for(const option of arrowSelect.options){
    option.x = arrowSelect.x + (arrowSelect.width / 2) - (option.width / 2);
    option.y = arrowSelect.y + (leftBtn.height / 2) - (option.height / 2) + 2;
  };
};


GUIManager.prototype.setWidgetFrames = function(widget){
  let renderer = this.parent.renderer;
  let iterator;
  switch (widget.constructor) {
    case Menu:
      iterator = widget.guiObjects;
      break;
    case ListWidget:
      iterator = widget.listItems;
      break;
    default:
      console.error(`widget with constructor ${widget.constructor} does not support frames!`)
  };

  // Pop frame widgets out of iterator and put them in widget.frames instead.
  // Performance wise, this is kinda a trash way of doing it but should only be called
  // once for each time a relevant widget is created.
  for(let i = 0; i < iterator.length; i++){
    let item = iterator[i];
    if(item.constructor === Frame){
      item.parentWidget = widget;
      renderer.setGUIGraphic(item);
      item.width = item.graphic.width;
      item.height = item.graphic.height;
      widget.frames.push(item);
      iterator.splice(i, 1);
    }
    else if(item.constructor === ListWidget){
      this.setWidgetFrames(item);
    };
  };
};

GUIManager.prototype.updateMenuGraphics = function(widget){
  let renderer = this.parent.renderer;
  let recursiveFunc = this.updateMenuGraphics.bind(this);
  switch(widget.constructor){
    case Menu:
      widget.frames.forEach(f => recursiveFunc(f));
      widget.guiObjects.forEach(o => recursiveFunc(o));
      break;
    case Label:
    case Frame:
      renderer.scale(widget.graphic);
      break;
    case ImageWidget:
      // There's probably a better way to do this but... whatever?
      widget.graphic.width = widget.graphic.texture.width * widget.spriteScale * renderer.horizontalRatio;
      widget.graphic.height = widget.graphic.texture.height * widget.spriteScale * renderer.verticalRatio;
      break;
    case ArrowSelect:
      widget.options.forEach(o => recursiveFunc(o));
      for(const btn of [widget.rightBtn, widget.leftBtn]){
        for(const graphicType of ["graphic", "disabledGraphic", "overlayGraphic", "pressedGraphic"]){
          btn[graphicType].width = btn[graphicType].texture.width * this.parent.spriteScale * renderer.horizontalRatio;
          btn[graphicType].height = btn[graphicType].texture.height * this.parent.spriteScale * renderer.verticalRatio;
        };
      };
      break;
    case Button:
      renderer.scale(widget.disabledGraphic);
      renderer.scale(widget.overlayGraphic);
      renderer.scale(widget.pressedGraphic);
      renderer.scale(widget.graphic);
      break;
    case ListWidget:
      widget.frames.forEach(f => recursiveFunc(f));
      widget.listItems.forEach(o => recursiveFunc(o));
  };
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
        createFunc = this._createLabel.bind(this, child);
        break;
      case "button":
        createFunc = this._createButton.bind(this, child);
        break;
      case "list":
        createFunc = this._createListWidget.bind(this, child);
        break;
      case "frame":
        createFunc = this._createFrame.bind(this, child);
        break;
      case "img":
        createFunc = this._createImage.bind(this, child);
        break;
      case "arrowSelect":
        createFunc = this._createArrowSelect.bind(this, child);
        break;
      default:
        console.error(`Invalid gui object tag detected. tagName: ${guiObjectName}`);
    };

    guiObject = createFunc();
    if(guiObjectName === "list"){this._positionListWidgetItems(guiObject)};

    // Set graphic size.
    // We set the graphics of the frames AFTER everything else in this.setWidgetFrames();
    if(guiObjectName != "frame"){
      renderer.setGUIGraphic(guiObject);
      guiObject.width = guiObject.graphic.width;
      guiObject.height = guiObject.graphic.height;
    };

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
  this.setWidgetFrames(menu);
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
      break;
    case ArrowSelect:
      for(const btn of [widget.leftBtn, widget.rightBtn]){
        if(btn.state != "disabled"){
          if(hoverCheckFunc(mouse, btn) === true){
            btn.state = "hover"
          } else btn.state = "default";
        };
      };
  };
};

// Mouse event for whenever a click is detected
GUIManager.prototype.checkPressesAndClicks = function(widget){
  let engine = this.parent;
  let hoverCheckFunc = this._mouseOverGUIObject.bind(this);
  let recursiveFunc = this.checkPressesAndClicks.bind(this);
  let inputs = engine.getInputEvents();

  let mouse = engine.getInputDevice("mouse");

  switch (widget.constructor){
    case Menu:
      for(const guiObject of widget.guiObjects){recursiveFunc(guiObject)};
      break;
    case Button:
      if(widget.state != "disabled" && hoverCheckFunc(mouse, widget) === true){
        let mouseEvents = inputs.get("mouse");
        if(mouseEvents.includes("keyDown-leftPress") === true){
          widget.state = "pressed";
        };
        if(mouseEvents.includes("leftClick") === true){this.executeCallback(widget)};
      };
      break;
    case ListWidget:
      for(const listItem of widget.listItems){recursiveFunc(listItem)};
      break;
    case ArrowSelect:
      let mouseEvents = inputs.get("mouse");
      let disabledIndex = [0, widget.options.length - 1];
      i = 0;
      const buttons = [widget.leftBtn, widget.rightBtn];
      for(const btn of buttons){
        if(btn.state != "disabled" && hoverCheckFunc(mouse, btn) === true){
          if(mouseEvents.includes("keyDown-leftPress") === true){
            btn.state = "pressed";
          };

          // Detect click while hovering over button.
          if(mouseEvents.includes("leftClick") === true){
            let incrementValue = (btn === widget.leftBtn) ? -1 : 1;
            widget.currentIndex += incrementValue;
            if((widget.optionsLoop === "false" && widget.currentIndex < 0)
            || (widget.optionsLoop === "true" && widget.currentIndex >= widget.options.length)){
              widget.currentIndex = 0
            }
            else if((widget.optionsLoop === "false" && widget.currentIndex >= widget.options.length)
            || (widget.optionsLoop === "true" && widget.currentIndex < 0)){
              widget.currentIndex = widget.options.length - 1;
            }
          };
        }
      };

    let btn;
    for(let i = 0; i < buttons.length; i++){
      btn = buttons[i];
      // Switched to index that disables current button.
      if(widget.optionsLoop === "false" && widget.currentIndex === disabledIndex[i]){
        btn.state = "disabled";
      }
      else if(btn.state === "disabled" && widget.currentIndex != disabledIndex[i]){
        btn.state = "default";
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
  this.frames = [];
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
  this.state = "default";
  this.graphic;
};

function Label(guiObject, text){
  Object.assign(this, guiObject);
  this.text = text;
};

function Button(labelObject, callback){
  Object.assign(this, labelObject);
  this.callback = callback;
  this.overlayGraphic;
  this.pressedGraphic;
  this.disabledGraphic;
};

function ListWidget(guiObject, listItems){
  Object.assign(this, guiObject);
  this.listItems = listItems;
  this.frames = [];
};

function Frame(guiObject){
  Object.assign(this, guiObject);
  this.parentWidget;
};

function ImageWidget(guiObject, spriteScale){
  Object.assign(this, guiObject);
  this.spriteScale = spriteScale;
};

function ArrowSelect(guiObject, options, optionsLoop){
  Object.assign(this, guiObject);
  this.currentIndex = 0; // Index of active option.
  this.options = options.map(e => new Label(guiObject, e));
  this.optionsLoop = optionsLoop;
  this.leftBtn = new Button(guiObject);
  this.rightBtn = new Button(guiObject);
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
    Object.assign(this, styleObj)
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
  this.topLeft = [0, 0];

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
