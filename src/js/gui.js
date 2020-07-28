/**
 * gui.js contains all code involving the GUI layer objects.
*/

/**
 * A menu class.
 * Parent = Engine. The engine must be passed so the Menu can access necessary
 * xml methods during parsing.
*/
function Menu(parent, data){
  this.parent;
  this.name;
  this.layout;
  this.entities = new Map();

  // Borrow some methods from the Engine.
  this.getXMLChildren = parent.getXMLChildren;
  this.getXMLAttributes = parent.getXMLAttributes;

  // A map of all accept menu entities/object type and their equivalent setter function.
  this.validEntities = new Map();
  this._setValidEntities();

  this.parseData(parent, data);
};

// Takes in an xml file and changes the menu object accordingly.
Menu.prototype.parseData = function(parent, data){
  let getXMLChildren = this.getXMLChildren;

  let fileTag = data.children[0];
  let fileChildren = getXMLChildren(fileTag);

  let headerTag = fileChildren.get("header");
  let fileSettings = getXMLChildren(headerTag);
  let layout = fileSettings.get("layout").innerHTML;
  this.setLayout(layout, fileSettings);

  let menuTag = fileChildren.get("menu");
  this.setEntities(menuTag);
  console.log(this.layout.cells)
};

// Add an object to this.entities; accepts a list of objects or a single object.
Menu.prototype.addEntity = function(entity){
  if(typeof entity === "array"){
    entity.forEach(e => this.entities.set(entity.id, entity));
  } else if(entity === undefined){
    console.error(`Tried adding an undefined object to the menu! Menu name: ${this.name}`);
  } else this.entities.set(entity.id, entity);
};

Menu.prototype.setLayout = function(layoutName, settings){
  switch(layoutName){
    case "gridLayout":
      let gridInfo = this.getGridSettings(settings);
      this.layout = new GridLayout(this, gridInfo["rows"], gridInfo["cols"]);
      break;
    default:
      console.error(`The menu layout is invalid! Layout value: ${layout}. Detected settings: ${settings}`);
  };
};

// Get the number of rows and columns in the menu's header.
// Precondition: Menu.layout.type === "gridLayout"
Menu.prototype.getGridSettings = function(headerSettings){
  let rows = headerSettings.get("rows").innerHTML;
  let cols = headerSettings.get("cols").innerHTML;
  let gridSettings = {"rows": Number(rows), "cols": Number(cols)};

  // Error handling.
  for(const [key, value] of Object.entries(headerSettings)){
    if(value === undefined){
      console.error(`Error while loading gridlayout settings! ${key} is undefined.`);
    };
  };
  return gridSettings;
};

Menu.prototype.setEntities = function(menuTag){
  let validEntities = this.validEntities;
  let menuChildren = menuTag.children;
  let entityCount = 0; // Keeps track of the number of entities; Is also used for default map keys.
  let setFunc;

  for(const child of menuChildren){
    let entityType = child.tagName;
    let id = (child.id.length > 0) ? child.id : (`${entityType} e:${entityCount}`);
    if(validEntities.has(entityType) === true){
      setFunc = validEntities.get(entityType); // Fire off the associated entity setter function.
      setFunc(id, child);
    } else {
      console.error(`Error while setting Menu entities: ${entityType} is an invalid Menu object.`);
    };
    console.log(id)
    entityCount++;
  };
};

// TODO: Implement these.
Menu.prototype.setLabel = function(id, label){
  let getXMLChildren = this.getXMLChildren;
  let getXMLAttributes = this.getXMLAttributes;

  let labelSettings = getXMLChildren(label);
  let labelAttributes = getXMLAttributes(label);

  let labelText;
  let labelStyle;

  labelText = this._getChildTag(labelSettings, "text", id);
  labelStyle = this._getAttribute(labelAttributes, "style", objectName=id);

  // Create label.
  let labelObject = new Label(id, labelText, labelStyle);

  // Add to menu.
  this.addEntity(labelObject);
  this.addToLayout(labelObject, labelAttributes);

};

Menu.prototype.setButton = function(id, button){
  let getXMLChildren = this.getXMLChildren;
  let getXMLAttributes = this.getXMLAttributes;

  let buttonSettings = getXMLChildren(button);
  let buttonAttributes = getXMLAttributes(button);

  let buttonText;
  let buttonStyle;
  let buttonCallBack;

  buttonText = this._getChildTag(buttonSettings, "text", id);
  buttonStyle = this._getAttribute(buttonAttributes, "style", objectName=id);
  buttonCallBack = this._getChildTag(buttonSettings, "callback").innerHTML;

  // Create button.
  let buttonObject = new Button(id, buttonText, buttonCallBack, buttonStyle);
  this.addEntity(buttonObject);
  this.addToLayout(buttonObject, buttonAttributes);
};

Menu.prototype.addToLayout = function(entity, attributes){
  let addToLayoutFunc;
  switch(this.layout.type){
    case "gridLayout":
      addToLayoutFunc = this._addToGridLayout.bind(this);
      break;
  };

  addToLayoutFunc(entity, attributes);
};

Menu.prototype._setValidEntities = function(){
  this.validEntities.set("label", this.setLabel.bind(this));
  this.validEntities.set("button", this.setButton.bind(this));
};

Menu.prototype._addToGridLayout = function(entity, attributes){
  let row = attributes.get("row");
  let col = attributes.get("col");

  // Error handling.
  if(row === undefined || col === undefined){
    console.error(`Row and column data for label is invalid! Label id: ${id}. Label: ${label}.`)
  };

  this.layout.addToCell(row, col, entity);
};

// Shorthand function that includes error handling.
// Get the specified child tag from a map of child tags.
// objectName is just an optional parameter for the error message.
Menu.prototype._getChildTag = function(children, name, objectName="Object"){
  if(children.has(name)){
    return children.get(name);
  } else console.error(`${objectName} is missing required ${name} tag!`);
};

// attributes is a map of xml attributes.
Menu.prototype._getAttribute = function(attributes, name, defaultAttribute="default", objectName="Object", required=false){
  if(attributes.has(name)){
    return attributes.get(name);
  } else {
    if(required === true){
      console.error(`${objectName} is missing required ${name} attribute!`)
    } else return defaultAttribute;
  };
};
function Cell(row, col, entities=[]){
  this.row = row;
  this.col = col;
  this.entities = entities;
};

Cell.prototype.addEntity = function(entity){
  this.entities.push(entity);
};

// TODO: Write up an algorithm to set the precise coordinates of the objects.
function GridLayout(parent, rows, columns){
  this.type = "gridLayout"
  this.menu = parent; // parent menu.
  this.rows = rows; // number of rows.
  this.cols = columns; // number of columns
  this.cells = []; // grid cell data.
  this._fillOutCells();
};

// Sets/updates the position of all entities in the menu.
GridLayout.prototype.setAllPositions = function(){
  this.cells.forEach(e => this.setPositions(cell));
};

// Untested.
// Sets/updates the position of all entities in a specified cell.
GridLayout.prototype.setPositions = function(cell){
  let windowWidth = this.menu.parent.windowWidth;
  let windowHeight = this.menu.parent.windowHeight;
  let predSize = {width: 0, height: 0}; // Size of the entity preceding the current entity.

  for(let index = 0; index < cell.entities.length; index++){
    let entity = cell.entities[index];
    if(index > 0){
      let e = cell.entities[index - 1];
      predSize["width"] = e.width;
      predSize["height"] = e.height;
    };
    entity.x = (windowWidth / this.rows) * cell.row + predSize["width"];
    entity.y = (windowHeight / this.cols) * cell.col + predSize["height"];
  };
};

// TODO: Calculate the size of a gui object based on its properties.
GridLayout.prototype.calculateSize = function(){};

GridLayout.prototype.getCell = function(row, col){
  let cellID = Number(row) * this.rows + Number(col);
  return this.cells[cellID];
};

GridLayout.prototype._fillOutCells = function(){
  let convertIndexToCoords = this.menu.parent.convertIndexToCoords;
  for(let step = 0; step < this.rows * this.cols; step++){
    let posArray = convertIndexToCoords(step, this.rows);
    this.cells.push(new Cell(posArray[0], posArray[1]));
  };
};

GridLayout.prototype.addToCell = function(row, col, entity){
  let cell = this.getCell(row, col);
  cell.addEntity(entity);
}

function GUIObject(id){
  this.id = id;
  this.x;
  this.y
  this.width;
  this.height;
  this.attributes = new Map();
};

function Label(id, text, style="default"){
  GUIObject.call(id);
  this.text = text;
  this.textStyle = style;
};

// TODO: Make a callback system for buttons in engine.js
// basically have keys that associate with methods.
// the button callback will refer to one of these keys.
function Button(id, text, callback, textStyle="default"){
  Label.call(id, text, textStyle)
  this.callback = callback;
  this.bgColour;
  this.borderColour;
};
