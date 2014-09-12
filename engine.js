// Game state.

var terrain;
var numberOfCamps = 2;
var playerCamp = 0;

// Takes a filter `function valid(tile = {q,r}, terrainTile)`
// (see `terrain.js`).
// Returns a list of {q,r}.
function visibleTilesFilter(valid) {
  var tiles = [];
  for (var tileKey in visibleTiles) {
    var tile = terrain.tileFromKey(tileKey);
    var terrainTile = terrain.tile(tile);
    if (valid(tile, terrainTile)) {
      tiles.push(tile);
    }
  }
  return tiles;
}

var campCursorId = 0;
function Camp() {
  this.id = campCursorId;
  campCursorId++;
  // Find a starting location.
  var earthTiles = visibleTilesFilter(function(tile, terrainTile) {
    var earth = terrainTile.t === element.earth;
    var notEnemy = terrainTile.c === (void 0);
    var nextToResource = false;
    for (var i = 0; i < 6; i++) {
      var neighbor = terrain.neighborFromTile(tile, i);
      if (!visibleTiles[terrain.keyFromTile(tile)]) { continue; }
      if (terrain.tile(neighbor).r) { nextToResource = true; break; }
    }
    return earth && notEnemy && nextToResource;
  });
  this.baseTile = earthTiles[(Math.random() * earthTiles.length)|0];
  // Give this tile to us!
  var ourTile = terrain.tile(this.baseTile);
  ourTile.c = this.id;
  ourTile.p = 1;
}
Camp.prototype = {
  id: 0,
  // {q,r} tile location of the camp's base.
  baseTile: null,
  // Number of resources obtained.
  resources: 0,
}

// Object containing:
// - winners: list of winners from most victorious to least.
// - winType: string indicating the type of victory.
var gameOver;

function GameState() {
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
  terrain = new Terrain();
  allTiles = null;
  visibleTiles = null;
  computeVisibleTiles(gs);

  campCursorId = 0;
  gameState = new GameState();
  paint(gs);
}


setUpGame();
