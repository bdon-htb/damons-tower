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

  this._setLayoutMap();
  // Borrow some methods from the Engine.
  this.getXMLChildren = parent.getXMLChildren;
  this.getXMLAttributes = parent.getXMLAttributes;
};

// Creates this._allLayouts, which is a map that contains
// all valid layouts (string name and constructor)
// Useful accessing class constructors based on variables
GUIManager.prototype._setLayoutMap = function(){
  this._validLayouts = new Map();

  let layouts = [FloatLayout]
  layouts.forEach(l => {
    this._validLayouts.set(l.name.toLowerCase(), l)
  });
};

// Parse menu data and return menu object based on it.
// data is a XMLDocument object.
GUIManager.prototype.getMenuFromData = function(data){
  let getLayoutFunc = this.getLayoutFromData.bind(this);

  let fileTag = data.children[0];
  let fileChildren = this.getXMLChildren(fileTag);

  let headerTag = fileChildren.get("header");
  let fileSettings = getXMLChildren(headerTag);

  let menuLayout = getLayoutFunc(data);
  let menuName = fileSettings.get("name").innerHTML;

  let menuTag = fileChildren.get("menu");
  this.setEntities(menuTag);
  this.attributes = this.getXMLAttributes(menuTag);
  this._hasButtons = this.hasObject(Button);
  return menu
};

// Parses the header of the menu data and creates a layout object
// based on its contents. fileSettings is a map output from getXMLCHildren.
GUIManager.prototype.getLayoutFromSettings = function(fileSettings){
  let layoutName = fileSettings.get("layout").innerHTML.toLowerCase();
  if(this._validLayouts.contains(layoutName) === true){
    let layout = new this._validLayouts.get(layoutName)(); // Construct layout from name.
  } else console.error(`Detected invalid menu layout. Name: ${layoutName}. Settings: ${fileSettings}`);
};

/**
 * Menu class represents a single instance of a menu.
 * Will contain gui objects and layout information.
*/
function Menu(name, layout){
  this.name;
  this.layout;
  this.guiObjects;
}


/**
 * Parent class for all gui objects.
*/
function GUIObject(){}

function Label(){}

function Button(){}

function Layout(){}

function FloatLayout(){}
