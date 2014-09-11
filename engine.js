// Game state.

var terrain;
var numberOfCamps = 2;
var playerCamp = 0;

// Get all visible tiles of a certain type.
// Returns a list of {q,r}.
function visibleTilesFromType(type) {
  getVisibleTiles(gs);
  var tiles = [];
  for (var i = 0; i < visibleTiles.length; i++) {
    var tile = visibleTiles[i];
    if (tile.t === type) {
      tiles.push(tile);
    }
  }
  return tiles;
}

var campCursorId = 0;
function Camp() {
  this.id = campCursorId;
  // Find a starting location.
  getVisibleTiles(gs);
  var earthTiles = visibleTilesFromType(element.earth);
  this.baseTile = earthTiles[(Math.random() * earthTiles.length)|0];
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
