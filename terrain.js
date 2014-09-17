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
  // - v: next visible parcels connected to this one (as a list of "q:r").
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
        v: [],
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

  // Check whether two given tiles are neighbours.
  // from, to: {q,r}
  areNeighbours: function(from, to) {
    for (var i = 0; i < 6; i++) {
      var neighbor = this.neighborFromTile(from, i);
      if (neighbor.q === to.q && neighbor.r === to.r) {
        return true;
      }
    }
    return false;
  },

  // Return a string key unique to the tile.
  keyFromTile: function keyFromTile(tile) { return tile.q + ':' + tile.r; },
  tileFromKey: function tileFromKey(key) {
    var values = key.split(':');
    return { q: values[0]|0, r: values[1]|0 };
  },

  // Return the accessible tiles from a certain spot,
  // as a map from "q:r" to a list of "q:r" tiles it would occupy.
  // tile: {q,r}
  accessibleTiles: function(tile) {
    var terrainTile = this.tile(tile);
    // Is this tile acceptable?
    if (terrainTile.c == null) {
      // FIXME: maybe show tiles that lead to this one.
      return {};
    }
    if (terrainTile.p <= 0) { return {}; }

    var nextTiles = this.nextTiles(tile);

    for (var targetTileKey in nextTiles) {
      for (var i = 0; i < nextTiles[targetTileKey].length; i++) {
        var tileKey = nextTiles[targetTileKey][i];
        var tile = this.tileFromKey(tileKey);
        var thisTerrain = this.tile(tile);
        // External tiles or already occupied tiles are removed.
        if (!visibleTiles[tileKey]
         || (thisTerrain.c === terrainTile.c)
         // Interrupted along the path.
         || (i < nextTiles[targetTileKey].length - 1
           && thisTerrain.c != null)
         // We already have a link there.
         || (terrainTile.v.indexOf(tileKey) >= 0)
         || (terrainTile.n.indexOf(tileKey) >= 0)) {
          delete nextTiles[targetTileKey];
          break;
        }
      }
    }

    return nextTiles;
  },

  // Return the tiles we can theoretically got o from a certain spot,
  // as a map from "q:r" to a list of "q:r" tiles it would occupy.
  // tile: {q,r}
  nextTiles: function(tile) {
    var terrainTile = this.tile(tile);
    var nextTiles = Object.create(null);
    var tileKey;
    if (terrainTile.t === element.earth) {
      // All neighbors.
      for (var i = 0; i < 6; i++) {
        var neighbor = this.neighborFromTile(tile, i);
        tileKey = this.keyFromTile(neighbor);
        nextTiles[tileKey] = [tileKey];
      }

    } else if (terrainTile.t === element.fire) {
      //  V
      // . .
      var neighbor = this.neighborFromTile(tile, 1);
      var prevTileKey = this.keyFromTile(neighbor);
      nextTiles[prevTileKey] = [prevTileKey];
      neighbor = this.neighborFromTile(neighbor, 1);
      tileKey = this.keyFromTile(neighbor);
      nextTiles[tileKey] = [prevTileKey, tileKey];

      neighbor = this.neighborFromTile(tile, 2);
      var prevTileKey = this.keyFromTile(neighbor);
      nextTiles[prevTileKey] = [prevTileKey];
      neighbor = this.neighborFromTile(neighbor, 2);
      tileKey = this.keyFromTile(neighbor);
      nextTiles[tileKey] = [prevTileKey, tileKey];

      neighbor = this.neighborFromTile(tile, 5);
      var prevTileKey = this.keyFromTile(neighbor);
      neighbor = this.neighborFromTile(neighbor, 5);
      tileKey = this.keyFromTile(neighbor);
      nextTiles[tileKey] = [prevTileKey, tileKey];

      neighbor = this.neighborFromTile(tile, 4);
      var prevTileKey = this.keyFromTile(neighbor);
      neighbor = this.neighborFromTile(neighbor, 4);
      tileKey = this.keyFromTile(neighbor);
      nextTiles[tileKey] = [prevTileKey, tileKey];

    } else if (terrainTile.t === element.air) {
      var neighbor = this.neighborFromTile(tile, 1);
      var prevTileKey = this.keyFromTile(neighbor);
      nextTiles[prevTileKey] = [prevTileKey];
      neighbor = this.neighborFromTile(neighbor, 0);
      tileKey = this.keyFromTile(neighbor);
      nextTiles[tileKey] = [prevTileKey, tileKey];

      neighbor = this.neighborFromTile(tile, 5);
      var prevTileKey = this.keyFromTile(neighbor);
      nextTiles[prevTileKey] = [prevTileKey];
      neighbor = this.neighborFromTile(neighbor, 4);
      tileKey = this.keyFromTile(neighbor);
      nextTiles[tileKey] = [prevTileKey, tileKey];

      neighbor = this.neighborFromTile(tile, 3);
      var prevTileKey = this.keyFromTile(neighbor);
      nextTiles[prevTileKey] = [prevTileKey];
      neighbor = this.neighborFromTile(neighbor, 2);
      tileKey = this.keyFromTile(neighbor);
      nextTiles[tileKey] = [prevTileKey, tileKey];

    } else if (terrainTile.t === element.water) {
      //  .
      // ---
      //  .
      var neighbor = this.neighborFromTile(tile, 0);
      var prevTileKey = this.keyFromTile(neighbor);
      nextTiles[prevTileKey] = [prevTileKey];
      neighbor = this.neighborFromTile(neighbor, 0);
      tileKey = this.keyFromTile(neighbor);
      nextTiles[tileKey] = [prevTileKey, tileKey];

      neighbor = this.neighborFromTile(tile, 3);
      var prevTileKey = this.keyFromTile(neighbor);
      nextTiles[prevTileKey] = [prevTileKey];
      neighbor = this.neighborFromTile(neighbor, 3);
      tileKey = this.keyFromTile(neighbor);
      nextTiles[tileKey] = [prevTileKey, tileKey];

      neighbor = this.neighborFromTile(tile, 1);
      var prevTileKey = this.keyFromTile(neighbor);
      neighbor = this.neighborFromTile(neighbor, 2);
      tileKey = this.keyFromTile(neighbor);
      nextTiles[tileKey] = [prevTileKey, tileKey];

      neighbor = this.neighborFromTile(tile, 4);
      var prevTileKey = this.keyFromTile(neighbor);
      neighbor = this.neighborFromTile(neighbor, 5);
      tileKey = this.keyFromTile(neighbor);
      nextTiles[tileKey] = [prevTileKey, tileKey];
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

  // tile: {q,r}
  powerAgainst: function(tile) {
    var sum = 0;
    var terrainTile = this.tile(tile);
    var thisTileKey = this.keyFromTile(tile);
    for (var tileKey in visibleTiles) {
      var otherTerrain = this.tile(this.tileFromKey(tileKey));
      if (otherTerrain.v.indexOf(thisTileKey) >= 0
       && otherTerrain.c !== terrainTile.c) {
        sum += otherTerrain.p;
      }
    }
    return sum;
  },

};

