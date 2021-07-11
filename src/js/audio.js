/**
 * audio.js will be responsible for sound and music, and will
 * contain the necessary methods to manipulate them.
*/

/**
 * Handles the playing of audio and related sound manipulations.
*/
function AudioManager(parent){
  this.parent = parent;
  this.bgm = new Map(); // Map containing all bgm names and their audio objects.
  this.sfx = new Map(); // Map containing all sfx names and their audio objects.
  this.activeSong = null;
  this.songStack = [] // Keeps track of songs in order.
};

AudioManager.prototype.loadAudio = function(name, url, type){
  return new Promise((resolve, reject) => {
    let audio = new Audio(url);
    audio.oncanplaythrough = resolve;
    audio.onerror = reject;

    if(type === "bgm"){this.bgm.set(name, audio)}
    else if(type === "sfx"){this.sfx.set(name, audio)}
    else console.error(`type ${type} is an invalid audio type!`);
  });
};


AudioManager.prototype.playSound = function(name){
  this.sfx.get(name).play();
};

// Play a song
// would ideally contain options
AudioManager.prototype.playSong = function(name, loop=false){
  let newSong = this.bgm.get(name);

  if(this.activeSong !== null){
    this.activeSong.stop();
    this.activeSong = null;
  };

  newSong.loop = loop;
  newSong.play();
  this.activeSong = newSong;
};

// Stops song / sound
AudioManager.prototype.stop = function(name){};

// Pauses song.
AudioManager.prototype.pause = function(){}

// pop song from stack.
AudioManager.prototype.pop = function(){}
