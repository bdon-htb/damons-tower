/**
 * gui.js contains all code involving the GUI layer objects.
*/

/**
 * A menu class.
 * Parent = Engine. The engine must be passed so the Menu can access necessary
 * xml methods during parsing.
*/
function Menu(parent, data){
  this.parent
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

  if(labelSettings.has("text")){
    labelText = labelSettings.get("text");
  } else console.error(`Label is missing required text tag! Label id: ${id}. Label: ${label}.`);

  labelStyle = (labelAttributes.has("style") === true) ? labelAttributes.get("style") : "default";

  // Create label.
  let labelObject = new Label(id, labelText, labelStyle);

  // Add to menu.
  this.addEntity(labelObject);
  this.addToLayout(labelObject, labelAttributes);

};

Menu.prototype.setButton = function(id, label){
  console.log("I, THE BUTTON SETTER WORK :D")
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

function Cell(){
  this.entities = [];
};

Cell.prototype.addEntity = function(entity){
  this.entities.push(entity);
};


function GridLayout(parent, rows, columns){
  this.type = "gridLayout"
  this.parent = parent; // parent menu.
  this.rows = rows; // number of rows.
  this.columns = columns; // number of columns
  this.cells = []; // grid cell data.
  this._fillOutCells();
};

GridLayout.prototype.getCell = function(row, col){
  let cellID = Number(row) * this.rows + Number(col);
  return this.cells[cellID];
};

GridLayout.prototype._fillOutCells = function(){
  for(let step = 0; step < this.rows * this.columns; step++){
    this.cells.push(new Cell());
  };
};

GridLayout.prototype.addToCell = function(row, col, entity){
  let cell = this.getCell(row, col);
  cell.addEntity(entity);
}

function Label(id, text, style="default"){
  this.id = id;
  this.text = text;
  this.textStyle = style;
  this.x;
  this.y;
  this.attributes = new Map();
};

function Button(id, text, callback, style="default"){
  this.id = id;
  this.text = text;
  this.callback = callback;
  this.textStyle = style;
  this.x;
  this.y;
  this.attributes = new Map();
  this.bgColour;
  this.borderColour;
};
