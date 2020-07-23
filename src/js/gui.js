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

  this.parseData(parent, data);
};

// Takes in an xml file and changes the menu object accordingly.
Menu.prototype.parseData = function(parent, data){
  let getXMLChildren = parent.getXMLChildren;

  let fileTag = data.children[0];
  let fileChildren = getXMLChildren(fileTag);

  let headerTag = fileChildren.get("header");
  let settings = getXMLChildren(headerTag);
  let layout = settings.get("layout").innerHTML;
  this.setLayout(layout, settings)
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

  for(const [key, value] of Object.entries(headerSettings)){
    if(value === undefined){
      console.error(`Error while loading gridlayout settings! ${key} is undefined.`);
    };
  };
  return gridSettings;
};

function GridLayout(parent, rows, columns){
  this.parent = parent; // parent menu.
  this.rows = rows; // number of rows.
  this.columns = columns; // number of columns
  this.cells = new Map(); // grid cell data.
  console.log("SUCCESS!!")
  console.log(rows)
  console.log(columns)
};

function Label(text, style=undefined){
  this.text = text;
  this.textStyle = style;
  thix.x;
  this.y;
  this.attributes = new Map();
};

function Button(text, callback, style=undefined){
  this.text = text;
  this.callback = callback;
  this.textStyle = style;
  thix.x;
  this.y;
  this.attributes = new Map();
  this.bgColour;
  this.borderColour;
};
