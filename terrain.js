var element = {
  water: 0,
  fire: 1,
  earth: 2,
  air: 3
};

var MAX_INT = 9007199254740992;

function Terrain() {
  this.data = {};
}

Terrain.prototype = {
  data: {},

  // Get information about the tile at hexagonal coordinates `coord` {q, r}.
  // Returns
  // - t: terrain type (see `element`).
  // - c: camp. (Can be undefined.)
  // - p: power.
  // - r: resource (boolean).
  // - f: fortification (see `element`). (Can be undefined.)
  // - n: next parcels connected to this one (as a list of "q:r").
  // - a: random number between 0 and 1.
  tile: function tile(coord) {
    var key = this.keyFromTile(coord);
    if (this.data[key] == null) {
      this.data[key] = {
        t: (Math.random() * 4)|0,
        r: (coord.q % 3) === 0 && (coord.r % 3 === 2),
        a: Math.random(),
        p: 0,
        n: [],
      };
    }
    return this.data[key];
  },

  // Find a neighboring tile.
  // `tile` is {q, r}.
  // `orientation` is 0 for right, 1 for top right, and
  // so on counter-clockwise until 5 for bottom right.
  neighborFromTile: function neighborFromTile(tile, orientation) {
    if (orientation === 0) { return { q: tile.q + 1, r: tile.r };
    } else if (orientation === 1) { return { q: tile.q + 1, r: tile.r - 1 };
    } else if (orientation === 2) { return { q: tile.q, r: tile.r - 1};
    } else if (orientation === 3) { return { q: tile.q - 1, r: tile.r };
    } else if (orientation === 4) { return { q: tile.q - 1, r: tile.r + 1 };
    } else if (orientation === 5) { return { q: tile.q, r: tile.r + 1 };
    }
  },

  // Return a string key unique to the tile.
  keyFromTile: function keyFromTile(tile) { return tile.q + ':' + tile.r; },
  tileFromKey: function tileFromKey(key) {
    var values = key.split(':');
    return { q: values[0]|0, r: values[1]|0 };
  },

  // Return the accessible tiles from a certain spot,
  // as a map from "q:r" to truthy values.
  // tile: {q,r}
  accessibleTiles: function(tile) {
    var terrainTile = this.tile(tile);
    var nextTiles = Object.create(null);
    if (terrainTile.t === element.earth) {
      // All neighbors.
      for (var i = 0; i < 6; i++) {
        var neighbor = this.neighborFromTile(tile, i);
        nextTiles[this.keyFromTile(neighbor)] = true;
      }

    } else if (terrainTile.t === element.fire) {
      //  V
      // . .
      var neighbor = this.neighborFromTile(tile, 1);
      nextTiles[this.keyFromTile(neighbor)] = true;
      neighbor = this.neighborFromTile(neighbor, 1);
      nextTiles[this.keyFromTile(neighbor)] = true;

      neighbor = this.neighborFromTile(tile, 2);
      nextTiles[this.keyFromTile(neighbor)] = true;
      neighbor = this.neighborFromTile(neighbor, 2);
      nextTiles[this.keyFromTile(neighbor)] = true;

      neighbor = this.neighborFromTile(tile, 5);
      neighbor = this.neighborFromTile(neighbor, 5);
      nextTiles[this.keyFromTile(neighbor)] = true;

      neighbor = this.neighborFromTile(tile, 4);
      neighbor = this.neighborFromTile(neighbor, 4);
      nextTiles[this.keyFromTile(neighbor)] = true;

    } else if (terrainTile.t === element.air) {
      var neighbor = this.neighborFromTile(tile, 1);
      nextTiles[this.keyFromTile(neighbor)] = true;
      neighbor = this.neighborFromTile(neighbor, 0);
      nextTiles[this.keyFromTile(neighbor)] = true;

      neighbor = this.neighborFromTile(tile, 5);
      nextTiles[this.keyFromTile(neighbor)] = true;
      neighbor = this.neighborFromTile(neighbor, 4);
      nextTiles[this.keyFromTile(neighbor)] = true;

      neighbor = this.neighborFromTile(tile, 3);
      nextTiles[this.keyFromTile(neighbor)] = true;
      neighbor = this.neighborFromTile(neighbor, 2);
      nextTiles[this.keyFromTile(neighbor)] = true;

    } else if (terrainTile.t === element.water) {
      //  .
      // ---
      //  .
      var neighbor = this.neighborFromTile(tile, 0);
      nextTiles[this.keyFromTile(neighbor)] = true;
      neighbor = this.neighborFromTile(neighbor, 0);
      nextTiles[this.keyFromTile(neighbor)] = true;

      neighbor = this.neighborFromTile(tile, 3);
      nextTiles[this.keyFromTile(neighbor)] = true;
      neighbor = this.neighborFromTile(neighbor, 3);
      nextTiles[this.keyFromTile(neighbor)] = true;

      neighbor = this.neighborFromTile(tile, 1);
      neighbor = this.neighborFromTile(neighbor, 2);
      nextTiles[this.keyFromTile(neighbor)] = true;

      neighbor = this.neighborFromTile(tile, 5);
      neighbor = this.neighborFromTile(neighbor, 4);
      nextTiles[this.keyFromTile(neighbor)] = true;
    }

    for (var tileKey in nextTiles) {
      if (!visibleTiles[tileKey]) { delete nextTiles[tileKey]; }
    }

    return nextTiles;
  },

  // Return the transition element for a particular element.
  transitionElement: function (e) {
    switch(e) {
    case element.fire:  return element.air;
    case element.air:   return element.water;
    case element.water: return element.fire;
    }
  },

  // Return the transition element for a particular element.
  antiTransitionElement: function (e) {
    switch(e) {
    case element.fire:  return element.water;
    case element.air:   return element.fire;
    case element.water: return element.air;
    }
  },

  // Return true if tile2 has the transition element of tile1.
  // tile1, tile2: {q,r}
  transitionTile: function (tile1, tile2) {
    var e1 = terrain.tile(tile1).t;
    var e2 = terrain.tile(tile2).t;
    return e2 === this.transitionElement(e1);
  },

};

