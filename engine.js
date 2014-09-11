// Game state.

var terrain;
var numberOfCamps = 2;
var playerCamp = 0;

// Takes a filter `function valid(tile = {q,r}, terrainTile)`
// (see `terrain.js`).
// Returns a list of {q,r}.
function visibleTilesFilter(valid) {
  getVisibleTiles(gs);
  var tiles = [];
  for (var i = 0; i < visibleTiles.length; i++) {
    var terrainTile = terrain.tile(visibleTiles[i]);
    if (valid(visibleTiles[i], terrainTile)) {
      tiles.push(visibleTiles[i]);
    }
  }
  return tiles;
}

var campCursorId = 0;
function Camp() {
  this.id = campCursorId;
  campCursorId++;
  // Find a starting location.
  getVisibleTiles(gs);
  var earthTiles = visibleTilesFilter(function(tile, terrainTile) {
    return terrainTile.t === element.earth && terrainTile.c === (void 0);
  });
  this.baseTile = earthTiles[(Math.random() * earthTiles.length)|0];
  // Give this tile to us!
  var ourTile = terrain.tile(this.baseTile);
  ourTile.c = this.id;
  ourTile.p = 1;
}
Camp.prototype = {
  id: 0,
}

// Object containing:
// - winners: list of winners from most victorious to least.
// - winType: string indicating the type of victory.
var gameOver;

function GameState() {
  terrain = new Terrain();
  this.camps = new Array(numberOfCamps);
  for (var i = 0; i < numberOfCamps; i++) {
    this.camps[i] = new Camp();
  }
}
GameState.prototype = {
  camps: [],
};

var gameState;

// Set up a new game.
function setUpGame() {
  campCursorId = 0;
  gameState = new GameState();
  paint(gs);
}


setUpGame();
