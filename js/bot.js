// Simple BotPlayer implementation for demo mode
var DEMO_MODE = false;

// Heuristic coefficients ported from the original C++ bot
var puzzleCoef = 11.7;
var linesCoef = 0.7;
var smoothCoef = -0.28;
var holeCoef = -1.9;
var peakCoef = -0.8;
var cornerCoef = 0.0;
var edgeCoef = 0.0;
var distCoef = 0.001;

var edgeMatrix = [];
var lastCoefKey = null;

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

function getDistanceForSet(x, y, z) {
  // Distancia adaptada por set para aproximar la heurística original.
  var set = typeof SET !== 'undefined' ? SET : 'basic';
  switch (set) {
    case 'flat':
      return Math.sqrt(
        (PIT_WIDTH - 1 - x) * (PIT_WIDTH - 1 - x) +
          (PIT_HEIGHT - 1 - y) * (PIT_HEIGHT - 1 - y) +
          z * z
      );
    case 'extended':
      return Math.sqrt(x * x + y * y + z * z);
    case 'basic':
    default:
      var cx = (PIT_WIDTH - 1) / 2;
      var cy = (PIT_HEIGHT - 1) / 2;
      return Math.sqrt((x - cx) * (x - cx) + (y - cy) * (y - cy) + z * z);
  }
}

function initPitCoef() {
  edgeMatrix = [];
  var width = PIT_WIDTH;
  var height = PIT_HEIGHT;
  var depth = PIT_DEPTH;
  var W = width - 1;
  var H = height - 1;

  for (var z = 0; z < depth; z++) {
    edgeMatrix[z] = [];
    for (var y = 0; y < height; y++) {
      edgeMatrix[z][y] = [];
      for (var x = 0; x < width; x++) {
        edgeMatrix[z][y][x] = 0;
      }
    }
  }

  for (var k = 0; k < depth; k++) {
    for (var i = 0; i < width; i++) {
      edgeMatrix[k][0][i] = edgeCoef;
      edgeMatrix[k][H][i] = edgeCoef;
    }
    for (var j = 1; j < H; j++) {
      edgeMatrix[k][j][0] = edgeCoef;
      edgeMatrix[k][j][W] = edgeCoef;
    }
    edgeMatrix[k][0][0] = cornerCoef;
    edgeMatrix[k][0][W] = cornerCoef;
    edgeMatrix[k][H][0] = cornerCoef;
    edgeMatrix[k][H][W] = cornerCoef;
  }

  for (var dz = 0; dz < depth; dz++) {
    for (var dy = 0; dy < height; dy++) {
      for (var dx = 0; dx < width; dx++) {
        edgeMatrix[dz][dy][dx] += distCoef * getDistanceForSet(dx, dy, dz);
      }
    }
  }
}

function initCoef() {
  puzzleCoef = 11.7;
  linesCoef = 0.7;
  smoothCoef = -0.28;
  var set = typeof SET !== 'undefined' ? SET : 'basic';

  switch (set) {
    case 'flat':
      holeCoef = -1.9;
      peakCoef = -0.0;
      cornerCoef = 0.0;
      edgeCoef = 0.0;
      break;
    case 'extended':
      if (PIT_WIDTH === 3 && PIT_HEIGHT === 3) {
        cornerCoef = 2.8;
        edgeCoef = 0.8;
        peakCoef = -0.8;
      } else {
        cornerCoef = 0.0;
        edgeCoef = 0.0;
        peakCoef = -0.0;
      }
      holeCoef = -1.9;
      break;
    case 'basic':
    default:
      cornerCoef = 2.8;
      edgeCoef = 0.8;
      holeCoef = -1.1;
      peakCoef = -0.81;
      break;
  }

  distCoef = 0.001;
  initPitCoef();
  lastCoefKey = [set, PIT_WIDTH, PIT_HEIGHT, PIT_DEPTH].join('x');
}

function ensureBotCoefficients() {
  var key = [typeof SET !== 'undefined' ? SET : 'basic', PIT_WIDTH, PIT_HEIGHT, PIT_DEPTH].join('x');
  if (key !== lastCoefKey) {
    initCoef();
  }
}

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

function getPitNote(voxels) {
  ensureBotCoefficients();
  if (!voxels || voxels.length === 0) {
    return 0;
  }

  var note = 0;
  for (var i = 0; i < voxels.length; i++) {
    var vx = voxels[i][0];
    var vy = voxels[i][1];
    var vz = voxels[i][2];
    var hasLayer = edgeMatrix[vz] && edgeMatrix[vz][vy];
    if (!hasLayer || typeof edgeMatrix[vz][vy][vx] === 'undefined') {
      continue;
    }
    note += edgeMatrix[vz][vy][vx];
  }
  return note / voxels.length;
}

function checkDeathZone(layers) {
  // Penaliza ocupación en la zona donde aparecen piezas (capas superiores).
  if (!layers || layers.length === 0) {
    console.error('[DemoBot] checkDeathZone recibió capas vacías o inválidas.');
    return 0;
  }

  var note = 0;
  var width = PIT_WIDTH;
  var height = PIT_HEIGHT;
  var depth = PIT_DEPTH;
  var topLayer = 0;

  for (var y = 0; y < height; y++) {
    for (var x = 0; x < width; x++) {
      if (layers[topLayer][y][x] !== 0) {
        note -= 2.5;
      }
    }
  }

  var maxZ = Math.min(2, depth);
  var startY = Math.max(0, height - 2);
  var startX = Math.max(0, width - 2);
  for (var z = 0; z < maxZ; z++) {
    for (var yy = startY; yy < height; yy++) {
      for (var xx = startX; xx < width; xx++) {
        if (layers[z][yy][xx] !== 0) {
          note += z === 0 ? -25 : -5;
        }
      }
    }
  }

  return note;
}

function evaluate_position(voxels) {
  ensureBotCoefficients();
  var layers = clone_layers(LAYERS);
  var counts = COUNTS.slice();
  add_voxels(voxels, layers, counts);

  var lines = check_full_layers(layers, counts);
  var h = column_heights(layers);
  var holes = count_holes(layers, h);
  var sm = smoothness_sqr(h);
  var pk = peakness(h, -2);
  var ce = common_edges(voxels, LAYERS);
  var pitNote = getPitNote(voxels) + checkDeathZone(layers);

  var linesNote = linesCoef * lines;
  var smoothNote = smoothCoef * sm;
  var peakNote = peakCoef * pk;
  var holeNote = holeCoef * holes;
  var commonNote = puzzleCoef * ce;
  var total = linesNote + smoothNote + peakNote + holeNote + commonNote + pitNote;

  if (typeof console !== 'undefined' && console.debug) {
    console.debug(
      '[DemoBot] Notas => pit: ' +
        formatScore(pitNote) +
        ' líneas: ' +
        formatScore(linesNote) +
        ' huecos: ' +
        formatScore(holeNote) +
        ' suavidad²: ' +
        formatScore(smoothNote) +
        ' picos: ' +
        formatScore(peakNote) +
        ' bordes comunes: ' +
        formatScore(commonNote)
    );
  }

  return total;
}
var debugEngine = typeof window !== 'undefined' ? window.DEBUG_ENGINE : null;
var ROTATION_PREVIEW_DELAY = 300;
var POSITION_PREVIEW_DELAY = 200;
var BEST_BONUS_DELAY = 150;
var FINAL_DESTINATION_DELAY = 500;

function sleep(ms) {
  return new Promise(function (resolve) {
    setTimeout(resolve, ms);
  });
}

function cloneArray(arr) {
  return arr ? arr.slice() : null;
}

function cloneMatrixOrIdentity(matrix) {
  return cloneArray(matrix) || [1, 0, 0, 0, 1, 0, 0, 0, 1];
}

function ensureEnvironment(canvas, ctx) {
  if (debugEngine) {
    var resolvedCanvas = debugEngine.ensureCanvas(canvas);
    var resolvedCtx = debugEngine.ensureContext(resolvedCanvas, ctx);
    debugEngine.rememberCanvas(resolvedCanvas, resolvedCtx);
    return { canvas: resolvedCanvas, ctx: resolvedCtx };
  }

  if (!canvas || !ctx) {
    throw new Error('[DemoBot] No hay canvas/contexto disponible para el bot.');
  }

  return { canvas: canvas, ctx: ctx };
}

function simulateDrop(x, y, matrix) {
  var z = 0;
  var voxels = project_voxels(STATE.piece, x, y, z, matrix);
  if (is_overlap_layers(voxels, PIT_WIDTH, PIT_HEIGHT, PIT_DEPTH, LAYERS)) {
    return null;
  }

  while (true) {
    var next = project_voxels(STATE.piece, x, y, z + 1, matrix);
    if (!is_overlap_layers(next, PIT_WIDTH, PIT_HEIGHT, PIT_DEPTH, LAYERS)) {
      z += 1;
      voxels = next;
      if (z >= PIT_DEPTH - 1) {
        break;
      }
    } else {
      break;
    }
  }

  return {
    x: x,
    y: y,
    z: z,
    voxels: voxels,
  };
}

function formatScore(value) {
  return (typeof value === 'number' ? value : 0).toFixed(3);
}

function logRotation(index, total, rotation, x, y) {
  if (typeof console !== 'undefined' && console.log) {
    console.log(
      '[DemoBot] 🔄 Animando rotación ' +
        index +
        '/' +
        total +
        ': (' +
        rotation.join(',') +
        ') en posición (' +
        x +
        ', ' +
        y +
        ')'
    );
  }
}

async function showRotationPreview(rotationIndex, rotationDeg, matrix, anglesRad, canvas, ctx) {
  if (!debugEngine) {
    return;
  }
  logRotation(rotationIndex, BOT_ROTATIONS.length, rotationDeg, STATE.current_x, STATE.current_y);
  debugEngine.showPreview(
    {
      x: STATE.current_x,
      y: STATE.current_y,
      z: STATE.current_z,
      matrix: cloneArray(matrix),
      angles: cloneArray(anglesRad),
    },
    canvas,
    ctx
  );
  await sleep(ROTATION_PREVIEW_DELAY);
}

async function showTestPosition(canvas, ctx, dropData, matrix, anglesRad, score, isBest) {
  var baseMsg =
    '[DemoBot] 📍 Prueba - Posición (' +
    dropData.x +
    ', ' +
    dropData.y +
    ', ' +
    dropData.z +
    ') Score: ' +
    formatScore(score);
  console.log(baseMsg);
  if (isBest) {
    console.log(
      '[DemoBot] 🔥 MEJOR - Posición (' +
        dropData.x +
        ', ' +
        dropData.y +
        ', ' +
        dropData.z +
        ') Score: ' +
        formatScore(score)
    );
  }

  if (debugEngine) {
    debugEngine.showPreview(
      {
        x: dropData.x,
        y: dropData.y,
        z: dropData.z,
        matrix: cloneArray(matrix),
        angles: cloneArray(anglesRad),
      },
      canvas,
      ctx
    );
    await sleep(isBest ? POSITION_PREVIEW_DELAY + BEST_BONUS_DELAY : POSITION_PREVIEW_DELAY);
  }
}

function withSnapshot(canvas, ctx, runner) {
  if (!debugEngine) {
    return runner();
  }
  var snapshot = debugEngine.capturePieceState();
  return runner().finally(function () {
    debugEngine.restorePieceState(snapshot, canvas, ctx);
  });
}

async function evaluateBestMove(canvas, ctx) {
  console.log('[DemoBot] 🎯 Iniciando evaluación exhaustiva con animaciones visibles...');
  var bestScore = -1e9;
  var best = null;
  var tested = 0;

  for (var r = 0; r < BOT_ROTATIONS.length; r++) {
    var rotationDeg = BOT_ROTATIONS[r];
    var anglesRad = rotationDeg.map(function (deg) {
      return (deg * Math.PI) / 180;
    });
    var matrix = get_combined_rotmatrix(anglesRad);

    await showRotationPreview(r + 1, rotationDeg, matrix, anglesRad, canvas, ctx);
    var bbvox = project_voxels(STATE.piece, 0, 0, 0, matrix);
    var bb = bbox_voxels(bbvox);

    for (var x = -bb.x[0]; x <= PIT_WIDTH - 1 - bb.x[1]; x++) {
      for (var y = -bb.y[0]; y <= PIT_HEIGHT - 1 - bb.y[1]; y++) {
        var dropData = simulateDrop(x, y, matrix);
        if (!dropData) {
          continue;
        }
        tested += 1;
        var score = evaluate_position(dropData.voxels);
        var isBest = score > bestScore;
        if (isBest) {
          bestScore = score;
          best = {
            x: dropData.x,
            y: dropData.y,
            z: dropData.z,
            matrix: cloneArray(matrix),
            angles: cloneArray(anglesRad),
          };
        }
        await showTestPosition(canvas, ctx, dropData, matrix, anglesRad, score, isBest);
      }
    }
  }

  if (best) {
    console.log(
      '[DemoBot] ✅ Evaluación completada - Probadas ' +
        tested +
        ' posiciones. Mejor score: ' +
        formatScore(bestScore)
    );
  } else {
    console.error('[DemoBot] Evaluación completada - NO se encontraron posiciones válidas');
  }

  return best;
}

function formatAnglesInDegrees(anglesRad) {
  return (anglesRad || [])
    .map(function (angle) {
      return Math.round((angle * 180) / Math.PI);
    })
    .join(', ');
}

window.best_move = function (canvas, ctx) {
  var env = ensureEnvironment(canvas, ctx);
  return withSnapshot(env.canvas, env.ctx, function () {
    return evaluateBestMove(env.canvas, env.ctx);
  });
};

window.bot_place = async function (canvas, ctx) {
  var env = ensureEnvironment(canvas, ctx);
  console.log('[DemoBot] bot_place called');
  var mv = await window.best_move(env.canvas, env.ctx);
  if (!mv) {
    console.error('[DemoBot] EVALUACIÓN FALLIDA - No se encontró ninguna posición válida para la pieza actual. Posibles causas: pozo lleno o pieza incompatible.');
    game_over(env.canvas, env.ctx);
    return;
  }

  console.log(
    '[DemoBot] 🎯 Destino final calculado: (' +
      mv.x +
      ', ' +
      mv.y +
      ', ' +
      mv.z +
      ') con ángulos [' +
      formatAnglesInDegrees(mv.angles) +
      ']°'
  );
  await sleep(FINAL_DESTINATION_DELAY);

  STATE.new_x = mv.x;
  STATE.new_y = mv.y;
  STATE.new_z = mv.z;
  STATE.new_matrix = cloneMatrixOrIdentity(mv.matrix);
  STATE.new_angles = cloneArray(mv.angles);

  STATE.start_x = STATE.current_x;
  STATE.start_y = STATE.current_y;
  STATE.start_z = STATE.current_z;
  STATE.start_matrix = cloneMatrixOrIdentity(STATE.current_matrix);

  STATE.progress = 0;
  STATE.render_piece_flag = 1;
  STATE.manual_control = false;
  render_frame(env.canvas, env.ctx);

  attempt_piece_descent();
};
