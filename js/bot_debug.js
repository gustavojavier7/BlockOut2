(function () {
  'use strict';

  if (typeof window === 'undefined' || typeof STATE === 'undefined') {
    return;
  }

  // Este módulo transforma al bot tradicional en un evaluador visual paso a
  // paso. Aprovecha helpers del engine para mostrar cada rotación y caída.
  var debugEngine = window.DEBUG_ENGINE;
  if (!debugEngine) {
    console.warn('[DemoBot] DEBUG_ENGINE no está disponible; se omiten las animaciones de evaluación.');
    return;
  }

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
    var cloned = cloneArray(matrix);
    if (cloned) {
      return cloned;
    }
    return [1, 0, 0, 0, 1, 0, 0, 0, 1];
  }

  function ensureEnvironment(canvas, ctx) {
    var resolvedCanvas = debugEngine.ensureCanvas(canvas);
    var resolvedCtx = debugEngine.ensureContext(resolvedCanvas, ctx);
    debugEngine.rememberCanvas(resolvedCanvas, resolvedCtx);
    return { canvas: resolvedCanvas, ctx: resolvedCtx };
  }

  // Ejecuta una caída virtual en las coordenadas entregadas sin modificar el
  // estado real del juego. Devuelve la proyección final y los voxels usados.
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

  // Presenta la rotación actual dentro del pozo antes de iterar posiciones.
  async function showRotationPreview(rotationIndex, rotationDeg, matrix, anglesRad, canvas, ctx) {
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

  // Renderiza cada posición evaluada, resaltando si supera el mejor puntaje.
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
      console.log(
        '[DemoBot] 🏆 Nuevo mejor score: ' +
          formatScore(score) +
          ' en posición (' +
          dropData.x +
          ', ' +
          dropData.y +
          ', ' +
          dropData.z +
          ')'
      );
    }

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
    await sleep((isBest ? POSITION_PREVIEW_DELAY + BEST_BONUS_DELAY : POSITION_PREVIEW_DELAY));
  }

  // Garantiza que el estado visual vuelva al punto inicial tras cada corrida
  // asincrónica del bot, incluso si ocurre una excepción.
  function withSnapshot(canvas, ctx, runner) {
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
    return anglesRad
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
      console.error(
        '[DemoBot] EVALUACIÓN FALLIDA - No se encontró ninguna posición válida para la pieza actual. Posibles causas: pozo lleno o pieza incompatible.'
      );
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
})();
