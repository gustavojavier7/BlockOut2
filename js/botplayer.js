// Simple BotPlayer implementation for demo mode
var DEMO_MODE = false;

// Heuristic coefficients ported from the original C++ bot
var puzzleCoef = 11.7;
var linesCoef = 0.7;
var smoothCoef = -0.28;
var holeCoef = -1.9;
var peakCoef = -0.8;

const BOT_ROTATIONS = [
  [0, 0, 0],
  [90, 0, 0], [180, 0, 0], [270, 0, 0],
  [0, 90, 0], [0, 180, 0], [0, 270, 0],
  [0, 0, 90], [0, 0, 180], [0, 0, 270],
  [90, 90, 0], [90, 180, 0], [90, 270, 0],
  [180, 90, 0], [180, 180, 0], [180, 270, 0],
  [270, 90, 0], [270, 180, 0], [270, 270, 0],
  [0, 90, 90], [0, 180, 90], [0, 270, 90],
  [0, 90, 270], [0, 180, 270], [0, 270, 270]
];

function clone_layers(layers) {
  var result = [];
  for (var z = 0; z < layers.length; z++) {
    var layer = [];
    for (var y = 0; y < layers[0].length; y++) {
      layer.push(layers[z][y].slice());
    }
    result.push(layer);
  }
  return result;
}

function column_heights(layers) {
  var depth = layers.length;
  var height = layers[0].length;
  var width = layers[0][0].length;
  var h = [];
  for (var y = 0; y < height; y++) {
    h[y] = [];
    for (var x = 0; x < width; x++) {
      var zz = depth - 1;
      while (zz >= 0 && layers[zz][y][x] == 0) zz--;
      h[y][x] = zz;
    }
  }
  return h;
}

function count_holes(layers, heights) {
  var depth = layers.length;
  var height = layers[0].length;
  var width = layers[0][0].length;
  var holes = 0;
  for (var y = 0; y < height; y++) {
    for (var x = 0; x < width; x++) {
      var top = heights[y][x];
      for (var z = top - 1; z >= 0; z--) {
        if (layers[z][y][x] == 0) holes++;
      }
    }
  }
  return holes;
}

function smoothness(heights) {
  var height = heights.length;
  var width = heights[0].length;
  var s = 0;
  for (var y = 0; y < height; y++) {
    for (var x = 0; x < width; x++) {
      if (x + 1 < width) s += Math.abs(heights[y][x] - heights[y][x + 1]);
      if (y + 1 < height) s += Math.abs(heights[y][x] - heights[y + 1][x]);
    }
  }
  return s;
}

function smoothness_sqr(heights) {
  var height = heights.length;
  var width = heights[0].length;
  var total = 0;
  for (var y = 0; y < height; y++) {
    for (var x = 0; x < width; x++) {
      if (x - 1 >= 0) {
        var d = heights[y][x] - heights[y][x - 1];
        total += d * d;
      }
      if (y - 1 >= 0) {
        var d = heights[y][x] - heights[y - 1][x];
        total += d * d;
      }
      if (x + 1 < width) {
        var d = heights[y][x] - heights[y][x + 1];
        total += d * d;
      }
      if (y + 1 < height) {
        var d = heights[y][x] - heights[y + 1][x];
        total += d * d;
      }
    }
  }
  if (total === 0) total = -10;
  return total / (width * height);
}

function peakness(heights, bias) {
  var height = heights.length;
  var width = heights[0].length;
  var note = 0;
  for (var x = 0; x < width; x++) {
    for (var y = 0; y < height; y++) {
      var h = heights[y][x];
      var ok = true;
      if (x - 1 >= 0 && heights[y][x - 1] - h > bias) ok = false;
      if (x + 1 < width && heights[y][x + 1] - h > bias) ok = false;
      if (y - 1 >= 0 && heights[y - 1][x] - h > bias) ok = false;
      if (y + 1 < height && heights[y + 1][x] - h > bias) ok = false;
      if (ok) note += 1;
    }
  }
  return note;
}

function common_edges(voxels, layers) {
  var set = {};
  for (var i = 0; i < voxels.length; i++) {
    set[voxels[i][0] + ',' + voxels[i][1] + ',' + voxels[i][2]] = true;
  }
  var common = 0;
  var edges = 0;
  var neigh = [[1,0,0],[-1,0,0],[0,1,0],[0,-1,0],[0,0,1],[0,0,-1]];
  for (var i = 0; i < voxels.length; i++) {
    var v = voxels[i];
    for (var n = 0; n < neigh.length; n++) {
      var nx = v[0] + neigh[n][0];
      var ny = v[1] + neigh[n][1];
      var nz = v[2] + neigh[n][2];
      if (set[nx + ',' + ny + ',' + nz]) continue;
      if (nx < 0 || nx >= PIT_WIDTH || ny < 0 || ny >= PIT_HEIGHT || nz < 0 || nz >= PIT_DEPTH) {
        edges++; common++; continue;
      }
      if (layers[nz][ny][nx] !== 0) {
        edges++; common++; continue;
      }
      edges++;
    }
  }
  if (edges === 0) return 0;
  return common / edges;
}

function evaluate_position(voxels) {
  var layers = clone_layers(LAYERS);
  var counts = COUNTS.slice();
  add_voxels(voxels, layers, counts);
  var lines = check_full_layers(layers, counts);
  var h = column_heights(layers);
  var holes = count_holes(layers, h);
  var sm = smoothness_sqr(h);
  var pk = peakness(h, -2);
  var ce = common_edges(voxels, LAYERS);
  var linesNote = linesCoef * lines;
  var smoothNote = smoothCoef * sm;
  var peakNote = peakCoef * pk;
  var holeNote = holeCoef * holes;
  var commonNote = puzzleCoef * ce;
  return linesNote + smoothNote + peakNote + holeNote + commonNote;
}

function best_move() {
  if (typeof console !== 'undefined' && console.log) {
    console.log('[DemoBot] best_move called');
  }
  var best = null;
  var bestScore = -1e9;
  for (var r = 0; r < BOT_ROTATIONS.length; r++) {
    var ang = BOT_ROTATIONS[r].map(function (a) { return a * Math.PI / 180; });
    var mat = get_combined_rotmatrix(ang);
    var bbvox = project_voxels(STATE.piece, 0, 0, 0, mat);
    var bb = bbox_voxels(bbvox);
    for (var x = -bb.x[0]; x <= PIT_WIDTH - 1 - bb.x[1]; x++) {
      for (var y = -bb.y[0]; y <= PIT_HEIGHT - 1 - bb.y[1]; y++) {
        var z = 0;
        var vox = project_voxels(STATE.piece, x, y, z, mat);
        if (is_overlap_layers(vox, PIT_WIDTH, PIT_HEIGHT, PIT_DEPTH, LAYERS))
          continue;
        while (true) {
          var nvox = project_voxels(STATE.piece, x, y, z + 1, mat);
          if (!is_overlap_layers(nvox, PIT_WIDTH, PIT_HEIGHT, PIT_DEPTH, LAYERS)) {
            z++;
            vox = nvox;
          } else break;
        }
        var score = evaluate_position(vox);
        if (score > bestScore) {
          bestScore = score;
          best = { x: x, y: y, z: z, matrix: mat };
        }
      }
    }
  }
  return best;
}

function bot_place(canvas, ctx) {
  if (typeof console !== 'undefined' && console.log) {
    console.log('[DemoBot] bot_place called');
  }
  var mv = best_move();
  if (!mv) { game_over(canvas, ctx); return; }
  STATE.new_x = mv.x;
  STATE.new_y = mv.y;
  STATE.new_z = mv.z;
  STATE.new_matrix = mv.matrix;
  STATE.current_x = mv.x;
  STATE.current_y = mv.y;
  STATE.current_z = mv.z;
  STATE.current_matrix = mv.matrix;
  STATE.render_piece_flag = 1;
  render_frame(canvas, ctx);
  setTimeout(function () {
    speed_up(canvas, ctx);
    touchdown();
    if (STATE.new_z == 0) game_over(canvas, ctx); else new_piece(canvas, ctx);
  }, DEMO_BOT_TOUCHDOWN_DELAY);
}
