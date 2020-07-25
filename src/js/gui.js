/**
 * gui.js contains all code involving the GUI layer objects.
*/

/**
 * A menu class.
 * Parent = Engine. The engine must be passed so the Menu can access necessary
 * xml methods during parsing.
*/
function Menu(parent, data){
  this.name;
  this.layout;
  this.entities = new Map();

  // A map of all accept menu entities/object type and their equivalent setter function.
  this.validEntities = new Map();
  this._setValidEntities();

  this.parseData(parent, data);
};

// Takes in an xml file and changes the menu object accordingly.
Menu.prototype.parseData = function(parent, data){
  let getXMLChildren = parent.getXMLChildren;

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
    entity.forEach(e => this.entities.push(e));
  } else if(entity === undefined){
    console.error(`Tried adding an undefined object to the menu! Menu name: ${this.name}`);
  } else this.entities.push(entity);
};

Menu.prototype.setLayout = function(layout, settings){
  switch(layout){
    case "gridlayout":
      let gridInfo = this.getGridSettings(settings);
      this.layout = GridLayout(this, gridInfo["rows"], gridInfo["cols"]);
      break;
    default:
      console.error(`The menu layout is invalid! Layout value: ${layout}. Detected settings: ${settings}`);
  };
};

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
  console.log("I, THE LABEL SETTER WORK :D")
};

Menu.prototype.setButton = function(id, label){
  console.log("I, THE BUTTON SETTER WORK :D")
};

Menu.prototype._setValidEntities = function(){
  this.validEntities.set("label", this.setLabel);
  this.validEntities.set("button", this.setButton);
};

function GridLayout(parent, rows, columns){
  this.parent = parent; // parent menu.
  this.rows = rows; // number of rows.
  this.columns = columns; // number of columns
  this.cells = new Map(); // grid cell data.
};

function Label(id, text, style=undefined){
  this.id = id;
  this.text = text;
  this.textStyle = style;
  thix.x;
  this.y;
  this.attributes = new Map();
};

function Button(id, text, callback, style=undefined){
  this.id = id;
  this.text = text;
  this.callback = callback;
  this.textStyle = style;
  thix.x;
  this.y;
  this.attributes = new Map();
  this.bgColour;
  this.borderColour;
};
