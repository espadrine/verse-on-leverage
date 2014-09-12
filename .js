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

// Orientation of the second pixel related to the first,
// in radians, trigonometric direction. Both pixels are {x, y}.
function orientation(p1, p2) {
  var res = Math.atan((p1.y - p2.y) / Math.abs(p2.x - p1.x));
  if (p2.x < p1.x) { res = Math.PI - res; }
  return res;
}

// Distance in pixels between two pixels {x, y}.
function pixelDistance(p1, p2) {
  var horiz = Math.abs(p1.x - p2.x);
  var vert = Math.abs(p1.y - p2.y);
  return Math.sqrt(horiz * horiz + vert * vert);
}




// Graphic State functions.
// Painting primitives.
//


// Given real hexagonal coordinates p = {q, r}, round to the nearest integer
// hexagonal coordinate.
function intPointFromReal(p) {
  var x = p.q;
  var z = p.r;
  var y = - x - z;
  var rx = Math.round(x);
  var ry = Math.round(y);
  var rz = Math.round(z);
  var x_err = Math.abs(rx - x);
  var y_err = Math.abs(ry - y);
  var z_err = Math.abs(rz - z);
  if (x_err > y_err && x_err > z_err) {
    rx = - ry - rz;
  } else if (y_err > z_err) {
    ry = - rx - rz;
  } else {
    rz = - rx - ry;
  }

  return {
    q: rx,
    r: rz
  };
}

// Given a point px = {x, y} representing a pixel position on the screen,
// and given a position px0 = {x0, y0} of the screen on the map,
// return a point {q, r} of the hexagon on the map.
// `size` is the radius of the smallest disk containing the hexagon.
function tileFromPixel(px, px0, size) {
  var xm = px.x + px0.x0;
  var ym = px.y + px0.y0;
  return intPointFromReal({
    q: (Math.sqrt(3) * xm - ym) / 3 / size,
    r: 2 * ym / 3 / size
  });
}

// Given a point p = {q, r} representing a hexagonal coordinate,
// and given a position px0 = {x0, y0} of the screen on the map,
// return a pixel {x, y} of the hexagon's center.
// `size` is the radius of the smallest disk containing the hexagon.
function pixelFromTile(p, px0, size) {
  return {
    x: ((size * Math.sqrt(3) * (p.q + p.r / 2))|0) - px0.x0,
    y: (size * 3/2 * p.r) - px0.y0
  };
}

// Random nudge to {x: 0, y:0}. The size of the nudge is given by `size`.
// `tile` {q,r} is given as input to the randomness.
// The result will be the same for each tile.
function noisyPixel(size, tile) {
  var t = terrain.tile(tile);
  var c = { x: 0, y: 0 };
  c.x += (t.a * (size << 1)) - size|0;
  c.y +=  (t.a * (size << 1)) - size|0;
  return c;
}

// Include all information pertaining to the state of the canvas.
// canvas: a DOM HTML canvas.
function makeGraphicState(canvas) {
  var ctx = canvas.getContext('2d');
  // Size of radius of the smallest disk containing the hexagon.
  var hexSize = 40;
  var spritesWidth = hexSize * 2;  // Each element of the sprite is 2x20px.
  return {
    hexSize: hexSize,
    // Pixel position of the top left screen pixel,
    // compared to the origin (pixel (0, 0)) of the map.
    origin: { x0: 0, y0: 0 },
    canvas: canvas,
    ctx: ctx,
    width: canvas.width,
    height: canvas.height,
  };
}

var canvas = document.getElementById('canvas');
canvas.width = 1280;
canvas.height = 720;
canvas.style.marginLeft = ((document.documentElement.clientWidth - canvas.width) >> 1) + 'px';
var gs = makeGraphicState(canvas);
var globalGs = gs;
// Blink and Webkit get the following wrong.
// Remove without worry
// when https://code.google.com/p/chromium/issues/detail?id=168840 is fixed.
//document.styleSheets[0].insertRule('div.controlPanel { max-height:' +
//  (gs.height - 16 - 58) + 'px; }', 0);

// Given a list of tile key "q:r" representing hexagon coordinates,
// construct the path along each hexagon's center.
// gs is the GraphicState.
function pathAlongTiles(gs, tiles) {
  var ctx = gs.ctx; var size = gs.hexSize; var origin = gs.origin;
  ctx.beginPath();
  if (tiles.length < 2) { return; }
  var penultimate;
  var cp = pixelFromTile(terrain.tileFromKey(tiles[0]), origin, size);
  var cx = cp.x|0;
  var cy = cp.y|0;
  ctx.moveTo(cp.x|0, cp.y|0);
  for (var i = 0; i < tiles.length - 1; i++) {
    cpNext = pixelFromTile(terrain.tileFromKey(tiles[i+1]), origin, size);
    var avgPoint = averagePoint(cp, cpNext);
    ctx.quadraticCurveTo(cp.x|0, cp.y|0, avgPoint.x|0, avgPoint.y|0);
    if (i === tiles.length - 2) { penultimate = cp; }
    cp = cpNext;
  }
  // Arrow at the end.
  cp = pixelFromTile(terrain.tileFromKey(tiles[tiles.length-1]), origin, size);
  var arrowOffsetX = (penultimate.x - cp.x) / 10;
  var arrowOffsetY = (penultimate.y - cp.y) / 10;
  ctx.lineTo(cp.x + arrowOffsetX, cp.y + arrowOffsetY);
  ctx.lineTo((cp.x + arrowOffsetX - arrowOffsetY*2/3),
             (cp.y + arrowOffsetY + arrowOffsetX*2/3));
  ctx.lineTo(cp.x, cp.y);
  ctx.lineTo((cp.x + arrowOffsetX + arrowOffsetY*2/3),
             (cp.y + arrowOffsetY - arrowOffsetX*2/3));
  ctx.lineTo(cp.x + arrowOffsetX, cp.y + arrowOffsetY);
}

// Given a list of tile key "q:r" representing hexagon coordinates,
// draw the path along each hexagon's center.
// gs is the GraphicState.
function paintAlongTiles(gs, tiles) {
  var ctx = gs.ctx; var size = gs.hexSize; var origin = gs.origin;
  pathAlongTiles(gs, tiles);
  ctx.strokeStyle = '#ccf';
  ctx.lineWidth = '5';
  ctx.stroke();
  ctx.strokeStyle = 'red';
  ctx.lineWidth = '3';
  ctx.stroke();
  // Reset lineWidth.
  ctx.lineWidth = '1';
}

// Given a set of tiles {q, r} representing hexagon coordinates,
// construct the path around those hexagons.
// gs is the GraphicState.
function straightPathFromTiles(gs, tiles, hexHorizDistance, hexVertDistance) {
  var ctx = gs.ctx; var size = gs.hexSize; var origin = gs.origin;
  ctx.beginPath();
  for (var tileKey in tiles) {
    var tile = terrain.tileFromKey(tileKey);
    var cp = pixelFromTile(tile, origin, size);
    var cx = cp.x;
    var cy = cp.y;
    var mask = 0|0;
    for (var f = 0; f < 6; f++) {
      // For each, face, set the mask.
      var neighbor = terrain.neighborFromTile(tile, f);
      mask |= (((tiles[terrain.keyFromTile(neighbor)] !== undefined)|0) << f);
    }
    partialPathFromHex(gs, cp, mask, hexHorizDistance, hexVertDistance);
  }
}

// Given a set of tiles {q, r} representing hexagon coordinates,
// construct the path around those hexagons.
// gs is the GraphicState.
function pathFromTiles(gs, tiles,
    hexHorizDistance, hexVertDistance, noisy, dashed) {
  var ctx = gs.ctx; var size = gs.hexSize; var origin = gs.origin;
  ctx.beginPath();
  var vertices = [];
  for (var tileKey in tiles) {
    var tile = terrain.tileFromKey(tileKey);
    var cp = pixelFromTile(tile, origin, size);
    for (var f = 0; f < 6; f++) {
      // For each face, add the vertices.
      var neighbor = terrain.neighborFromTile(tile, f);
      if (tiles[terrain.keyFromTile(neighbor)] === undefined) {
        vertices = vertices.concat(vertexFromFace(tileKey, f));
      }
    }
  }
  pathFromPolygons(gs,
      polygonFromVertices(gs, vertices, hexHorizDistance, noisy), !!dashed);
}

// Just like `pathFromTiles` above, but with polygonally-drawn paths.
// gs is the GraphicState.
function straightPolygonPathFromTiles(gs, tiles) {
  var ctx = gs.ctx; var size = gs.hexSize; var origin = gs.origin;
  var hexHorizDistance = size * Math.sqrt(3);
  var hexVertDistance = size * 3/2;
  ctx.beginPath();
  var vertices = [];
  for (var tileKey in tiles) {
    var tile = terrain.tileFromKey(tileKey);
    var cp = pixelFromTile(tile, origin, size);
    for (var f = 0; f < 6; f++) {
      // For each face, add the vertices.
      var neighbor = terrain.neighborFromTile(tile, f);
      if (tiles[terrain.keyFromTile(neighbor)] === undefined) {
        vertices = vertices.concat(vertexFromFace(tileKey, f));
      }
    }
  }
  var polygons = polygonFromVertices(gs, vertices, hexHorizDistance);
  for (var i = 0; i < polygons.length; i++) {
    partialPathFromPolygon(gs, polygons[i]);
  }
}

// Given a face 0…5 (0 = right, 1 = top right…), return the two vertices
// delimiting the segment for that face.
function vertexFromFace(tileKey, face) {
  var vertex1 = (face + 4) % 6;
  var vertex2 = (vertex1 + 1) % 6;
  return [
    vertexFromTileKey(tileKey, vertex1),
    vertexFromTileKey(tileKey, vertex2)
  ];
}

// Coordinate system for vertices.
// Takes a tileKey "q:r" and a vertex 0…5 (0 = top, 1 = top left…)
// Returns a vertex key "q:r:0" for the bottom right vertex of tile "q:r", and
// "q:r:1" for the top right vertex of tile "q:r".
function vertexFromTileKey(tileKey, vertex) {
  if (vertex === 0) {
    return terrain.keyFromTile(terrain.neighborFromTile(
          terrain.tileFromKey(tileKey), 2)) + ":0";
  } else if (vertex === 1) {
    return terrain.keyFromTile(terrain.neighborFromTile(
          terrain.tileFromKey(tileKey), 3)) + ":1";
  } else if (vertex === 2) {
    return terrain.keyFromTile(terrain.neighborFromTile(
          terrain.tileFromKey(tileKey), 3)) + ":0";
  } else if (vertex === 3) {
    return terrain.keyFromTile(terrain.neighborFromTile(
          terrain.tileFromKey(tileKey), 4)) + ":1";
  } else if (vertex === 4) {
    return tileKey + ":0";
  } else if (vertex === 5) {
    return tileKey + ":1";
  } else { return "invalid:vertex:key"; }
}

// Take a vertex key "q:r:0", return the {x,y} point in the screen's coordinate.
// gs is the GraphicState.
function pointFromVertex(gs, vertex, hexHorizDistance, noisy) {
  var size = gs.hexSize; var origin = gs.origin;
  var vertexSide = +vertex.slice(-1);
  var tileKey = vertex.slice(0, -2);
  var tile = terrain.tileFromKey(tileKey);
  var cp = pixelFromTile(tile, origin, size);
  var cx = cp.x|0;
  var cy = cp.y|0;
  var halfHorizDistance = hexHorizDistance/2|0;
  var halfSize = size/2|0;
  var ncx = noisy? noisyPixel(size, tile): {x:0, y:0};
  if (vertexSide === 0) {
    return { x: cx + halfHorizDistance + ncx.x, y: cy + halfSize + ncx.y };
  } else if (vertexSide === 1) {
    return {x: cx + halfHorizDistance, y: cy - halfSize};
  }
}

// Given a list of vertices "q:r:0" containing from / to line information,
// return a list of polygons [{x,y}] with no duplicate point.
// gs is the GraphicState.
function polygonFromVertices(gs, vertices, hexHorizDistance, noisy) {
  var size = gs.hexSize; var origin = gs.origin;
  var verticesLeft = new Array(vertices.length);
  for (var i = 0; i < vertices.length; i++) {
    verticesLeft[i] = vertices[i];
  }
  var polygons = [];
  while (verticesLeft.length > 0) {
    var startVertex = verticesLeft.shift();
    var currentVertex = verticesLeft.shift();
    var polygon = [
      pointFromVertex(gs, startVertex, hexHorizDistance, noisy),
      pointFromVertex(gs, currentVertex, hexHorizDistance, noisy)
    ];
    var infiniteLoopCut = 10000;
    while (currentVertex !== startVertex && (infiniteLoopCut--) > 0) {
      for (var i = 0; i < verticesLeft.length; i += 2) {
        if (verticesLeft[i] === currentVertex) {
          polygon.push(pointFromVertex(gs, verticesLeft[i+1],
                hexHorizDistance, noisy));
          currentVertex = verticesLeft[i+1];
          verticesLeft.splice(i, 2);
          break;
        } else if (verticesLeft[i+1] === currentVertex) {
          polygon.push(pointFromVertex(gs, verticesLeft[i],
                hexHorizDistance, noisy));
          currentVertex = verticesLeft[i];
          verticesLeft.splice(i, 2);
          break;
        }
      }
    }
    polygon.pop();
    polygons.push(polygon);
  }
  return polygons;
}

// Continue the path of a polygon [{x,y}].
// gs is the GraphicState.
function partialPathFromPolygon(gs, polygon) {
  var ctx = gs.ctx;
  ctx.moveTo(polygon[0].x, polygon[0].y);
  for (var i = 1; i < polygon.length; i++) {
    ctx.lineTo(polygon[i].x, polygon[i].y);
  }
  ctx.closePath();
}

// Construct the path of list of polygons [{x,y}].
// gs is the GraphicState.
function pathFromPolygons(gs, polygons, dashed) {
  var ctx = gs.ctx;
  ctx.beginPath();
  for (var i = 0; i < polygons.length; i++) {
    partialPathForSmoothPolygon(gs, polygons[i], !!dashed);
  }
}

// Average point {x,y} of two points {x,y}.
function averagePoint(a, b) {
  return { x:(a.x + b.x)>>1, y:(a.y + b.y)>>1 };
}
// Given a point b {x,y} and two points around it in a polygon,
// return a point which makes the three points further apart.
function extremizePoint(a, b, c) {
  var avgPoint = averagePoint(a1, c2);
  var avgPointLocal = averagePoint(a2, c1);
  return { x:b.x - ((avgPoint.x - b.x)/2)|0 + ((avgPointLocal.x - b.x)/2)|0, y:b.y - ((avgPoint.y - b.y)/2)|0 + ((avgPointLocal.y - b.y)/2)|0 };
}

// Given a canvas context and a polygon [{x,y}],
// construct the path that draws a smoother version of the polygon.
// gs is the GraphicState.
function partialPathForSmoothPolygon(gs, oldPolygon, dashed) {
  dashed = !!dashed;
  var ctx = gs.ctx;
  if (oldPolygon.length < 3) { return partialPathFromPolygon(gs, oldPolygon); }
  // This polygon's vertices are the middle of each edge.
  var polygon = new Array(oldPolygon.length);
  var avgPoint;
  for (var i = 0; i < oldPolygon.length; i++) {
    avgPoint = averagePoint(oldPolygon[i], oldPolygon[(i+1)%oldPolygon.length]);
    polygon[i] = avgPoint;
  }
  // Spline between the middle of each edge,
  // making each vertex the control point.
  var avgPoint = averagePoint(polygon[0], polygon[1]);
  ctx.moveTo(avgPoint.x, avgPoint.y);
  for (var i = 1; i < polygon.length; i++) {
    avgPoint = averagePoint(polygon[i], polygon[(i+1)%polygon.length]);
    if (dashed && ((i % 2) === 0)) {
      ctx.moveTo(avgPoint.x, avgPoint.y);
      continue;
    }
    ctx.quadraticCurveTo(polygon[i].x, polygon[i].y,
                         avgPoint.x, avgPoint.y);
  }
  if (dashed) { return; }
  avgPoint = averagePoint(polygon[0], polygon[1]);
  ctx.quadraticCurveTo(polygon[0].x, polygon[0].y,
                       avgPoint.x, avgPoint.y);
}

// Draw a hexagon of size given, from the center point cp = {x, y},
// on the canvas context ctx.
// The mask is a sequence of six bits, each representing a hexagon edge,
// that are set to 1 in order to hide that edge.
// gs is the GraphicState.
// Returns a list of all points {x,y} gone through.
function partialPathFromHex(gs, cp, mask,
                            hexHorizDistance, hexVertDistance) {
  var ctx = gs.ctx; var size = gs.hexSize;
  mask = mask|0;
  var cx = cp.x|0;
  var cy = cp.y|0;
  var halfHorizDistance = hexHorizDistance/2|0;
  var halfSize = size/2|0;
  ctx.moveTo(cx, cy - size);    // top
  // top left
  var x = cx - halfHorizDistance;
  var y = cy - halfSize;
  if ((mask & 4) === 0) {
    ctx.lineTo(x, y);
  } else {
    ctx.moveTo(x, y);
  }
  // bottom left
  x = cx - halfHorizDistance;
  y = cy + halfSize;
  if ((mask & 8) === 0) {
    ctx.lineTo(x, y);
  } else {
    ctx.moveTo(x, y);
  }
  // bottom
  x = cx;
  y = cy + size;
  if ((mask & 16) === 0) {
    ctx.lineTo(x, y);
  } else {
    ctx.moveTo(x, y);
  }
  // bottom right
  x = cx + halfHorizDistance;
  y = cy + halfSize;
  if ((mask & 32) === 0) {
    ctx.lineTo(x, y);
  } else {
    ctx.moveTo(x, y);
  }
  // top right
  x = cx + halfHorizDistance;
  y = cy - halfSize;
  if ((mask & 1) === 0) {
    ctx.lineTo(x, y);
  } else {
    ctx.moveTo(x, y);
  }
  // top
  x = cx;
  y = cy - size;
  if ((mask & 2) === 0) {
    ctx.lineTo(x, y);
  } else {
    ctx.moveTo(x, y);
  }
}

// Draw a hexagon of size given, from the center point cp = {x, y},
// on the canvas context ctx.
// gs is the GraphicState.
function pathFromHex(gs, cp,
                     hexHorizDistance, hexVertDistance) {
  var ctx = gs.ctx; var size = gs.hexSize;
  ctx.beginPath();
  partialPathFromHex(gs, cp, 0, hexHorizDistance, hexVertDistance);
}

// Paint a white line around `tiles`
// (a map from tile keys (see keyFromTile) representing the coordinates of a
// hexagon, to a truthy value).
// Requires a canvas context `ctx` and the size of a hexagon
// (ie, the radius of the smallest disk containing the hexagon).
// gs is the GraphicState.
function paintAroundTiles(gs, tiles, color) {
  var ctx = gs.ctx; var size = gs.hexSize; var origin = gs.origin;
  var hexHorizDistance = size * Math.sqrt(3);
  var hexVertDistance = size * 3/2;
  pathFromTiles(gs, tiles, hexHorizDistance, hexVertDistance, /*noisy*/ true);
  ctx.strokeStyle = color || 'white';
  ctx.stroke();
}

// Paint each tile, and paint links from currentTile.
// tiles: map from "q:r" to truthy values.
// gs is the GraphicState.
function paintSelectedTile(gs, tiles) {
  var ctx = gs.ctx; var size = gs.hexSize; var origin = gs.origin;
  // Show tiles controlled by a player.
  if (currentTile != null && playerCamp != null) {
    paintTileHexagon(gs, currentTile, campHsl(playerCamp, 50, 40), 5);
    var from = pixelFromTile(currentTile, origin, size);
    for (var tileKey in tiles) {
      var to = pixelFromTile(terrain.tileFromKey(tileKey), origin, size);
      paintMouseMovement(gs, from, to, 'rgba(200,200,200,0.5)');
    }
  }
  for (var tileKey in tiles) {
    var color = 'rgba(255,255,255,0.3)';
    if (terrain.transitionTile(currentTile, terrain.tileFromKey(tileKey))) {
      color = 'rgba(255,140,140,0.3)';
    }
    paintTileHexagon(gs, terrain.tileFromKey(tileKey), color, 5);
  }
}

// Same as above, with the straight line algorithm.
// gs is the GraphicState.
function paintStraightAroundTiles(gs, tiles, color) {
  var ctx = gs.ctx; var size = gs.hexSize; var origin = gs.origin;
  var hexHorizDistance = size * Math.sqrt(3);
  var hexVertDistance = size * 3/2;
  straightPathFromTiles(gs, tiles, hexHorizDistance, hexVertDistance);
  ctx.strokeStyle = color || 'white';
  ctx.stroke();
}

// gs is the GraphicState.
function paintTileHexagon(gs, tile, color, lineWidth) {
  var ctx = gs.ctx; var size = gs.hexSize; var origin = gs.origin;
  var hexHorizDistance = size * Math.sqrt(3);
  var hexVertDistance = size * 3/2;
  var cp = pixelFromTile(tile, origin, size);
  var radius = hexVertDistance >> 2;
  ctx.beginPath();
  ctx.arc(cp.x, cp.y, radius, 0, 2*Math.PI, true);
  ctx.closePath();
  ctx.strokeStyle = color;
  ctx.lineWidth = lineWidth? lineWidth: 3;
  ctx.stroke();
  ctx.lineWidth = 1;
}

var mπd3 = - Math.PI / 3;   // Minus PI divided by 3.


// Paint on a canvas with hexagonal tiles.
// gs is the GraphicState.
function paintTilesRaw(gs, end) {
  var width = gs.width;
  var height = gs.height;
  // The `origin` {x0, y0} is the position of the top left pixel on the screen,
  // compared to the pixel (0, 0) on the map.
  var ctx = gs.ctx; var size = gs.hexSize; var origin = gs.origin;
  var imgdata = ctx.getImageData(0, 0, width, height);
  var data = imgdata.data;
  for (var y = 0; y < height; y++) {
    for (var x = 0; x < width; x++) {
      var tilePos = tileFromPixel({ x:x, y:y }, origin, size);
      var t = terrain.tile(tilePos);
      var color = [0, 0, 0];
      if (t.t == element.earth) {
        color = [0, 180, 0];
      } else if (t.t == element.fire) {
        color = [180, 0, 0];
      } else if (t.t == element.air) {
        color = [180, 100, 0];
      } else if (t.t == element.water) {
        color = [50, 50, 180];
      }
      // Pixel noise
      var position = (x + y * width) * 4;
      var pixelDelta = 40;
      for (var i = 0; i < 3; i++) {
        color[i] += ((Math.random() * pixelDelta)|0) - (pixelDelta >> 1);
        data[position + i] = color[i];
      }
      data[position + 3] = 255;
    }
  }
  ctx.putImageData(imgdata, 0, 0);
  paintNoise(gs, function() {
    paintResources(gs);
    end();
  });
}

// Map from "q:r" tiles on the screen to truthy values.
var allTiles = null
var visibleTiles = null;
function computeVisibleTiles(gs) {
  if (visibleTiles !== null) { return; }
  allTiles = Object.create(null);
  visibleTiles = Object.create(null);
  var width = gs.width;
  var height = gs.height;
  // The `origin` {x0, y0} is the position of the top left pixel on the screen,
  // compared to the pixel (0, 0) on the map.
  var ctx = gs.ctx; var size = gs.hexSize; var origin = gs.origin;
  // This is a jigsaw. We want the corner tiles of the screen.
  var tilePos = tileFromPixel({ x:0, y:0 }, origin, size);
  var centerPixel = pixelFromTile({ q: tilePos.q, r: tilePos.r-1 },
    origin, size);
  var cx = centerPixel.x;
  var cy = centerPixel.y;
  var hexHorizDistance = size * Math.sqrt(3);
  var hexVertDistance = size * 3/2;

  var offLeft = true;     // Each row is offset from the row above.
  var cx = centerPixel.x;
  var cy = centerPixel.y;
  while (cy - hexVertDistance < height) {
    while (cx - hexHorizDistance < width) {
      tilePos = tileFromPixel({ x:cx, y:cy }, origin, size);
      allTiles[terrain.keyFromTile(tilePos)] = true;
      if ((cx - hexHorizDistance/2 > 0) && (cx + hexHorizDistance/2 < gs.width)
        &&(cy - hexVertDistance/2 > 0) && (cy + hexVertDistance/2 < gs.height)) {
        visibleTiles[terrain.keyFromTile(tilePos)] = true;
      }
      cx += hexHorizDistance;
    }
    cy += hexVertDistance;
    cx = centerPixel.x;
    if (offLeft) {
      cx -= hexHorizDistance / 2;   // This row is offset.
      offLeft = false;
    } else {
      offLeft = true;
    }
    cx = cx|0;
    cy = cy|0;
  }
}

// Paint all map with…
function paintEarth(gs) {
  gs.ctx.fillStyle = '#7a4';
  gs.ctx.fill();
}
function paintFire(gs) {
  gs.ctx.fillStyle = '#b94';
  gs.ctx.fill();
}
function paintAir(gs) {
  gs.ctx.fillStyle = '#974';
  gs.ctx.fill();
}
function paintWater(gs) {
  gs.ctx.fillStyle = '#44a';
  gs.ctx.fill();
}

// Paint on a canvas with smoothed hexagonal tiles.
// gs is the GraphicState.
function paintTilesSmooth(gs, end) {
  var ctx = gs.ctx; var size = gs.hexSize; var origin = gs.origin;
  var hexHorizDistance = size * Math.sqrt(3);
  var hexVertDistance = size * 3/2;

  var painterFromTileType = [];
  painterFromTileType[element.earth] = paintEarth;
  painterFromTileType[element.fire] = paintFire;
  painterFromTileType[element.air] = paintAir;
  painterFromTileType[element.water] = paintWater;

  for (var tileType = 0; tileType < 4; tileType++) {
    var tiles = Object.create(null);
    // Add all tiles of that type.
    for (var tileKey in allTiles) {
      var tile = terrain.tileFromKey(tileKey);
      var t = terrain.tile(tile);
      if (t.t >= tileType) {
        tiles[tileKey] = true;
      }
    }
    pathFromTiles(gs, tiles, hexHorizDistance, hexVertDistance, /*noisy*/ true);

    // Paint that specific tile.
    ctx.save();
    ctx.clip();
    painterFromTileType[tileType](gs);
    ctx.restore();
  }

  paintNoise(gs, function() {
    paintResources(gs);
    end();
  });
}

// Paint some random noise.
function paintNoise(gs, end) {
  var seed = (Math.random() * 1000)|0;
  var transparency = 0.3;
  var svg = '<svg xmlns="http://www.w3.org/2000/svg" width="' + gs.width + '" height="' + gs.height + '"><filter id="a" x="0" y="0" width="100%" height="100%"><feTurbulence type="fractalNoise" baseFrequency=".01" numOctaves="5" seed="' + seed + '"/><feColorMatrix values="1 0 0 0 0 1 0 0 0 0 1 0 0 0 0 0 0 0 0 ' + transparency + '"/></filter><rect width="100%" height="100%" filter="url(#a)"/></svg>';
  var image = new Image();
  image.src = 'data:image/svg+xml;base64,' + btoa(svg);
  image.onload = function() {
    gs.ctx.drawImage(image, 0, 0);
    end();
  };
}

// Paint visible tiles' resources.
function paintResources(gs) {
  var width = gs.width;
  var height = gs.height;
  // The `origin` {x0, y0} is the position of the top left pixel on the screen,
  // compared to the pixel (0, 0) on the map.
  var ctx = gs.ctx; var size = gs.hexSize; var origin = gs.origin;
  // This is a jigsaw. We want the corner tiles of the screen.
  var tilePos = tileFromPixel({ x:0, y:0 }, origin, size);
  var centerPixel = pixelFromTile({ q: tilePos.q, r: tilePos.r-1 },
    origin, size);
  var cx = centerPixel.x;
  var cy = centerPixel.y;
  var hexHorizDistance = size * Math.sqrt(3);
  var hexVertDistance = size * 3/2;

  for (var i = 0; i < 9; i++) {
    var offLeft = true;     // Each row is offset from the row above.
    var cx = centerPixel.x;
    var cy = centerPixel.y;
    while (cy - hexVertDistance < height) {
      while (cx - hexHorizDistance < width) {
        tilePos = tileFromPixel({ x:cx, y:cy }, origin, size);
        var t = terrain.tile(tilePos);

        if (t.r) {
          ctx.beginPath();
          ctx.arc(cx, cy, 10, 0, 2*Math.PI, true);
          ctx.closePath();
          ctx.fillStyle = 'black';
          ctx.fill();
        }

        cx += hexHorizDistance;
      }
      cy += hexVertDistance;
      cx = centerPixel.x;
      if (offLeft) {
        cx -= hexHorizDistance / 2;   // This row is offset.
        offLeft = false;
      } else {
        offLeft = true;
      }
      cx = cx|0;
      cy = cy|0;
    }
  }
}

// gs is the GraphicState.
function paintLinks(gs) {
  for (var tileKey in visibleTiles) {
    var tile = terrain.tileFromKey(tileKey);
    var terrainTile = terrain.tile(tile);
    var from = pixelFromTile(tile, gs.origin, gs.hexSize);
    for (var i = 0; i < terrainTile.n.length; i++) {
      var next = terrainTile.n[i];
      var to = pixelFromTile(terrain.tileFromKey(next), gs.origin, gs.hexSize);
      paintMouseMovement(gs, from, to, campHsl(terrainTile.c, 50, 40));
    }
  }
}

var tilesPaintCache;

function paintTilesRawCached(gs, end) {
  if (tilesPaintCache == null) {
    tilesPaintCache = document.createElement('canvas');
    tilesPaintCache.width = gs.width;
    tilesPaintCache.height = gs.height;
    var gsBuffer = makeGraphicState(tilesPaintCache);
    gsBuffer.hexSize = gs.hexSize;
    gsBuffer.origin = gs.origin;
    paintTilesSmooth(gsBuffer, function() {
      gs.ctx.drawImage(tilesPaintCache, 0, 0);
      end();
    });
  } else {
    gs.ctx.drawImage(tilesPaintCache, 0, 0);
    end();
  }
}


// Paint on a canvas.
// gs is the GraphicState.
function paint(gs) {
  paintTilesRawCached(gs, function(){
    paintIntermediateUI(gs);
  });
  paintIntermediateUI(gs);
}

// Top left pixel of the canvas related to the window.
var canvasOrigin = {
  clientX: canvas.offsetLeft,
  clientY: canvas.offsetTop
};

// Take a {clientX, clientY} pixel position in the page.
// Return a {x, y} pixel position from the top left pixel of the canvas.
function pixelFromClient(client) {
  return {
    x: client.clientX - canvasOrigin.clientX,
    y: client.clientY - canvasOrigin.clientY
  };
}

// gs is the GraphicState.
// from, to: pixels {x,y} from top left of canvas.
// color: CSS color as a string.
function paintMouseMovement(gs, startFrom, to, color) {
  color = color || '#333';
  var from = { x: startFrom.x, y: startFrom.y };
  var ctx = gs.ctx;
  var deltaX = to.x - from.x;
  var deltaY = to.y - from.y;
  var portions = 20;
  var dx = deltaX / portions;
  var dy = deltaY / portions;
  ctx.strokeStyle = color;
  ctx.lineCap = 'round';
  for (var i = 0; i < portions; i++) {
    ctx.beginPath();
    ctx.moveTo(from.x, from.y);
    from.x += dx;
    from.y += dy;
    ctx.lineTo(from.x, from.y);
    var quotient = i / portions - 0.5;
    ctx.lineWidth = 7 * (4 * quotient * quotient + 0.1);
    ctx.stroke();
  }
  ctx.beginPath();
  ctx.lineTo(to.x, to.y);
  ctx.lineWidth = 5;
  ctx.stroke();
  ctx.lineWidth = 1;
}

var showTitleScreen = true;
setTimeout(function() { showTitleScreen = false; paint(gs); }, 8000);

// Paint the UI for population, winner information, etc.
// gs is the GraphicState.
function paintIntermediateUI(gs) {
  var ctx = gs.ctx; var size = gs.hexSize; var origin = gs.origin;
  paintLinks(gs);
  // Paint the set of accessible tiles.
  paintSelectedTile(gs, accessibleTiles);
  if (currentlyDragging) {
    var from = pixelFromTile(tileFromPixel(pixelFromClient(startMousePosition),
          gs.origin, gs.hexSize), gs.origin, gs.hexSize);
    var to = pixelFromClient(lastMousePosition);
    paintMouseMovement(gs, from, to, '#333');
  }
  paintCamps(gs);
  paintTileMessages(gs);
  if (gameOver !== undefined) {
    drawTitle(gs, [
        gameOver.winType + " Victory.",
        (gameOver.winners[0] === playerCamp
         ? ("YOU WON! (" + nth(localStorage.getItem('gamesWon')) + " win!)")
         : ("YOU NEARLY WON! " +
            "(" + nth(gameOver.winners.indexOf(playerCamp) + 1) + " place!)")),
        "You can reload to engage in the next game!"],
        campHsl(gameOver.winners[0]));
  }
  if (showTitleScreen) {
    drawTitle(gs, ["Welcome to Thaddée Tyl's…", "A Verse On Leverage",
        "Give me a lever long enough; I shall lift the universe!"]);
  }
  displayedPaintContext.drawImage(canvas, 0, 0);
}

// Return the string corresponding to a rank (eg, 1→1st, etc.).
function nth(n) {
  n = n|0;
  var strNum = ''+n;
  if (strNum.charCodeAt(strNum.length - 2) === 49) { return strNum + 'th'; }
  var mod = n % 10;
  if (mod === 1) { return strNum + 'st';
  } else if (mod === 2) { return strNum + 'nd';
  } else if (mod === 3) { return strNum + 'rd';
  } else { return strNum + 'th'; }
}

// Draw three lines of text from a list of strings on the screen.
// gs is the GraphicState.
function drawTitle(gs, lines, color) {
  var ctx = gs.ctx;
  var width = gs.width;
  var height = gs.height;
  var line1 = lines[0];
  var line2 = lines[1];
  var line3 = lines[2];
  ctx.fillStyle = color || 'black';
  if (color) { ctx.strokeStyle = 'black'; }
  ctx.textAlign = 'center';
  ctx.font = (height / 16) + 'px "Linux Biolinum", sans-serif';
  ctx.fillText(line1, width / 2, height * 1/3);
  if (color) { ctx.strokeText(line1, width / 2, height * 1/3); }
  ctx.font = (height / 8) + 'px "Linux Biolinum", sans-serif';
  ctx.fillText(line2, width / 2, height * 13/24);
  if (color) { ctx.strokeText(line2, width / 2, height * 13/24); }
  ctx.font = (height / 16) + 'px "Linux Biolinum", sans-serif';
  ctx.fillText(line3, width / 2, height * 2/3);
  if (color) { ctx.strokeText(line3, width / 2, height * 2/3); }
  ctx.textAlign = 'start';
}

// Map from "size:q:r" places to textual information.
var mapIndex = Object.create(null);

// Insert places = {"tileKey": "Place name"} into mapIndex.
function fillMapIndex(places) {
  for (var tileKey in places) {
    mapIndex['2:' + tileKey] = places[tileKey];
  }
}

function drawMapPlaces(gs) {
  var ctx = gs.ctx;
  ctx.fillStyle = 'black';
  ctx.textAlign = 'center';
  for (var tileSizeKey in mapIndex) {
    var e = tileSizeKey.split(':');
    var size = +e[0];
    var tile = { q: e[1]|0, r: e[2]|0 };
    var pixel = pixelFromTile(tile, gs.origin, gs.hexSize);
    var text = mapIndex[tileSizeKey];
    ctx.font = 'italic '
      + (gs.hexSize*size*7) + 'px "Linux Biolinum", sans-serif';
    ctx.fillText(text, pixel.x, pixel.y - 15);
  }
  ctx.textAlign = 'start';
}


// Animations.

var numberOfHumanAnimations = 20;
var humanAnimation = new Array(numberOfHumanAnimations);
function initHumans() {
  for (var i = 0; i < numberOfHumanAnimations; i++) {
    // Position is in a square of width 1.
    humanAnimation[i] = {
      x: Math.random(),
      y: Math.random(),
      targetx: Math.random(),
      targety: Math.random(),
      period: (Math.random() * 20 + 3)|0,
      tick: 0
    };
  }
}
initHumans();

// Update animations related to humans. See humanAnimation.
function updateHumans() {
  for (var i = 0; i < humanAnimation.length; i++) {
    var human = humanAnimation[i];
    human.x += (human.targetx - human.x) / human.period;
    human.y += (human.targety - human.y) / human.period;
    human.tick++;
    if (human.tick > human.period) {
      // New target.
      human.targetx = Math.random();
      human.targety = Math.random();
      human.tick = 0;
    }
  }
}

// Pixels currently on display. Useful for smooth animations.
var displayedPaint = document.createElement('canvas');
displayedPaint.width = gs.width;
displayedPaint.height = gs.height;
var displayedPaintContext = displayedPaint.getContext('2d');

// Paint the animation of people moving around.
// gs is the GraphicState.
function paintHumans(gs, humanityData) {
  var ctx = gs.ctx; var size = gs.hexSize; var origin = gs.origin;
  if (size < 20) { return; }
  ctx.drawImage(displayedPaint, 0, 0);
  for (var tileKey in humanityData) {
    var tileKeyCoord = tileKey.split(':');
    var q = +tileKeyCoord[0];
    var r = +tileKeyCoord[1];
    var human = humanityData[tileKey];
    var tile = terrain.tile(terrain.tileFromKey(tileKey));
    var centerPixel = pixelFromTile({ q:q, r:r }, origin, size);
    var cx = centerPixel.x;
    var cy = centerPixel.y;
    // Count different manufacture to show.
    var ownManufacture = [];
    var manufactures = [2,4,8,16,32,64];
    for (var mi = 0; mi < manufactures.length; mi++) {
      if ((human.o & manufactures[mi]) !== 0) {
        ownManufacture.push(manufactures[mi]);
      }
    }
    var onABoat = (tile.type === tileTypes.water
        || tile.type === tileTypes.swamp)
        && (human.o & manufacture.boat) !== 0;
    var flyingOverWater = (tile.type === tileTypes.water
        || tile.type === tileTypes.swamp)
        && (human.o & manufacture.plane) !== 0;
    var number = human.h;
    if (number > humanAnimation.length) { number = humanAnimation.length; }
    // Paint people.
    for (var i = 0; i < number; i++) {
      var animation = humanAnimation[
        Math.abs(i+q^r^human.f) % humanAnimation.length];
      var animx = (cx - size + animation.x * 2 * size)|0;
      var animy = (cy - size + animation.y * 2 * size)|0;
      var shownManufacture = -1;
      if (onABoat) {
        shownManufacture = manufacture.boat;
      } else if (flyingOverWater) {
        shownManufacture = manufacture.plane;
      } else if (ownManufacture.length > 0) {
        shownManufacture = ownManufacture[i % ownManufacture.length];
      }
      paintHuman(gs, shownManufacture, tile, animx, animy, size);
    }
  }
}

function paintHuman(gs, shownManufacture, tile, animx, animy) {
  var ctx = gs.ctx; var size = gs.hexSize;
  var pixel = size/20;
  if (shownManufacture < 0) {
    ctx.fillStyle = 'black';
    ctx.fillRect(animx, animy, pixel, 2*pixel);
  } else if (shownManufacture === manufacture.boat) {
    ctx.fillStyle = '#aaf';
    ctx.fillRect(animx - pixel, animy - pixel, pixel, pixel);
    ctx.fillRect(animx, animy, 7*pixel, pixel);
    ctx.fillRect(animx + 7*pixel, animy - pixel, pixel, pixel);
  } else if (shownManufacture === manufacture.car) {
    ctx.fillStyle = '#420';
    ctx.fillRect(animx, animy, 3*pixel, 2*pixel);
  } else if (shownManufacture === manufacture.plane) {
    ctx.fillStyle = '#edf';
    ctx.fillRect(animx - pixel, animy - pixel, 2*pixel, pixel);
    ctx.fillRect(animx, animy, 9*pixel, pixel);
    ctx.fillRect(animx + 5*pixel, animy - pixel, pixel, pixel);
    ctx.fillRect(animx + 3*pixel, animy + pixel, pixel, pixel);
  } else if (shownManufacture === manufacture.artillery) {
    ctx.fillStyle = '#425';
    ctx.fillRect(animx - 2*pixel, animy, 5*pixel, 2*pixel);
    ctx.fillRect(animx, animy - 1*pixel, 5*pixel, 1*pixel);
  } else if (shownManufacture === manufacture.gun) {
    ctx.fillStyle = '#440';
    ctx.fillRect(animx, animy, pixel, 2*pixel);
  }
}

function animateHumans() {
  paintHumans(gs, humanityData);
  updateHumans();
  paintMovementAnimations();
}
//var humanAnimationTimeout = setInterval(animateHumans, 100);

// from:{x,y}, to:{x,y}, velocity, drawFunction: function(){}.
function InterpolationAnimation(gs, from, to, velocity, drawFunction) {
  this.gs = gs;
  this.from = from; this.to = to;
  this.pos = { x: this.from.x, y: this.from.y };
  this.velocity = velocity;
  this.deltaX = to.x - from.x;
  this.deltaY = to.y - from.y;
  this.length =
    Math.sqrt(this.deltaX * this.deltaX + this.deltaY * this.deltaY);
  this.portions = this.length / velocity;
  this.usedPortions = 0;
  this.dx = this.deltaX / this.portions;
  this.dy = this.deltaY / this.portions;
  this.normalizedDx = this.deltaX / this.length;
  this.normalizedDy = this.deltaY / this.length;
  this.drawFunction = drawFunction;
}
InterpolationAnimation.prototype = {
  draw: function() {
    this.drawFunction();
    this.pos.x += this.dx;
    this.pos.y += this.dy;
    this.usedPortions++;
    // If we're past our final location, we clear this up.
    if (this.usedPortions > this.portions) {
      var animationIndex = movementAnimations.indexOf(this);
      movementAnimations.splice(animationIndex, 1);
    }
  }
};

function paintMovementAnimations() {
  for (var i = 0; i < movementAnimations.length; i++) {
    movementAnimations[i].draw();
  }
}

// List of InterpolationAnimation instances.
var movementAnimations = [];
var animationVelocity = 32; // pixels

function drawShell() {
  var ctx = this.gs.ctx;
  ctx.lineWidth = 2;
  var segments = Math.min(this.usedPortions, 8);
  var x = this.pos.x;
  var y = this.pos.y;
  var segmentSize = 4; // pixels
  var incrx = segmentSize * this.normalizedDx;
  var incry = segmentSize * this.normalizedDy;
  for (var i = 9; i > (8 - segments); i--) {
    ctx.beginPath();
    ctx.moveTo(x, y);
    x -= incrx;
    y -= incry;
    ctx.lineTo(x, y);
    ctx.strokeStyle = 'rgba(0,0,0,0.' + i + ')';
    ctx.stroke();
  }
}

// artilleryFire: map from a "q:r" target to a list of "q:r" artilleries.
function addShells(movementAnimations, artilleryFire) {
  for (var targetTileKey in artilleryFire) {
    var tileKeys = artilleryFire[targetTileKey];
    for (var i = 0; i < tileKeys.length; i++) {
      var tileKey = tileKeys[i];
      // Check that we can see it.
      if (visibleTiles[tileKey]
       || visibleTiles[targetTileKey]) {
        var fromTile = terrain.tileFromKey(tileKey);
        var toTile = terrain.tileFromKey(targetTileKey);
        var from = pixelFromTile(fromTile, gs.origin, gs.hexSize);
        var to = pixelFromTile(toTile, gs.origin, gs.hexSize);
        var shellAnimation = new InterpolationAnimation(
          gs, from, to, animationVelocity, drawShell
        );
        movementAnimations.push(shellAnimation);
      }
    }
  }
}





// gs is the GraphicState.
function paintCamps(gs) {
  var ctx = gs.ctx; var size = gs.hexSize; var origin = gs.origin;
  var visibleCamps = new Array(numberOfCamps);
  for (var i = 0; i < numberOfCamps; i++) { visibleCamps[i] = {}; }
  for (var tileKey in visibleTiles) {
    var tile = terrain.tileFromKey(tileKey);
    var humans = terrain.tile(tile);
    if (humans.c !== (void 0)) {
      var cp = pixelFromTile(tile, gs.origin, gs.hexSize);
      var radius = 10;

      ctx.beginPath();
      ctx.arc(cp.x, cp.y, radius, 0, 2*Math.PI, true);
      ctx.closePath();
      ctx.fillStyle = campHsl(humans.c, 50, 40);
      ctx.fill();

      ctx.beginPath();
      ctx.arc(cp.x, cp.y, radius - 2, 0, 2*Math.PI, true);
      ctx.closePath();
      ctx.strokeStyle = 'white';
      ctx.stroke();

      ctx.font = radius + 'px sans-serif';
      ctx.textAlign = 'center';
      ctx.fillStyle = 'white';
      var power = '' + humans.p;
      var powerSize = ctx.measureText(power).width;
      ctx.fillText(power, cp.x, cp.y + radius / 4);
    }
  }
}

// Return CSS hsl string.
// saturation: number from 0 to 100.
// lightness: number from 0 to 100.
function campHsl(camp, saturation, lightness, alpha) {
  if (saturation == null) { saturation = 100; }
  if (lightness == null) { lightness = 45; }
  if (alpha == null) { alpha = 1; }
  return 'hsla(' + campHueCreator9000(camp)
      + ',' + saturation + '%,' + lightness + '%,' + alpha + ')';
}

// The name is not a joke.
function campHueCreator9000(camp) {
  if (camp <= 0) { return 270;
  } else { return (campHueCreator9000(camp - 1) + 60) % 360;
  }
}

// Map from tile = "q:r" to {message, timeout} (including timeout IDs).

// Add textual bubble set in tileMessages
// (a map from tile = "q:r" to {message, timeout})
// to tiles in tileKeys = ["q:r"]
// from messages = [message]
function addHumanMessages(tileMessages, tileKeys, messages) {
  var timeout;
  for (var i = 0; i < tileKeys.length; i++) {
    var tileKey = tileKeys[i];
    if (tileMessages[tileKey]) {
      clearTimeout(tileMessages[tileKey].timeout);
    }
    // Pick message.
    var msg = messages[(messages.length * Math.random())|0];
    // Set timeout.
    tileMessages[tileKey] = {
      message: msg,
      timeout: setTimeout((function (tileKey) {
        return function removeTimeout() {
          delete tileMessages[tileKey];
          paint(gs);
        };
      }(tileKey)), 2000)
    };
  }
}

// Given a tileKey = "q:r" and a message, show a textual bubble.
// gs is the GraphicState.
function paintMessage(gs, tileKey, msg) {
  var ctx = gs.ctx; var size = gs.hexSize; var origin = gs.origin;
  ctx.font = '14px "Linux Biolinum", sans-serif';
  var msgSize = ctx.measureText(msg).width;
  // Find the pixel to start from.
  var center = pixelFromTile(terrain.tileFromKey(tileKey), origin, size);
  var x = center.x + size/4;
  var y = center.y - size/4;
  ctx.beginPath();
  ctx.moveTo(x, y);
  ctx.lineTo(x + 2, y - 10);
  ctx.lineTo(x - 12, y - 10);
  ctx.lineTo(x - 10, y - 40);
  ctx.lineTo(x + msgSize + 10, y - 35);
  ctx.lineTo(x + msgSize, y - 10);
  ctx.lineTo(x + 12, y - 10);
  ctx.closePath();
  ctx.fillStyle = 'rgba(0,0,0,0.8)';
  ctx.fill();
  ctx.strokeStyle = 'white';
  ctx.strokeText(msg, x - 4, y - 20);
}

// Paints messages from warTiles and starvedTiles.
// gs is the GraphicState.
function paintTileMessages(gs) {
  var ctx = gs.ctx; var size = gs.hexSize; var origin = gs.origin;
  //for (var tileKey in warTiles) {
  //  paintMessage(gs, tileKey, warTiles[tileKey].message);
  //}
}




// Initialization and event management.
//

// Control buttons.


window.onkeydown = function keyInputManagement(event) {
  var voidCache = false;
  var redraw = false;
  if (event.keyCode === 39 || event.keyCode === 68) {           // → D
    gs.origin.x0 += (gs.width / 2)|0;
    redraw = true;
  } else if (event.keyCode === 38 || event.keyCode === 87) {    // ↑ W
    gs.origin.y0 -= (gs.height / 2)|0;
    redraw = true;
  } else if (event.keyCode === 37 || event.keyCode === 65) {    // ← A
    gs.origin.x0 -= (gs.width / 2)|0;
    redraw = true;
  } else if (event.keyCode === 40 || event.keyCode === 83) {    // ↓ S
    gs.origin.y0 += (gs.height / 2)|0;
    redraw = true;
  } else if (event.keyCode === 187 || event.keyCode === 61) {  // +=
    // Zoom.
    gs.hexSize *= 2;
    gs.origin.x0 = gs.origin.x0 * 2 + (gs.width / 2)|0;
    gs.origin.y0 = gs.origin.y0 * 2 + (gs.height / 2)|0;
    voidCache = true;
    redraw = true;
  } else if (event.keyCode === 173 || event.keyCode === 189
          || event.keyCode === 109 || event.keyCode === 219
          || event.keyCode === 169) {   // -
    // Unzoom.
    gs.hexSize = gs.hexSize / 2;
    gs.origin.x0 = (gs.origin.x0 / 2 - gs.width / 4)|0;
    gs.origin.y0 = (gs.origin.y0 / 2 - gs.height / 4)|0;
    voidCache = true;
    redraw = true;
  } else if (event.keyCode === 84) {    // T
    enterMode(selectionModes.travel);
  } else if (event.keyCode === 67) {    // C
    enterMode(selectionModes.build);
  } else if (event.keyCode === 70) {    // F
    enterMode(selectionModes.split);
  } else if (event.keyCode === 192) {   // `
    sendBuild(currentTile, null);   // Destroy building.
  } else if (event.keyCode === 27) {    // ESC
    // Close all UI panes.
    enterMode(selectionModes.normal);
    helpPane.style.display = 'none';
  } else if (48 <= event.keyCode && event.keyCode <= 57) {
    sendBuild(currentTile, buildHotKeys[event.keyCode]);
  }
  if (voidCache) {
    cachedPaint = {};
  }
  if (redraw) {
    paint(gs);
  }
};


// Selection.

// Map from tileKey to camp index.
var accessibleTiles;
var currentTile;  // {q,r}
var targetTile;

function mouseSelection(event) {
  gs.canvas.removeEventListener('mousemove', mouseDrag);
  gs.canvas.removeEventListener('mouseup', mouseSelection);
};

// Map dragging.

function mouseDrag(event) {
  gs.canvas.style.cursor = 'move';
  gs.canvas.removeEventListener('mousemove', mouseDrag);
  gs.canvas.removeEventListener('mouseup', mouseSelection);
  gs.canvas.addEventListener('mouseup', mouseEndDrag);
  gs.canvas.addEventListener('mousemove', dragMap);
  currentlyDragging = true;
  resetDragVector();
  dragVelTo = setInterval(resetDragVector, dragVelInterval);
}

function mouseEndDrag(event) {
  gs.canvas.style.cursor = '';
  gs.canvas.removeEventListener('mousemove', dragMap);
  gs.canvas.removeEventListener('mouseup', mouseEndDrag);
  currentlyDragging = false;
  clearInterval(dragVelTo);
  computeDragVelocity();
  inertiaDragMap();

  gameState.move({
    type: planType.move,
    at: terrain.keyFromTile(currentTile),
    to: terrain.keyFromTile(targetTile),
  });
  paint(gs);
}

gs.canvas.onmousedown = function mouseInputManagement(event) {
  showTitleScreen = false;
  var posTile = tileFromPixel(pixelFromClient(event), gs.origin, gs.hexSize);
  // Move there.
  currentTile = posTile;
  accessibleTiles = terrain.accessibleTiles(currentTile);
  paint(gs);

  if (event.button === 0) {
    gs.canvas.addEventListener('mouseup', mouseSelection);
    gs.canvas.addEventListener('mousemove', mouseDrag);
    startMousePosition.clientX = event.clientX;
    startMousePosition.clientY = event.clientY;
    lastMousePosition.clientX = event.clientX;
    lastMousePosition.clientY = event.clientY;
  } else if (event.button === 2) {
    // FIXME: Direct move.
    mouseSelection(event);
  }
};
gs.canvas.oncontextmenu = function(e) { e.preventDefault(); };

(function() {
  var requestAnimationFrame = window.requestAnimationFrame ||
  window.mozRequestAnimationFrame || window.webkitRequestAnimationFrame ||
  window.msRequestAnimationFrame || function(f) { setTimeout(f, 0) };
  window.requestAnimationFrame = requestAnimationFrame;
}());

var startMousePosition = { clientX: 0, clientY: 0 };
var lastMousePosition = { clientX: 0, clientY: 0 };
var drawingWhileDragging = false;
var currentlyDragging = false;
function dragMap(event) {
  if (drawingWhileDragging) { return; }
  drawingWhileDragging = true;
  var velocityX = (lastMousePosition.clientX - event.clientX);
  var velocityY = (lastMousePosition.clientY - event.clientY);
  // Save the last mouse position.
  lastMousePosition.clientX = event.clientX;
  lastMousePosition.clientY = event.clientY;
  targetTile = tileFromPixel(pixelFromClient(lastMousePosition),
      gs.origin, gs.hexSize);
  paint(gs);
  requestAnimationFrame(function() {
    drawingWhileDragging = false;
  });
}

// Prevents Chrome from displaying a silly text cursor
// while dragging on the canvas.
canvas.onselectstart = function() { return false; }

// Inertial map dragging.

var dragVelocity = [0, 0];
var dragVector = [0, 0];
var dragTime = 0;
var dragVelTo; // drag timeout.
var dragVelInterval = 200; // 200ms.

function resetDragVector() {
  dragTime = Date.now();
  dragVector[0] = gs.origin.x0;
  dragVector[1] = gs.origin.y0;
}

function computeDragVelocity() {
  dragTime = Date.now() - dragTime;
  dragVector[0] = gs.origin.x0 - dragVector[0];
  dragVector[1] = gs.origin.y0 - dragVector[1];
  var nbFrames = dragTime * 0.03;  // 0.03 frames/ms
  dragVelocity[0] = (dragVector[0] / nbFrames)|0;
  dragVelocity[1] = (dragVector[1] / nbFrames)|0;
}

function inertiaDragMap() {
  gs.origin.x0 += dragVelocity[0];
  gs.origin.y0 += dragVelocity[1];
  dragVelocity[0] = (dragVelocity[0] / 1.1)|0;
  dragVelocity[1] = (dragVelocity[1] / 1.1)|0;
  paint(gs);
  requestAnimationFrame(function() {
    if (dragVelocity[0] !== 0 || dragVelocity[1] !== 0) {
      inertiaDragMap();
    }
  });
}

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
