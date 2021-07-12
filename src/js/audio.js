/**
 * audio.js will be responsible for sound and music, and will
 * contain the necessary methods to manipulate them.
*/

/**
 * Handles the playing of audio and related sound manipulations.
*/

function AudioManager(parent){
  this.parent = parent;
  
  this.audioContext = new AudioContext();
  this.bgm = new Map(); // Map containing all bgm names and their audio objects.
  this.sfx = new Map(); // Map containing all sfx names and their audio objects.
  this.activeSong = null;

  this.bgmVolume = 1;
  this.sfxVolume = 1;

  this.gainNode = this.audioContext.createGain(); // For sounds.
  this.gainNode.connect(this.audioContext.destination);
  this.gainNode.gain.value = this.sfxVolume;
};

AudioManager.prototype.loadAudio = function(name, url, type){
  if(type === "bgm"){
    return this.loadSong(name, url);
  }
  else if(type === "sfx"){
    return this.loadSound(name, url);
  }
  else console.error(`type ${type} is an invalid audio type!`);
};

AudioManager.prototype.loadSong = function(name, url){
  return new Promise((resolve, reject) => {
    let audio = new Audio(url);
    audio.oncanplaythrough = resolve;
    audio.onerror = reject;
    this.bgm.set(name, audio);
  });
};

AudioManager.prototype._getSoundBuffer = function(url){
  return new Promise((resolve, reject) => {
    let req = new XMLHttpRequest(url);
    req.open("GET", url, true);
    req.responseType = "arraybuffer";
    req.onload = () => resolve(req.response) // pass response data out.
    req.onerror = reject
    req.send();
  })
};

AudioManager.prototype.loadSound = function(name, url){
  return new Promise((resolve, reject) => {
    this._getSoundBuffer(url)
    .then((data) => {
      this.audioContext.decodeAudioData(data, (buffer) => {
        this.sfx.set(name, buffer);
        resolve();
      })
    });
  });
};

AudioManager.prototype.playSound = function(name){
  let source = this.audioContext.createBufferSource();
  source.buffer = this.sfx.get(name);
  source.connect(this.gainNode);
  source.onended = () => {if(this.stop)this.stop(); if(this.disconnect)this.disconnect();}
  source.start(0);
};

AudioManager.prototype.setVolume = function(v, type){
  if(type !== "bgm" || type !== "sfx"){
    console.error(`type ${type} is an invalid audio type!`);
  }
  this[type + "Volume"] = Engine.prototype.boundNum(v, 0, 100);

  if(type === "bgm" && this.activeSong !== null){
    this.activeSong.volume = this.bgmVolume;
  }
  else if(type === "sfx"){this.gainNode.gain.value = this.sfxVolume};
};

// Play a song
// would ideally contain options
AudioManager.prototype.playSong = function(name, loop=false){
  this.stopSong();

  let newSong = this.bgm.get(name);
  newSong.loop = loop;
  newSong.volume = this.bgmVolume;
  newSong.play();
  this.activeSong = newSong;
};

// Stops the active song.
AudioManager.prototype.stopSong = function(name){
  if(this.activeSong !== null){
    this.activeSong.stop();
    this.activeSong = null;
  };
};

// Pauses active song.
AudioManager.prototype.pause = function(){
  if(this.activeSong !== null){this.activeSong.pause()};
};
