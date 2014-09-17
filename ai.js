
function Ai(camp) {
  this.camp = camp;
}
Ai.prototype = {
  camp: null,
  move: function() {
    // Find all accessible tiles.
    // List of { tile: {q,r}, nextTile: {q,r}, score: number }.
    var options = this.camp.options();
    var self = this;
    options = options.map(function(option) {
      return {
        tile: option.tile,
        nextTile: option.nextTile,
        score: self.scoreTile(option.tile, option.nextTile),
      };
    });
    console.log(JSON.stringify(options));
    var best = options[0];
    for (var i = 0; i < options.length; i++) {
      if (options[i].score > best.score) {
        best = options[i];
      }
    }
    console.log('picked', JSON.stringify(best));
    return {
      type: planType.move,
      at: terrain.keyFromTile(best.tile),
      to: terrain.keyFromTile(best.nextTile),
    };
  },
  // tile: {q,r}
  scoreTile: function(fromTile, tile) {
    var score = 0;
    var terrainTile = terrain.tile(tile);
    var fromTerrainTile = terrain.tile(fromTile);
    if (terrainTile.r) { score += 5; }
    if (terrainTile.c != null && terrainTile.c !== this.camp.id) {
      if (fromTerrainTile.p > terrainTile.p) {
        score += 7;
      } else {
        score++;
      }
    }
    // Covering more ground is good.
    // (Except next to enemies, because it creates weak points, but
    // we're not that smart yet.)
    if (!terrain.areNeighbours(fromTile, tile)) {
      score += 2;
    }
    if (terrain.transitionTile(fromTerrainTile.t, terrainTile.t)) {
      score += 6;
    }
    return score;
  },
};
