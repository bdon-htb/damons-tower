const CELLSIZE = 5;

const EMPTYVALUE = 0;
const ROOMVALUE = 1;
const CORRIDORVALUE = 2;
const DOORVALUE = 3;

const EMPTYCOLOUR = 'black';
const ROOMCOLOUR = 'blue';
const CORRIDORCOLOUR = 'white';
const DOORCOLOUR = 'green';

let COLOURS = {}
COLOURS[EMPTYVALUE] = EMPTYCOLOUR;
COLOURS[ROOMVALUE] = ROOMCOLOUR;
COLOURS[CORRIDORVALUE] = CORRIDORCOLOUR;
COLOURS[DOORVALUE] = DOORCOLOUR;

// Measured in cells.
const GRIDWIDTH = 100;
const GRIDHEIGHT = 100;

const canvas = document.getElementById('demo');
const ctx = canvas.getContext('2d');

canvas.width = GRIDWIDTH * CELLSIZE;
canvas.height = GRIDHEIGHT * CELLSIZE;
