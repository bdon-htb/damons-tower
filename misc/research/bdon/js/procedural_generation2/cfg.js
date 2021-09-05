const CELLSIZE = 5;

const EMPTYVALUE = 0;
const ROOMVALUE = 1;
const CORRIDORVALUE = 2;
const DOORVALUE = 3;
const NEXTTOVALUE = 4; // next to room value. Corresponds to room margin.

const EMPTYCOLOUR = 'black';
const ROOMCOLOUR = 'blue';
const CORRIDORCOLOUR = 'white';
const DOORCOLOUR = 'green';
const NEXTTOCOLOUR = 'yellow';

let COLOURS = {}
COLOURS[EMPTYVALUE] = EMPTYCOLOUR;
COLOURS[ROOMVALUE] = ROOMCOLOUR;
COLOURS[CORRIDORVALUE] = CORRIDORCOLOUR;
COLOURS[NEXTTOVALUE] = NEXTTOCOLOUR

// Measured in cells.
const GRIDWIDTH = 100;
const GRIDHEIGHT = 100;

const canvas = document.getElementById('demo');
const ctx = canvas.getContext('2d');

canvas.width = GRIDWIDTH * CELLSIZE;
canvas.height = GRIDHEIGHT * CELLSIZE;
