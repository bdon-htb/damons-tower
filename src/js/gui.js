/**
 * gui.js contains all code involving the GUI layer objects.
*/

/**
 * A menu class.
 * Parent = Engine. The engine must be passed so the Menu can access necessary
 * xml methods during parsing.
*/
function Menu(parent, data){
  this.parent = parent;
  this.name;
  this.layout;
  this.entities = new Map();
  this.attributes = new Map();
  this._hasButtons = false;

  // Borrow some methods from the Engine.
  this.getXMLChildren = parent.getXMLChildren;
  this.getXMLAttributes = parent.getXMLAttributes;
  // Moved these over to Engine cause they seemed pretty general.
  this._getChildTag = parent.getXMLChildTag;
  this._getAttribute = parent.getXMLAttribute;

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
  this.name = fileSettings.get("name").innerHTML;

  let menuTag = fileChildren.get("menu");
  this.setEntities(menuTag);
  this.attributes = this.getXMLAttributes(menuTag);
  this._hasButtons = this.hasObject(Button);
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

  labelText = this._getChildTag(labelSettings, "text", id).innerHTML;
  labelStyle = this._getAttribute(labelAttributes, "style", objectName=id).innerHTML;

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

  buttonText = this._getChildTag(buttonSettings, "text", id).innerHTML;
  buttonStyle = this._getAttribute(buttonAttributes, "style", objectName=id).innerHTML;
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

// Calculate the size of a gui object based on its properties.
Menu.prototype.calculateEntitySize = function(entity){
  let renderer = this.parent.renderer;
  switch(entity.constructor){
    case Label:
      return renderer.calculateTextSize(entity.text, entity.textStyle);
    case Button:
      let dimensions = renderer.calculateTextSize(entity.text, entity.textStyle);
      return [dimensions[0] * 2, dimensions[1] * 2];
    default:
      console.error(`Could not calculate the size of ${entity}.`);
  };
};

Menu.prototype.setSize = function(entity){
  let size = this.calculateEntitySize(entity);
  entity.width = size[0];
  entity.height = size[1];
};

// TODO: Make brackets look cleaner somehow. It's annoying me.
Menu.prototype.checkClicks = function(){
  let engine = this.parent;
  let inputs = engine.getInputEvents();
  let pointInRect = engine.pointInRect;
  let mouse = engine.getInputDevice("mouse");

  if(inputs.size > 0 && this._hasButtons === true){
    for(const [id, entity] of this.entities.entries()){
      if(entity.constructor === Button && this._mouseInButton(mouse, entity) === true){
        this.executeCallback(entity);
        break; // Assumes that only one button can be clicked at a time.
      };
    };
  };
};

Menu.prototype.executeCallback = function(entity){
  let callName = entity.callback;
  let callback = this.parent.callbacks[callName];
  if(callback !== undefined){
    callback();
  } else console.error(`Error executing callback: ${callName} is not a valid callback.`);
};

// Returns a bool.
Menu.prototype._mouseInButton = function(mouse, button){
  let engine = this.parent;
    // TODO: Make this more elaborate. Do the same for Renderer.prototype.drawButton.
  let rect = new Rect([button.x, button.y], button.width, button.height);
  return engine.pointInRect(mouse.x, mouse.y, rect);
};

// Check if the Menu has at least one occurrence of the specified gui type.
Menu.prototype.hasObject = function(constructor){
  for(const [id, entity] of this.entities.entries()){
    if(entity.constructor === constructor){return true};
  };
  return false;
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
    console.error(`Row and column data for label is invalid! Label id: ${id}. Label: ${label}.`);
  };
  this.layout.addToCell(row, col, entity);
};

/**
 * Custom grid layout cell object. Contains no methods itself.
*/
function Cell(row, col, entities=[]){
  this.row = row;
  this.col = col;
  this.entities = entities;
  this.width = 0;
  this.height = 0;
  // These are topleft values.
  this.x = 0;
  this.y = 0;
};

/**
 * Custom grid layout class. Responsible for positioning and organizing entities
 * into cells.
 * The grid layout is split into smaller rectangles called cells.
 * Within the cells are references to gui entities. Currently GridLayout only
 * has a vertical stack behaviour within the cells.
*/
function GridLayout(parent, rows, columns, attributes=[]){
  this.type = "gridLayout"
  this.menu = parent; // parent menu.
  this.rows = rows; // number of rows.
  this.cols = columns; // number of columns
  this.cells = []; // grid cell data.
  this._createCells();
};

// Shorthand for sizing the cells, entities and setting their positions in one.
GridLayout.prototype.organize = function(){
  let entities = this.menu.entities;
  let setEntitySize = this.menu.setSize.bind(this.menu);
  entities.forEach(e => setEntitySize(e));
  this.sizeCells();
  this.setCellPositions();
  console.log(this.cells)
};

// Sets the sizes and position of all the cells.
GridLayout.prototype.sizeCells = function(){
  let convertIndexToCoords = this.menu.parent.convertIndexToCoords;
  let autofill = this.menu.attributes.has("autofill") ? Boolean(this.menu.attributes.get("autofill")) : false;

  // Initialize.
  let currRow = 0;
  let currCol = 0;
  let size;
  let posArray;
  let cell;

  // First calculate the size of every cell.
  this.cells.forEach(cell => {
    let size = this.calculateCellSize(cell);
    this.setCellSize(size, cell);
  });

  if(autofill === true){
    // Needs to be <= to account for last row.
    // TODO: Last row not working.
    for(let index = 0; index <= this.cells.length; index++){
      posArray = convertIndexToCoords(index, this.rows);

      // If autofill is on and moving onto next row...
      if(posArray[0] > currRow){
        this.autoFill("row", currRow);
      };

      // If on last row.
      if(posArray[0] === this.rows - 1){
        this.autoFill("col", posArray[1]);
      };

      // Update position trackers.
      currRow = posArray[0];
      currCol = posArray[1];
    };
  };
};

// Set the x and y coordinates of all the cells.
GridLayout.prototype.setCellPositions = function(){
  let convertIndexToCoords = this.menu.parent.convertIndexToCoords;
  let convertCoordsToIndex = this.menu.parent.convertCoordsToIndex;
  let windowWidth = this.menu.parent.windowWidth;

  let x;
  let y;
  let currRow = 0;
  let currCol = 0;
  let cell;
  let row;
  let col;

  let cellAbove; // Cell above the current cell.
  let cellAboveIndex;

  let cellLeftOf; // Cell to the right of current cell.
  let cellLeftOfIndex;

  for(let index = 0; index < this.cells.length; index++){
    cell = this.cells[index]; // Current cell.
    posArray = convertIndexToCoords(index, this.rows); // Grid position of the current cell.
    row = posArray[0];
    col = posArray[1];

    if(row > 0){
      cellAboveIndex = convertCoordsToIndex(row - 1, col, this.rows);
      cellAbove = this.cells[cellAboveIndex];
      y = cellAbove.y + cellAbove.height;
    } else y = 0;

    if(col > 0){
      cellLeftOfIndex = convertCoordsToIndex(row, col - 1, this.rows);
      cellLeftOf = this.cells[cellLeftOfIndex];
      x = cellLeftOf.x + cellLeftOf.width;
    } else x = 0;

    cell.x = x;
    cell.y = y;
  };
};

GridLayout.prototype._fillCell = function(cell, fillAmount, property){
  if(property === "width" || property === "height"){
    cell[property] += fillAmount;
  } else console.error(`Cannot fill cell: ${cell}. ${property} is not the width or height.`);
};


GridLayout.prototype._getLineSum = function(lineOfCells, property){
  sum = 0;
  for(cell of lineOfCells){
    sum += cell[property];
  };
  return sum;
};

// Autofill the cells in a row / column.
// Precondition: lineType === "row" || lineType === "col".
// lineNum is just the row number / column number.
GridLayout.prototype.autoFill = function(lineType, lineNum){
  // Error handling.
  if(lineType !== "row" && lineType !== "col"){
    console.error(`Cannot fill cells in line ${lineNum}! ${lineType} is an invalid line type!`);
    return;
  };

  let engine = this.menu.parent;
  let fillCell = this._fillCell;
  let sum = 0; // Sum of width / height.
  let cellsInLine;
  let windowDimension;
  let cellDimension;
  let fillAmount;
  let totalUnits; // total columns or total rows.

  if(lineType === "row"){
    cellsInLine = engine.getRow(this.cells, lineNum, this.cols);
    cellDimension = "width";
    windowDimension = "windowWidth";
    totalUnits = this.cols
  } else { // Assume lineType === "col".
    cellsInLine = engine.getColumn(this.cells, lineNum, this.cols)
    cellDimension = "height";
    windowDimension = "windowHeight";
    totalUnits = this.rows
  };

  // Iterate through cells first to collect the total width / height.
  sum = this._getLineSum(cellsInLine, cellDimension);

  // Calculate fill width / height using any leftover free space.
  // Flooring typically means the cells will undershoot the window. So we must account for that later.
  fillAmount = Math.floor((engine[windowDimension] - sum) / cellsInLine.length);


  // If fillWidth is negative then there's going to be an overflow so don't bother filling :)
  if(fillAmount < 0){
    return;
  };

  // Iterate through cells again, but this time fill them.
  for(let cell of cellsInLine){
    // If last cell in the line being filled. compensate for undershoot.
    if(cell[lineType] === totalUnits - 1){
      // If fillWidth splits evenly then fillWidth should just end up being the same anyways.
      // Add any remaining space to last cell in row.
      fillAmount = (engine[windowDimension] - sum) + fillAmount;
    };
    fillCell(cell, fillAmount, cellDimension); // Fill the cell.
  };
};

GridLayout.prototype.getCell = function(row, col){
  let cellID = Number(row) * this.rows + Number(col);
  return this.cells[cellID];
};

GridLayout.prototype._createCells = function(){
  let engine = this.menu.parent;
  let convertIndexToCoords = engine.convertIndexToCoords;
  for(let step = 0; step < this.rows * this.cols; step++){
    let posArray = convertIndexToCoords(step, this.rows);
    this.cells.push(new Cell(posArray[1], posArray[0]));
  };
};

GridLayout.prototype.addToCell = function(row, col, entity){
  let cell = this.getCell(row, col);
  cell.entities.push(entity);
};

GridLayout.prototype.cellIsEmpty = function(cell){
  return cell.length === 0;
};

GridLayout.prototype.getCellSize = function(cell){
  return [cell.width, cell.height];
};

// Calculate the size of a cell. The size of the cell is determined
// by calculating the rect of all containing objects stacked on top of each
// other.
GridLayout.prototype.calculateCellSize = function(cell){
  let maxWidth = 0;
  let totalHeight = 0;

  for(const entity of cell.entities){
    maxWidth = Math.max(maxWidth, entity.width);
    totalHeight += entity.height;
  };
  return [maxWidth, totalHeight];
};

GridLayout.prototype.setCellSize = function(sizeArray, cell){
  cell.width = sizeArray[0];
  cell.height = sizeArray[1];
};

/**
 * Parent class for all gui objects.
*/
function GUIObject(id){
  this.id = id;
  this.x = 0;
  this.y = 0;
  this.width = 0;
  this.height = 0;
  this.attributes = new Map();
};

/**
 * Label gui object.
*/
function Label(id, text, style="default"){
  GUIObject.call(this, id);
  this.text = text;
  this.textStyle = style;
};

/**
 * Button gui object.
*/
function Button(id, text, callback, textStyle="default"){
  Label.call(this, id, text, textStyle)
  this.callback = callback;
  this.bgColour;
  this.borderColour;
};
