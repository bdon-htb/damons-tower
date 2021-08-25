/**
 * A very rough prototype of procedural dungeon generation.
*/

function main(){
  let level = generateLevel();
  console.log(level);
  drawLevel(level);
};

main();
