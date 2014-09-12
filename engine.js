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

var planType = {
  move: 1,
  build: 2
};

function GameState() {
  this.camps = new Array(numberOfCamps);
  for (var i = 0; i < numberOfCamps; i++) {
    this.camps[i] = new Camp();
  }
}
GameState.prototype = {
  camps: [],
  turn: 0,
  nextTurn: function() {
    this.turn = (this.turn + 1) % numberOfCamps;
  },

  // A move is a {type: planType, at: "q:r", to: "q:r", element}.
  validMove: function(move) {
    var atTile = terrain.tileFromKey(move.at);
    var atTerrainTile = terrain.tile(atTile);
    if (atTerrainTile.c !== this.turn) { return false; }
    if (move.type === planType.move) {
      if (move.to == null) { return false; }
      // We cannot get to that parcel.
      if (!terrain.accessibleTiles(atTile)[move.to]) { return false; }
      // The connection is already set.
      if (atTerrainTile.n.indexOf(move.to) >= 0) { return false; }
      // The connection is already set the other way around.
      var toTile = terrain.tileFromKey(move.to);
      var toTerrainTile = terrain.tile(toTile);
      if (toTerrainTile.n.indexOf(move.at) >= 0) { return false; }
    } else if (move.type === planType.build) {
      if (planType.element == null) { return false; }
      if (planType.element < 0 || planType.element > 3) { return false; }
      // There already is a fortification.
      if (atTerrainTile.f != null) { return false; }
    } else { return false; }
    return true;
  },

  // A move is a {type: planType, at: "q:r", to: "q:r", element}.
  move: function(move) {
    if (this.validMove(move)) {
      var atTile = terrain.tileFromKey(move.at);
      var atTerrainTile = terrain.tile(atTile);
      if (move.type === planType.move) {
        atTerrainTile.n.push(move.to);
        var toTile = terrain.tileFromKey(move.to);
        var toTerrainTile = terrain.tile(toTile);
        toTerrainTile.c = this.turn;
        toTerrainTile.p = atTerrainTile.p;
        if (terrain.transitionTile(atTile, toTile)) {
          toTerrainTile.p++;
        }
      } else if (move.type === planType.build) {
        atTerrainTile.f = move.element;
      }

      this.nextTurn();
    } else { debugger; }
  },
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
