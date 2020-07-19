/**
 * gui.js contains all code involving the GUI layer objects.
*/

/**
 * A menu class.
*/
function Menu(name, layout, entities=[]){
  this.name = name;
  this.layout = layout;
  this.entities = [];
};

// Add an object to this.entities; accepts a list of objects or a single object.
Menu.prototype.addEntity(entity){
  if(typeof entity === "array"){
    entity.forEach(e => this.entities.push(e));
  } else if(entity === undefined){
    console.error(`Tried adding an undefined object to the menu! Menu name: ${this.name}`);
  } else this.entities.push(entity);
};

function GridLayout(parent, rows, columns){
  this.parent = parent; // parent menu.
  this.rows = rows; // number of rows.
  this.columns = columns; // number of columns
  this.cells = new Map(); // grid cell data.
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
