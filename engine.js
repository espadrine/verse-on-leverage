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
    if (atTerrainTile.p <= 0) { return false; }
    if (move.type === planType.move) {
      if (move.to == null) { return false; }
      // We cannot get to that parcel.
      if (!terrain.accessibleTiles(atTile)[move.to]) { return false; }
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
        var toTile = terrain.tileFromKey(move.to);
        var toTerrainTile = terrain.tile(toTile);
        var accessibleTiles = terrain.accessibleTiles(atTile);
        var path = accessibleTiles[move.to];

        if (toTerrainTile.c != null
          && toTerrainTile.p < terrain.powerAgainst(toTile) + atTerrainTile.p) {
          this.killSubgraph(toTile, toTerrainTile.c);
        }

        if (atTerrainTile.v.indexOf(move.to) < 0) {
          atTerrainTile.v.push(move.to);
        }
        var startTerrain = atTerrainTile;
        for (var i = 0; i < path.length; i++) {
          var pathTerrainTile = terrain.tile(terrain.tileFromKey(path[i]));
          if (startTerrain.n.indexOf(path[i]) < 0) {
            startTerrain.n.push(path[i]);
          }
          startTerrain = pathTerrainTile;
        }

        // Conquest.
        if ((toTerrainTile.c == null)
         || (toTerrainTile.c != null
          && toTerrainTile.p < terrain.powerAgainst(toTile))) {
          // Block secondary tiles.
          for (var i = 0; i < path.length - 1; i++) {
            var pathTerrainTile = terrain.tile(terrain.tileFromKey(path[i]));
            pathTerrainTile.c = this.turn;
            pathTerrainTile.p = 0;
          }
          toTerrainTile.c = this.turn;
          toTerrainTile.p = atTerrainTile.p;
        }
        if (terrain.transitionTile(atTile, toTile)) {
          toTerrainTile.p++;
        }

        this.clearDeadSegments();

      } else if (move.type === planType.build) {
        atTerrainTile.f = move.element;
      }

      this.nextTurn();
    } else { debugger; }
  },

  // tile: {q,r}
  killSubgraph: function(tile, camp, visited) {
    if (visited == null) { visited = Object.create(null); }
    if (visited[terrain.keyFromTile(tile)]) { return; }
    visited[terrain.keyFromTile(tile)] = true;
    var terrainTile = terrain.tile(tile);
    if (terrainTile.c !== camp) { return; }
    for (var i = 0; i < terrainTile.n.length; i++) {
      var nextTileKey = terrainTile.n[i];
      var nextTile = terrain.tileFromKey(nextTileKey);
      var nextTerrainTile = terrain.tile(nextTile);
      this.killSubgraph(nextTile, camp, visited);
    }
    terrainTile.c = undefined;
    terrainTile.p = 0;
    terrainTile.f = undefined;
    terrainTile.n = [];
    terrainTile.v = [];
  },

  clearDeadSegments: function() {
    for (var tileKey in visibleTiles) {
      var tile = terrain.tileFromKey(tileKey);
      var terrainTile = terrain.tile(tile);
      if (terrainTile.c == null
       || (terrainTile.p <= 0 && terrainTile.n.length === 0)) {
        terrainTile.n = [];
        terrainTile.v = [];
        // Dead end of a segment.
        this.killLinksTo(tile);
      }
    }
  },

  // targetTile: {q,r}
  killLinksTo: function(targetTile) {
    var targetTerrainTile = terrain.tile(targetTile);
    var targetTileKey = terrain.keyFromTile(targetTile);
    for (var tileKey in visibleTiles) {
      var tile = terrain.tileFromKey(tileKey);
      var terrainTile = terrain.tile(tile);
      var index = terrainTile.n.indexOf(targetTileKey);
      if (index >= 0) {
        terrainTile.n.splice(index, 1);
      }
    }
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
