(function () {
  'use strict';

  if (typeof window === 'undefined') {
    return;
  }

  // Estas utilidades reemplazan partes críticas del engine para habilitar
  // la visualización paso a paso de cada evaluación del bot en modo demo.
  var debugNamespace = (window.DEBUG_ENGINE = window.DEBUG_ENGINE || {});
  var storedCanvas = null;
  var storedContext = null;

  // Guardamos el canvas/contexto activo para poder reiniciar animaciones o
  // programar acciones incluso desde funciones asíncronas diferidas.
  function rememberCanvas(canvas, ctx) {
    if (canvas) {
      storedCanvas = canvas;
      window.__debugCanvas = canvas;
      if (typeof CANVAS !== 'undefined') {
        CANVAS = canvas;
      }
    }
    if (ctx) {
      storedContext = ctx;
      window.__debugCtx = ctx;
      if (typeof CTX !== 'undefined') {
        CTX = ctx;
      }
    }
  }

  function ensureCanvas(canvas) {
    var resolved = canvas || storedCanvas;
    if (!resolved) {
      throw new Error('[DEBUG] No hay canvas disponible para el motor visual.');
    }
    return resolved;
  }

  function ensureContext(canvas, ctx) {
    var resolvedCanvas = ensureCanvas(canvas);
    var resolved = ctx || storedContext || resolvedCanvas.getContext('2d');
    if (!resolved) {
      throw new Error('[DEBUG] No se pudo obtener el contexto 2D para el motor visual.');
    }
    rememberCanvas(resolvedCanvas, resolved);
    return resolved;
  }

  function cloneArray(source) {
    return source ? source.slice() : null;
  }

  function identityMatrix() {
    return [1, 0, 0, 0, 1, 0, 0, 0, 1];
  }

  // Captura y clona todo el estado geométrico de la pieza activa para
  // restaurarlo tras cada vista previa de evaluación.
  function capturePieceState() {
    return {
      current_x: STATE.current_x,
      current_y: STATE.current_y,
      current_z: STATE.current_z,
      current_matrix: cloneArray(STATE.current_matrix),
      start_x: STATE.start_x,
      start_y: STATE.start_y,
      start_z: STATE.start_z,
      start_matrix: cloneArray(STATE.start_matrix),
      new_x: STATE.new_x,
      new_y: STATE.new_y,
      new_z: STATE.new_z,
      new_matrix: cloneArray(STATE.new_matrix),
      new_angles: cloneArray(STATE.new_angles),
      render_piece_flag: STATE.render_piece_flag,
      touchdown_flag: STATE.touchdown_flag,
      progress: STATE.progress,
      manual_control: STATE.manual_control,
    };
  }

  function restorePieceState(snapshot, canvas, ctx) {
    if (!snapshot) {
      return;
    }
    STATE.current_x = snapshot.current_x;
    STATE.current_y = snapshot.current_y;
    STATE.current_z = snapshot.current_z;
    STATE.current_matrix = cloneArray(snapshot.current_matrix) || identityMatrix();
    STATE.start_x = snapshot.start_x;
    STATE.start_y = snapshot.start_y;
    STATE.start_z = snapshot.start_z;
    STATE.start_matrix = cloneArray(snapshot.start_matrix) || identityMatrix();
    STATE.new_x = snapshot.new_x;
    STATE.new_y = snapshot.new_y;
    STATE.new_z = snapshot.new_z;
    STATE.new_matrix = cloneArray(snapshot.new_matrix) || identityMatrix();
    STATE.new_angles = cloneArray(snapshot.new_angles) || [0, 0, 0];
    STATE.render_piece_flag = snapshot.render_piece_flag;
    STATE.touchdown_flag = snapshot.touchdown_flag;
    STATE.progress = snapshot.progress;
    STATE.manual_control = snapshot.manual_control;

    var resolvedCanvas = ensureCanvas(canvas);
    var resolvedCtx = ensureContext(resolvedCanvas, ctx);
    render_frame(resolvedCanvas, resolvedCtx);
  }

  // Renderiza la pieza inmediatamente en la posición solicitada, sin animar,
  // para mostrar cada rotación o posición evaluada por el bot.
  function showPreview(preview, canvas, ctx) {
    if (!preview) {
      return;
    }
    var resolvedCanvas = ensureCanvas(canvas);
    var resolvedCtx = ensureContext(resolvedCanvas, ctx);

    STATE.current_x = preview.x;
    STATE.current_y = preview.y;
    STATE.current_z = preview.z;
    STATE.start_x = preview.x;
    STATE.start_y = preview.y;
    STATE.start_z = preview.z;
    STATE.new_x = preview.x;
    STATE.new_y = preview.y;
    STATE.new_z = preview.z;
    STATE.current_matrix = cloneArray(preview.matrix) || identityMatrix();
    STATE.new_matrix = cloneArray(preview.matrix) || identityMatrix();
    STATE.start_matrix = cloneArray(preview.matrix) || identityMatrix();
    STATE.new_angles = cloneArray(preview.angles) || [0, 0, 0];
    STATE.render_piece_flag = 1;
    STATE.touchdown_flag = 0;
    STATE.progress = 1;
    STATE.manual_control = true;

    render_frame(resolvedCanvas, resolvedCtx);
  }

  // Ajustamos new_piece para mostrar la pieza inmediatamente en el pozo y
  // disparar la evaluación visual del bot.
  function overrideNewPiece() {
    window.new_piece = function (canvas, ctx) {
      var resolvedCanvas = ensureCanvas(canvas);
      var resolvedCtx = ensureContext(resolvedCanvas, ctx);
      rememberCanvas(resolvedCanvas, resolvedCtx);

      if (typeof console !== 'undefined' && console.log) {
        console.log('[SYNC] Nueva pieza generada - Mostrando inmediatamente...');
      }
      reset(resolvedCanvas, resolvedCtx);
      STATE.render_piece_flag = 1;
      STATE.manual_control = true;
      STATE.progress = 1;
      render_frame(resolvedCanvas, resolvedCtx);

      if (DEMO_MODE) {
        schedule_bot_action(resolvedCanvas, resolvedCtx, DEMO_BOT_PLACE_DELAY);
      }
    };
  }

  // El bot ahora es asíncrono; este reemplazo garantiza que los timeouts
  // soporten Promises y registren fallos rápidamente.
  function overrideScheduleBotAction() {
    window.schedule_bot_action = function (canvas, ctx, delay, onAfter) {
      var resolvedCanvas = ensureCanvas(canvas);
      var resolvedCtx = ensureContext(resolvedCanvas, ctx);
      rememberCanvas(resolvedCanvas, resolvedCtx);

      var safeDelay = typeof delay === 'number' && delay >= 0 ? delay : 0;
      if (ID2 !== -1) {
        clearTimeout(ID2);
        ID2 = -1;
      }

      ID2 = setTimeout(function () {
        var maybePromise;
        try {
          maybePromise = bot_place(resolvedCanvas, resolvedCtx);
        } catch (error) {
          console.error('[SYNC] Error al ejecutar bot_place:', error);
          ID2 = -1;
          throw error;
        }

        var isPromise = maybePromise && typeof maybePromise.then === 'function';
        if (!isPromise) {
          ID2 = -1;
          if (typeof onAfter === 'function') onAfter();
          return;
        }

        maybePromise
          .then(function () {
            if (typeof onAfter === 'function') onAfter();
          })
          .catch(function (error) {
            console.error('[SYNC] Error asincrónico en bot_place:', error);
            throw error;
          })
          .finally(function () {
            ID2 = -1;
          });
      }, safeDelay);

      if (typeof console !== 'undefined' && console.log) {
        console.log('[SYNC] Bot programado en', safeDelay, 'ms (ID2 =', ID2, ')');
      }
    };
  }

  // Permite sincronizar FPS y duración de animaciones con los presets de la
  // interfaz visual (lento/medio/rápido).
  function overrideSetRotateSpeed() {
    var speedPresets = {
      slow: { frame: 1000, anim: SLOW_ANIM_DURATION },
      medium: { frame: 500, anim: MED_ANIM_DURATION },
      fast: { frame: 250, anim: FAST_ANIM_DURATION },
    };

    window.setRotateSpeed = function (spd) {
      var preset = speedPresets[spd] || speedPresets.medium;
      FRAME_DELAY = preset.frame;
      ANIM_DURATION = preset.anim;

      if (typeof console !== 'undefined' && console.log) {
        console.log(
          '[SYNC] Velocidad de animación actualizada ->',
          spd || 'medium',
          'FRAME_DELAY:',
          FRAME_DELAY,
          'ANIM_DURATION:',
          ANIM_DURATION
        );
      }

      if (ID1 !== -1 && storedCanvas && storedContext) {
        start_main_loop(storedCanvas, storedContext);
      }
    };
  }

  function ensureManualFlag() {
    if (typeof STATE.manual_control === 'undefined') {
      STATE.manual_control = true;
    }
  }

  ensureManualFlag();
  debugNamespace.rememberCanvas = rememberCanvas;
  debugNamespace.ensureCanvas = ensureCanvas;
  debugNamespace.ensureContext = ensureContext;
  debugNamespace.capturePieceState = capturePieceState;
  debugNamespace.restorePieceState = restorePieceState;
  debugNamespace.showPreview = showPreview;

  overrideNewPiece();
  overrideScheduleBotAction();
  overrideSetRotateSpeed();
})();
