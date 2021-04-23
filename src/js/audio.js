/**
 * audio.js will be responsible for sound and music, and will
 * contain the necessary methods to manipulate them.
*/

/**
 * Handles the playing of audio and related sound manipulations.
*/
function AudioManager(parent){
  this.parent = parent;
  this.songs = new Map();
  this.songStack = [] // Keeps track of songs in order.
};

// load songs into this.songs
// songs is an array of audio urls.
AudioManager.prototype.loadSongs = function(songs){};


// Play single sound
// possible to continue paused songs, or start song from
// the beginning.
// new songs should be added to stack
AudioManager.prototype.playSound = function(){};

// Play a song
// would ideally contain options
AudioManager.prototype.playSong = function(){};

// Stops song / sound
AudioManager.prototype.stop = function(){};

// Pauses song.
AudioManager.prototype.pause = function(){}

// pop song from stack.
AudioManager.prototype.pop = function(){}

function Song(url){
  this.audio = new Audio(url);
  this.duration = 0;
  this.paused = false;
};
