/*****************************************************************************************/
// Globals
/*****************************************************************************************/

// canvas dimensions
var WIDTH = 500;
var HEIGHT = 500;

var BLOCKS_PLACED = 0
// pit dimensions
var PIT_WIDTH = 5;
var PIT_HEIGHT = 5;
var PIT_DEPTH = 10;

// fake perspective
var ZSIZE_X = 28;
var ZSIZE_Y = 28;

// color constants
var PIECE_COLOR = [50, 0, 90];
var BG_COLOR = '#000';

// cube rendering style
var CUBE_PLAIN = 0,
  CUBE_GRADIENT = 1;

var CUBE_STYLE = CUBE_PLAIN;
var CUBE_OUTLINE = '#000';

var FORCE_DEPTH_COLOR = 1;

var LINEWIDTH_CUBE = 0.5;
var LINEWIDTH_PIT = 0.35;

// game speed
var SPEED = 0;
var GAME_SPEED = 0; // Inicia siempre en 0 para que el bot controle el tiempo
var SPEED_MAP = {
  0: 0,
  1: 2000,
  2: 1000,
  3: 500,
  4: 250,
};
var AUTOFALL_DELAY = SPEED_MAP[SPEED];

// animation

var SLOW_ANIM_DURATION = 150;
var MED_ANIM_DURATION = 70;
var FAST_ANIM_DURATION = 10;

// ANIM_DURATION es la variable clave que controla la velocidad de la animación.
var ANIM_DURATION = MED_ANIM_DURATION;

// demo bot timing (in milliseconds)
var DEMO_BOT_PLACE_DELAY = 50; // Aumentado ligeramente para mejor visualización
var DEMO_BOT_TOUCHDOWN_DELAY = 100; // Reducido para acelerar el demo


var FRAME_DELAY = 10;

var DELTA = 1;
var DELTA_ANGLE = Math.PI / 2;

// pieces
var SET = 'basic';

// piece shapes
var TEMPLATES = {
  // 2D polyominoes
  flat: [
    [['x']],

    [['xx']],

    [['xxx']],

    [['xx', 'x ']],

    [['xx', 'xx']],

    [['xxx', ' x ']],

    [['xx ', ' xx']],

    [['xxx', 'x  ']],
  ],

  // Polycubes of order three or four
  basic: [
    [['xx', 'x ']],

    [['xxx', ' x ']],

    [['xx ', ' xx']],

    [['xxx', 'x  ']],

    [
      ['xx', 'x '],
      [' x', '  '],
    ],

    [
      ['xx', 'x '],
      ['  ', 'x '],
    ],

    [
      ['xx', 'x '],
      ['x ', '  '],
    ],
  ],

  // All n-polycubes up to n=5
  extended: [
    [['x']],

    [['xx']],

    [['xxx']],

    [['xxxx']],

    [['xxxxx']],

    [['xx', 'x ']],

    [['xx', 'xx']],

    [['xxx', ' x ']],

    [['xx ', ' xx']],

    [['xxx', 'x  ']],

    [['xxx', 'x  ', 'x  ']],

    [['xxx', ' x ', ' x ']],

    [[' x ', 'xx ', ' xx']],

    [['xx ', ' x ', ' xx']],

    [['x  ', 'xx ', ' xx']],

    [['x   ', 'xxxx']],

    [[' x  ', 'xxxx']],

    [['x x', 'xxx']],

    [['xx ', 'xxx']],

    [['  xx', 'xxx ']],

    [[' x ', 'xxx', ' x ']],

    [
      ['xxx', 'x  '],
      ['   ', 'x  '],
    ],

    [
      ['xxx', '  x'],
      ['   ', '  x'],
    ],

    [
      ['xxx', ' x '],
      ['   ', ' x '],
    ],

    [
      ['xxx', 'x  '],
      [' x ', '   '],
    ],

    [
      ['xxx', '  x'],
      [' x ', '   '],
    ],

    [
      ['xx ', ' xx'],
      ['x  ', '   '],
    ],

    [
      [' xx', 'xx '],
      ['  x', '   '],
    ],

    [
      [' x ', 'xx '],
      [' xx', '   '],
    ],

    [
      [' x ', ' xx'],
      ['xx ', '   '],
    ],

    [
      ['xxx', '  x'],
      ['x  ', '   '],
    ],

    [
      ['xxx', 'x  '],
      ['  x', '   '],
    ],

    [
      ['xx', 'x '],
      [' x', '  '],
    ],

    [
      ['xx', 'x '],
      ['  ', 'x '],
    ],

    [
      ['xx', 'x '],
      ['x ', '  '],
    ],

    [
      ['xxx', ' x '],
      [' x ', '   '],
    ],

    [
      ['xx', 'xx'],
      ['x ', '  '],
    ],

    [
      ['xxx', 'x  '],
      ['x  ', '   '],
    ],

    [
      [' xx', ' x '],
      ['xx ', '   '],
    ],

    [
      ['xx ', ' x '],
      [' xx', '   '],
    ],

    [
      ['xx', ' x'],
      ['  ', 'xx'],
    ],
  ],
};

// controls (no necesitamos keymaps, pero mantenemos las estructuras)
var KEYCODES = {};
var KEYMAP_DEFAULT = {};
var LABELMAP = {};
var KEYMAP = {};
var KEYMAP_TMP = {};
var LAST_KEY_EL = 0;

// generated data
var PIECES = {};
var LAYERS = [];
var COUNTS = [];
var COLORS = [];
var ALLOWED = [];

var CACHE_PIT = 0,
  CACHE_LAYERS = 0,
  CACHE_SHADOW = 0;

var START, END, ELAPSED;
var ID1 = -1,
  ID2 = -1;

// game state
var STATE = {
  setkeys: 0,
};

// pause
var PAUSE_ANIM = 1;
var PAUSE_WORMS = 1;
var N_ELEMENTS = 250;
var PAUSE_ELEMENTS = [];
var DP = 0;

// highscore
var HIGHSCORE = {};

// username
var USERNAME = '';

// end game context
var CANVAS;
var CTX;

/*****************************************************************************************/
// Pieces
/*****************************************************************************************/
function precompute_pieces() {
  for (var set in TEMPLATES) {
    PIECES[set] = [];
    for (var i = 0; i < TEMPLATES[set].length; ++i) {
      var piece3d = generate_piece(TEMPLATES[set][i]);
      var bb = bbox(piece3d.lines);

      // center of the piece (middle of bounding box)
      var cx = bb.x[0] + (bb.x[1] - bb.x[0]) / 2.0;
      var cy = bb.y[0] + (bb.y[1] - bb.y[0]) / 2.0;
      var cz = bb.z[0] + (bb.z[1] - bb.z[0]) / 2.0;

      // align rotation on full cubes
      cx = Math.floor(cx);
      cy = Math.floor(cy);
      cz = Math.floor(cz);

      PIECES[set][i] = {
        lines: piece3d.lines,
        voxels: piece3d.voxels,
        cx: cx,
        cy: cy,
        cz: cz,
        bb: bb,
      };
    }
  }
}

function generate_layer(width, height) {
  var layer = [];
  for (var y = 0; y < height; ++y) {
    var row = [];
    for (var x = 0; x < width; ++x) {
      row[x] = 0;
    }
    layer.push(row);
  }
  return layer;
}

function generate_layers(width, height, depth) {
  var layers = [];

  for (var z = 0; z < depth; ++z)
  layers.push(generate_layer(width, height));

  return layers;
}

function generate_counts(layers) {
  var depth = layers.length;
  var height = layers[0].length;
  var width = layers[0][0].length;

  var counts = [];

  for (var z = 0; z < depth; ++z) {
    counts[z] = 0;
    for (var y = 0; y < height; ++y) {
      for (var x = 0; x < width; ++x) {
        if (layers[z][y][x] != 0) counts[z] += 1;
      }
    }
  }

  return counts;
}

function init_colors(depth) {
  COLORS = [];
  var h, s, l, a;
  var pie = 360 / (depth - 0.5);
  for (var i = 0; i < depth; ++i) {
    h = i * pie;
    s = 90;
    l = 50;
    a = 1.0;
    COLORS.push([h, s, l, a]);
  }
}

function init_layers(layers, type) {
  var depth = layers.length;
  var height = layers[0].length;
  var width = layers[0][0].length;
  var c = rand_range(1, depth - 1);
  for (var z = 0; z < depth; ++z) {
    for (var y = 0; y < height; ++y) {
      for (var x = 0; x < width; ++x) {
        layers[z][y][x] = 0;

        switch (type) {
          case 1:
            if (z > depth - 3) layers[z][y][x] = (x > 0 || y > 0) ? 1 : 0;
            break;
          case 2:
            if (z > depth - 2) layers[z][y][x] = (x + y) > 3;
            break;
          case 3:
            if (z >= 0) layers[z][y][x] = (depth - z) * ((width - x) + (height - y) > z ? 0 : 1);
            break;
          case 4:
            if (z > 1 && Math.random() > 0.95) layers[z][y][x] = c;
        }
      }
    }
  }
}

/*****************************************************************************************/
// Random
/*****************************************************************************************/
function rand_range(lo, hi) {
  return Math.round(lo + (hi - lo) * Math.random());
}

/*****************************************************************************************/
// Text (simplificada para no depender de jQuery.text() que no está cargado aquí)
/*****************************************************************************************/
function pretty_number(x) {
  var delimiter = ',';
  var strx = x.toString();
  var pretty = '';
  for (var i = strx.length - 1; i >= 0; i--) {
    if ((strx.length - 1 - i) % 3 == 0 && (strx.length - 1 - i) > 0)
    pretty = delimiter + pretty;
    pretty = strx[i] + pretty;
  }
  return pretty;
}

/*****************************************************************************************/
// Math
/*****************************************************************************************/
function cap(val, max) {
  if (val > max) return max;
  return val;
}

/*****************************************************************************************/
// Geometry
/*****************************************************************************************/
function project(cwidth, cheight, width, height, x, y, z) {
  var offsetx1 = z * ZSIZE_X - z * z;
  var offsety1 = z * ZSIZE_Y - z * z;

  var xsize1 = (cwidth - 2 * offsetx1) / width;
  var ysize1 = (cheight - 2 * offsety1) / height;

  var px = Math.round(offsetx1 + x * xsize1);
  var py = Math.round(offsety1 + y * ysize1);

  return { x: px, y: py };
}

function translate(p, t) {
  return [p[0] + t[0], p[1] + t[1], p[2] + t[2]];
}

function matmult(a, b) {
  return [
    a[0] * b[0] + a[1] * b[3] + a[2] * b[6],
    a[0] * b[1] + a[1] * b[4] + a[2] * b[7],
    a[0] * b[2] + a[1] * b[5] + a[2] * b[8],
    a[3] * b[0] + a[4] * b[3] + a[5] * b[6],
    a[3] * b[1] + a[4] * b[4] + a[5] * b[7],
    a[3] * b[2] + a[4] * b[5] + a[5] * b[8],
    a[6] * b[0] + a[7] * b[3] + a[8] * b[6],
    a[6] * b[1] + a[7] * b[4] + a[8] * b[7],
    a[6] * b[2] + a[7] * b[5] + a[8] * b[8],
  ];
}

function applymat(p, m) {
  return [
    m[0] * p[0] + m[1] * p[1] + m[2] * p[2],
    m[3] * p[0] + m[4] * p[1] + m[5] * p[2],
    m[6] * p[0] + m[7] * p[1] + m[8] * p[2],
  ];
}

function rotate(p, rotmatrix) {
  return applymat(p, rotmatrix);
}

function get_x_rotmatrix(angle) {
  var cos = Math.cos(angle);
  var sin = Math.sin(angle);
  return [
     1, 0, 0,
     0, cos, -sin,
     0, sin, cos
  ];
}

function get_y_rotmatrix(angle) {
  var cos = Math.cos(angle);
  var sin = Math.sin(angle);
  return [
     cos, 0, sin,
     0, 1, 0,
     -sin, 0, cos
  ];
}

function get_z_rotmatrix(angle) {
  var cos = Math.cos(angle);
  var sin = Math.sin(angle);
  return [
     cos, -sin, 0,
     sin, cos, 0,
     0, 0, 1
  ];
}

function get_combined_rotmatrix(angles) {
  var mx = get_x_rotmatrix(angles[0]);
  var my = matmult(get_y_rotmatrix(angles[1]), mx);
  var mz = matmult(get_z_rotmatrix(angles[2]), my);
  return mz;
}

function bbox(lines) {
  if (lines.length > 0) {
    var minx = lines[0][0][0];
    var maxx = minx;
    var miny = lines[0][0][1];
    var maxy = miny;
    var minz = lines[0][0][2];
    var maxz = minz;
    for (var i = 0; i < lines.length; ++i) {
      if (lines[i][0][0] < minx) minx = lines[i][0][0];
      else if (lines[i][0][0] > maxx) maxx = lines[i][0][0];

      if (lines[i][0][1] < miny) miny = lines[i][0][1];
      else if (lines[i][0][1] > maxy) maxy = lines[i][0][1];

      if (lines[i][0][2] < minz) minz = lines[i][0][2];
      else if (lines[i][0][2] > maxz) maxz = lines[i][0][2];

      if (lines[i][1][0] < minx) minx = lines[i][1][0];
      else if (lines[i][1][0] > maxx) maxx = lines[i][1][0];

      if (lines[i][1][1] < miny) miny = lines[i][1][1];
      else if (lines[i][1][1] > maxy) maxy = lines[i][1][1];

      if (lines[i][1][2] < minz) minz = lines[i][1][2];
      else if (lines[i][1][2] > maxz) maxz = lines[i][1][2];
    }
    return { x: [minx, maxx], y: [miny, maxy], z: [minz, maxz] };
  } else
  return { x: [0, 0], y: [0, 0], z: [0, 0] };
}

function bbox_voxels(points) {
  if (points.length > 0) {
    var minx = points[0][0];
    var maxx = minx;
    var miny = points[0][1];
    var maxy = miny;
    var minz = points[0][2];
    var maxz = minz;
    for (var i = 1; i < points.length; ++i) {
      if (points[i][0] < minx) minx = points[i][0];
      else if (points[i][0] > maxx) maxx = points[i][0];

      if (points[i][1] < miny) miny = points[i][1];
      else if (points[i][1] > maxy) maxy = points[i][1];

      if (points[i][2] < minz) minz = points[i][2];
      else if (points[i][2] > maxz) maxz = points[i][2];
    }
    return { x: [minx, maxx], y: [miny, maxy], z: [minz, maxz] };
  } else
  return { x: [0, 0], y: [0, 0], z: [0, 0] };
}

/*****************************************************************************************/
// Rendering
/*****************************************************************************************/
function line3d(ctx, cwidth, cheight, width, height, s, e, color) {
  var p1 = project(cwidth, cheight, width, height, s[0], s[1], s[2]);
  var p2 = project(cwidth, cheight, width, height, e[0], e[1], e[2]);

  ctx.strokeStyle = color;
  ctx.beginPath();
  ctx.moveTo(p1.x, p1.y);
  ctx.lineTo(p2.x, p2.y);
  ctx.stroke();
}

function point3d(ctx, cwidth, cheight, width, height, s, color, radius) {
  var p1 = project(cwidth, cheight, width, height, s[0], s[1], s[2]);

  ctx.fillStyle = color;
  ctx.beginPath();
  ctx.arc(p1.x, p1.y, radius, 0, 6.28, 0);
  ctx.fill();
}

function draw_pit(canvas, ctx, width, height, depth, refresh_flag) {
  if (CACHE_PIT == 0 || refresh_flag) {

    // colors
    var color1 = '#00ff0f'; // gradient start
    var color2 = '#00ff00'; // gradient end
    var bgcolor = BG_COLOR; // pit background

    var cwidth = canvas.width;
    var cheight = canvas.height;

    // background
    ctx.fillStyle = bgcolor;
    ctx.fillRect(0, 0, cwidth, cheight);

    // levels
    ctx.lineWidth = LINEWIDTH_PIT;

    var offsetx = 0,
      offsety = 0;
    var r, g, b;
    for (var z = 1; z < depth + 1; ++z) {
      offsetx = z * (ZSIZE_X - z);
      offsety = z * (ZSIZE_Y - z);

      // r = g = b = Math.floor(64 * (0.5 + (2 * (depth - z)) / depth));

            r = 0;
            g = 255;
            b = 0;

      ctx.strokeStyle = 'rgb(' + r + ',' + g + ',' + b + ')';
      //b = Math.floor(64*(0.1+1*(depth-z)/depth));
      //ctx.strokeStyle = "hsl(0,90%,"+b+"%)";

      ctx.strokeRect(offsetx, offsety, cwidth - 2 * offsetx, cheight - 2 * offsety);
      if (z == depth) {
        ctx.fillStyle = '#000';
        ctx.fillRect(offsetx, offsety, cwidth - 2 * offsetx, cheight - 2 * offsety);
      }
    }

    var xsize_bottom = (cwidth - 2 * offsetx) / width;
    var ysize_bottom = (cheight - 2 * offsety) / height;
    var xsize_top = cwidth / width;
    var ysize_top = cheight / height;

    // bottom grid
    ctx.beginPath();
    for (var x = 1; x < width; ++x) {
      ctx.moveTo(offsetx + x * xsize_bottom, offsety);
      ctx.lineTo(offsetx + x * xsize_bottom, cheight - offsety);
    }
    for (var y = 1; y < height; ++y) {
      ctx.moveTo(offsetx, offsety + y * ysize_bottom);
      ctx.lineTo(cwidth - offsetx, offsety + y * ysize_bottom);
    }
    ctx.stroke();

    // top crossing
    var lingrad = ctx.createLinearGradient(0, 0, 0, cheight / 2);
    lingrad.addColorStop(0.0, color1);
    lingrad.addColorStop(1.0, color2);
    ctx.strokeStyle = lingrad;

    ctx.beginPath();
    for (var x = 0; x < width + 1; ++x) {
      ctx.moveTo(x * xsize_top, 0);
      ctx.lineTo(offsetx + x * xsize_bottom, offsety);
    }
    ctx.stroke();

    // bottom crossing
    lingrad = ctx.createLinearGradient(0, cheight, 0, cheight / 2);
    lingrad.addColorStop(0.0, color1);
    lingrad.addColorStop(1.0, color2);
    ctx.strokeStyle = lingrad;

    ctx.beginPath();
    for (var x = 0; x < width + 1; ++x) {
      ctx.moveTo(x * xsize_top, cheight);
      ctx.lineTo(offsetx + x * xsize_bottom, cheight - offsety);
    }
    ctx.stroke();

    // left crossing
    lingrad = ctx.createLinearGradient(0, 0, cwidth / 2, 0);
    lingrad.addColorStop(0.0, color1);
    lingrad.addColorStop(1.0, color2);
    ctx.strokeStyle = lingrad;

    ctx.beginPath();
    for (var y = 1; y < height; ++y) {
      ctx.moveTo(0, y * ysize_top);
      ctx.lineTo(offsetx, offsety + y * ysize_bottom);
    }
    ctx.stroke();

    // right crossing
    lingrad = ctx.createLinearGradient(cwidth, 0, cwidth / 2, 0);
    lingrad.addColorStop(0.0, color1);
    lingrad.addColorStop(1.0, color2);
    ctx.strokeStyle = lingrad;

    ctx.beginPath();
    for (var y = 1; y < height; ++y) {
      ctx.moveTo(cwidth, y * ysize_top);
      ctx.lineTo(cwidth - offsetx, offsety + y * ysize_bottom);
    }
    ctx.stroke();

    if (CACHE_PIT == 0) {
      // Usamos el DOM estándar, no jQuery
      var cache = document.createElement('canvas');
      cache.style.display = 'none';
      document.body.appendChild(cache);
      cache.width = cwidth;
      cache.height = cheight;
      CACHE_PIT = cache;
    }
    CACHE_PIT.getContext('2d').drawImage(canvas, 0, 0);
  } else {
    ctx.drawImage(CACHE_PIT, 0, 0);
  }
}

function render_cube(canvas, ctx, width, height, depth, x, y, z, color, faces, outline) {
  var cwidth = canvas.width;
  var cheight = canvas.height;

  // This breaks Opera, no idea why expanded expressions work
  /*
    var offsetx1 = z*(ZSIZE_X-z);
    var offsety1 = z*(ZSIZE_Y-z);

    var offsetx2 = (z+1)*(ZSIZE_X-(z+1));
    var offsety2 = (z+1)*(ZSIZE_Y-(z+1));
    */
  var offsetx1 = z * ZSIZE_X - z * z;
  var offsety1 = z * ZSIZE_Y - z * z;

  var offsetx2 = z * ZSIZE_X - z * z - z + ZSIZE_X - z - 1;
  var offsety2 = z * ZSIZE_Y - z * z - z + ZSIZE_Y - z - 1;

  var xsize1 = (cwidth - 2 * offsetx1) / width;
  var ysize1 = (cheight - 2 * offsety1) / height;

  var xsize2 = (cwidth - 2 * offsetx2) / width;
  var ysize2 = (cheight - 2 * offsety2) / height;

  var left1 = Math.round(offsetx1 + x * xsize1);
  var top1 = Math.round(offsety1 + y * ysize1);
  var right1 = Math.round(left1 + xsize1);
  var bottom1 = Math.round(top1 + ysize1);

  var left2 = Math.round(offsetx2 + x * xsize2);
  var top2 = Math.round(offsety2 + y * ysize2);
  var right2 = Math.round(left2 + xsize2);
  var bottom2 = Math.round(top2 + ysize2);

  var cx = 0.5 * width;
  var cy = 0.5 * height;

  /*
    // bottom side
    ctx.fillStyle = "#aaa";
    ctx.strokeStyle = "#000000";
    ctx.fillRect(  left2, top2, xsize2,ysize2);
    ctx.strokeRect(left2, top2, xsize2,ysize2);
    */

  var lightness = (0.3 + (0.7 * (depth - z)) / depth) * color[2];
  var topcolor =
    'hsla(' + Math.floor(color[0]) + ',' + Math.floor(color[1]) + '%,' +
    Math.floor(lightness) + '%,' + color[3] + ')';
  var sidecolor =
    'hsla(' + Math.floor(color[0]) + ',' + Math.floor(color[1]) +    '%,' +
    Math.floor(0.75 * lightness) +  '%,' + color[3] + ')';
  var sidecolor2 = 'hsla(' + Math.floor(color[0]) + ',' + Math.floor(color[1]) + '%,' +
    Math.floor(0.5 * lightness) + '%,' + color[3] +
    ')';

  var render_style = CUBE_STYLE;

  ctx.lineWidth = LINEWIDTH_CUBE;

  // right side
  if (faces[0] && x < cx) {

    if (render_style == CUBE_GRADIENT) {
      var lingrad = ctx.createLinearGradient(right1, top1, right2, bottom2);
      lingrad.addColorStop(0.0, sidecolor);
      lingrad.addColorStop(1.0, sidecolor2);
      ctx.fillStyle = lingrad;
    } else
         ctx.fillStyle = sidecolor2;

    if (outline)
       ctx.strokeStyle = outline;
    else
       ctx.strokeStyle = sidecolor2;
    ctx.beginPath();
    ctx.moveTo(right1, top1);
    ctx.lineTo(right2, top2);
    ctx.lineTo(right2, bottom2);
    ctx.lineTo(right1, bottom1);
    ctx.fill();
    ctx.stroke();
  }

  // down side
  if (faces[1] && y + 1 < cy) {
    ctx.fillStyle = sidecolor;
    if (outline)
        ctx.strokeStyle = outline;
    else
        ctx.strokeStyle = sidecolor;
    ctx.beginPath();
    ctx.moveTo(left1, bottom1);
    ctx.lineTo(left2, bottom2);
    ctx.lineTo(right2, bottom2);
    ctx.lineTo(right1, bottom1);
    ctx.fill();
    ctx.stroke();
  }

  // left side
  if (faces[2] && x > cx) {
    ctx.fillStyle = sidecolor2;
    if (outline)
       ctx.strokeStyle = outline;
    else
       ctx.strokeStyle = sidecolor2;
    ctx.beginPath();
    ctx.moveTo(left1, top1);
    ctx.lineTo(left2, top2);
    ctx.lineTo(left2, bottom2);
    ctx.lineTo(left1, bottom1);
    ctx.fill();
    ctx.stroke();
  }

  // up side
  if (faces[3] && y > cy) {
    ctx.fillStyle = sidecolor;
    if (outline)
       ctx.strokeStyle = outline;
    else
       ctx.strokeStyle = sidecolor;
    ctx.beginPath();
    ctx.moveTo(right1, top1);
    ctx.lineTo(right2, top2);
    ctx.lineTo(left2, top2);
    ctx.lineTo(left1, top1);
    ctx.fill();
    ctx.stroke();
  }

  // top side
  if (faces[4]) {
    if (render_style == CUBE_GRADIENT) {
      var lingrad = ctx.createLinearGradient(left1, top1, left1 + xsize1, top1 + ysize1);
      lingrad.addColorStop(0.0, topcolor);
      lingrad.addColorStop(0.5, sidecolor);
      lingrad.addColorStop(1.0, sidecolor2);
      ctx.fillStyle = lingrad;
    } else
       ctx.fillStyle = topcolor;

    if (outline)
       ctx.strokeStyle = outline;
    else
       ctx.strokeStyle = topcolor;
    ctx.fillRect(left1, top1, xsize1, ysize1);
    ctx.strokeRect(left1, top1, xsize1, ysize1);
  }
}

function render_shadow(canvas, ctx, margin, refresh_flag) {
  if (CACHE_SHADOW == 0 || refresh_flag) {
    var cwidth = canvas.width;
    var cheight = canvas.height;

    if (CACHE_SHADOW == 0) {
      var cache = document.createElement('canvas');
      cache.style.display = 'none';
      document.body.appendChild(cache);
      cache.width = cwidth;
      cache.height = cheight;
      CACHE_SHADOW = cache;
    }

    var cache_ctx = CACHE_SHADOW.getContext('2d');
    cache_ctx.clearRect(0, 0, cwidth, cheight); // Limpiar antes de dibujar

    var sx = 0;
    var sy = 0;

    var start = 'rgba(0,0,0,0.5)';
    var end = 'rgba(0,0,0,0)';

    // top
    var lingrad = ctx.createLinearGradient(sx, sy, sx, margin);
    lingrad.addColorStop(0.0, start);
    lingrad.addColorStop(1.0, end);
    cache_ctx.fillStyle = lingrad;
    cache_ctx.fillRect(sx, sy, cwidth - sx, margin);

    // bottom
    lingrad = ctx.createLinearGradient(sx, cheight, sy, cheight - margin);
    lingrad.addColorStop(0.0, start);
    lingrad.addColorStop(1.0, end);
    cache_ctx.fillStyle = lingrad;
    cache_ctx.fillRect(sx, cheight - margin, cwidth - sx, margin);

    // left
    lingrad = ctx.createLinearGradient(sx, sy, margin, sy);
    lingrad.addColorStop(0.0, start);
    lingrad.addColorStop(1.0, end);
    cache_ctx.fillStyle = lingrad;
    cache_ctx.fillRect(sx, sy, margin, cheight - sy);

    // right
    lingrad = ctx.createLinearGradient(cwidth, sy, cwidth - margin, sy);
    lingrad.addColorStop(0.0, start);
    lingrad.addColorStop(1.0, end);
    cache_ctx.fillStyle = lingrad;
    cache_ctx.fillRect(cwidth - margin, sy, margin, cheight - sy);
  }

  ctx.drawImage(CACHE_SHADOW, 0, 0);
}

function render_layer(canvas, ctx, layer, z, outline, depth) {
  var row = '';
  var color;

  var force_color = FORCE_DEPTH_COLOR;

  // right,down,left,up sides pass
  var faces = [1, 1, 1, 1, 0];
  for (var y = 0; y < layer.length; ++y) {
    row = layer[y];
    for (var x = 0; x < row.length; ++x) {
      if (row[x] != '0') {
        if (x > 0)
        faces[2] = !parseInt(row[x - 1]);
        if (x < row.length - 1)
        faces[0] = !parseInt(row[x + 1]);
        if (y > 0)
        faces[3] = !parseInt(layer[y - 1][x]);
        if (y < layer.length - 1)
        faces[1] = !parseInt(layer[y + 1][x]);

        if (force_color)
           color = depth - z - 1;
        else
           color = row[x] - 1;

        render_cube(canvas, ctx, PIT_WIDTH, PIT_HEIGHT, PIT_DEPTH, x, y, z, COLORS[color], faces, outline);
        faces = [1, 1, 1, 1, 0];
      }
    }
  }

  // top sides pass
  faces = [0, 0, 0, 0, 1];
  for (var y = 0; y < layer.length; ++y) {
    row = layer[y];
    for (var x = 0; x < row.length; ++x) {
      if (row[x] != '0') {
        if (force_color)
           color = depth - z - 1;
        else
           color = row[x] - 1;
        render_cube(canvas, ctx, PIT_WIDTH, PIT_HEIGHT, PIT_DEPTH, x, y, z, COLORS[color], faces, outline);
      }
    }
  }
}

function render_layers(canvas, ctx, layers, refresh_flag) {
  var outline = CUBE_OUTLINE;

  if (CACHE_LAYERS == 0 || refresh_flag) {
    //draw_pit(canvas, ctx, PIT_WIDTH,PIT_HEIGHT,PIT_DEPTH);

    // render bottom->top order
    for (var i = layers.length - 1; i >= 0; --i)
    render_layer(canvas, ctx, layers[i], i, outline, layers.length);

    if (CACHE_LAYERS == 0) {
      var cache = document.createElement('canvas');
      cache.style.display = 'none';
      document.body.appendChild(cache);
      cache.width = canvas.width;
      cache.height = canvas.height;
      CACHE_LAYERS = cache;
    }
    CACHE_LAYERS.getContext('2d').drawImage(canvas, 0, 0);
    STATE.refresh_layers_flag = 0;
  } else {
    ctx.drawImage(CACHE_LAYERS, 0, 0);
  }
}

function generate_piece(shape) {
  var lines = [];
  var map = {};

  var voxels = [];

  function add_line(a, b) {
    var linehash1 = '#' + a[0] + '#' + a[1] + '#' + a[2] + '#' + b[0] + '#' + b[1] + '#' + b[2];
    var linehash2 = '#' + b[0] + '#' + b[1] + '#' + b[2] + '#' + a[0] + '#' + a[1] + '#' + a[2];
    if (map[linehash1] == undefined && map[linehash2] == undefined)
      map[linehash1] = [
        [a[0], a[1], a[2]],
        [b[0], b[1], b[2]],
      ];
    else {
      if (map[linehash1] != undefined) delete map[linehash1];
      if (map[linehash2] != undefined) delete map[linehash2];
    }
  }

  for (var z = 0; z < shape.length; ++z) {
    layer = shape[z];
    for (var y = 0; y < layer.length; ++y) {
      row = layer[y];
      for (var x = 0; x < row.length; ++x) {
        if (row[x] != ' ') {
          // top face
          add_line([x, y, z], [x + 1, y, z]);
          add_line([x + 1, y, z], [x + 1, y + 1, z]);
          add_line([x + 1, y + 1, z], [x, y + 1, z]);
          add_line([x, y + 1, z], [x, y, z]);

          // bottom face
          add_line([x, y, z + 1], [x + 1, y, z + 1]);
          add_line([x + 1, y, z + 1], [x + 1, y + 1, z + 1]);
          add_line([x + 1, y + 1, z + 1], [x, y + 1, z + 1]);
          add_line([x, y + 1, z + 1], [x, y, z + 1]);

          // side faces
          add_line([x, y, z], [x, y, z + 1]);
          add_line([x + 1, y, z], [x + 1, y, z + 1]);
          add_line([x + 1, y + 1, z], [x + 1, y + 1, z + 1]);
          add_line([x, y + 1, z], [x, y + 1, z + 1]);

          voxels.push([x + 0.5, y + 0.5, z + 0.5]);
        }
      }
    }
  }

  for (var i in map)
  lines.push(map[i]);

  return { lines: lines, voxels: voxels };
}

function render_piece(canvas, ctx, width, height, depth, x, y, z, piece, rotmatrix, color) {
  var cwidth = canvas.width;
  var cheight = canvas.height;

  var cx = piece.cx;
  var cy = piece.cy;
  var cz = piece.cz;

  /*
    var r = g = b = Math.floor(64*(2+2*(depth-z)/depth));
    var c = "rgb("+r+","+g+","+b+")";
    */
  var l = 0.25 * (2 + (2 * (depth - z)) / depth);
  var c = 'hsl(' + color[0] + ',' + color[1] + '%,' + l * color[2] + '%)';

  var p1, p2, r1, r2;
  for (var i = 0; i < piece.lines.length; ++i) {
    p1 = translate(piece.lines[i][0], [-cx, -cy, -cz]);
    p2 = translate(piece.lines[i][1], [-cx, -cy, -cz]);
    r1 = translate(rotate(p1, rotmatrix), [x + cx, y + cy, z + cz]);
    r2 = translate(rotate(p2, rotmatrix), [x + cx, y + cy, z + cz]);

    //ctx.lineWidth = 0.5+1.5*(depth-0.5*(r1[2]+r2[2]))/depth;
    ctx.lineWidth = 0.5 + (1.5 * (depth - z)) / depth;
    line3d(ctx, cwidth, cheight, width, height, r1, r2, c);
  }


  /*
    // Voxel test
    for(var i=0; i<piece.voxels.length; ++i) {
        var p1 = translate(piece.voxels[i], [-cx,-cy,-cz]);
        var r1 = translate(rotate(p1, angles), [x+cx,y+cy,z+cz]);
        point3d(ctx, cwidth,cheight, width,height, r1, "red", 3);
    }
    */

}

function render_pit(canvas, ctx) {
  draw_pit(canvas, ctx, PIT_WIDTH, PIT_HEIGHT, PIT_DEPTH, 1);
  render_layers(canvas, ctx, LAYERS, 1);

  // transparent overlay layer below shadow
    ctx.fillStyle = 'rgba(25,25,25,0.75)';
    ctx.fillRect(0, 0, canvas.width, canvas.height);

  render_shadow(canvas, ctx, 100, 0, 1);
}

/*****************************************************************************************/
// Voxels
/*****************************************************************************************/
function bbox_piece(shape) {
  var width = shape[0][0].length;
  var height = shape[0].length;
  var depth = shape.length;
  return { width: width, height: height, depth: depth };
}

function project_voxels(piece, x, y, z, rotmatrix) {
  var voxels = [];
  var cx = piece.cx;
  var cy = piece.cy;
  var cz = piece.cz;
  for (var i = 0; i < piece.voxels.length; ++i) {
    var p = translate(piece.voxels[i], [-cx, -cy, -cz]);
    var r = translate(rotate(p, rotmatrix), [x + cx, y + cy, z + cz]);
    r[0] = Math.floor(r[0]);
    r[1] = Math.floor(r[1]);
    r[2] = Math.floor(r[2]);
    voxels.push(r);
  }
  return voxels;
}

function is_overlap_layers(voxels, pwidth, pheight, pdepth, layers) {
  console.log('Verificando overlap...');
  for (var i = 0; i < voxels.length; ++i) {
    if (voxels[i][0] < 0) {
      console.log('Voxel fuera de límites:', voxels[i]);
      return 1;
    }
    if (voxels[i][1] < 0) {
      console.log('Voxel fuera de límites:', voxels[i]);
      return 1;
    }
    if (voxels[i][2] < 0) {
      console.log('Voxel fuera de límites:', voxels[i]);
      return 1;
    }

    if (voxels[i][0] >= pwidth) {
      console.log('Voxel fuera de límites:', voxels[i]);
      return 1;
    }
    if (voxels[i][1] >= pheight) {
      console.log('Voxel fuera de límites:', voxels[i]);
      return 1;
    }
    if (voxels[i][2] >= pdepth) {
      console.log('Voxel fuera de límites:', voxels[i]);
      return 1;
    }

    var x = voxels[i][0];
    var y = voxels[i][1];
    var z = voxels[i][2];
    if (layers[z][y][x]) {
      console.log('Overlap detectado:', voxels[i]);
      return 1;
    }
  }
  console.log('No hay overlap.');
  return 0;
}

function is_overlap(voxels, pwidth, pheight, pdepth) {
  for (var i = 0; i < voxels.length; ++i) {
    if (voxels[i][0] < 0) return 1;
    if (voxels[i][1] < 0) return 1;
    if (voxels[i][2] < 0) return 1;

    if (voxels[i][0] >= pwidth) return 1;
    if (voxels[i][1] >= pheight) return 1;
    if (voxels[i][2] >= pdepth) return 1;
  }
  return 0;
}

function overlap_diff(voxels, pwidth, pheight, pdepth) {
  var dx = 0,
    dy = 0,
    dz = 0;

  var bbox = bbox_voxels(voxels);

  // no delta if voxels are bigger than pit
  if (
    !(bbox.x[0] < 0 && bbox.x[1] >= pwidth) ||
    !(bbox.y[0] < 0 && bbox.y[1] >= pheight) ||
    !(bbox.z[0] < 0 && bbox.z[1] >= pdepth)
  ) {
    if (bbox.x[0] < 0) dx = -bbox.x[0];
        if (bbox.x[1] > pwidth - 1) dx = pwidth - 1 - bbox.x[1];

    if (bbox.y[0] < 0) dy = -bbox.y[0];
        if (bbox.y[1] > pheight - 1) dy = pheight - 1 - bbox.y[1];

    if (bbox.z[0] < 0) dz = -bbox.z[0];
        if (bbox.z[1] > pdepth - 1) dz = pdepth - 1 - bbox.z[1];
  }

  return [dx, dy, dz];
}

function add_voxels(voxels, layers, counts) {
  var x, y, z;
  var total = 0;
  var depth = layers.length;
  for (var i = 0; i < voxels.length; ++i) {
    x = voxels[i][0];
    y = voxels[i][1];
    z = voxels[i][2];

    if (layers[z][y][x] == 0) {
      counts[z] += 1;
      total += 1;
    }
    layers[z][y][x] = depth - z;
  }
  return total;
}

function dump_layers(layers) {
    // FUNCIÓN ELIMINADA: No necesaria para la interfaz simplificada
}

function remove_layer(layers, n) {
  var height = layers[0].length;
  var width = layers[0][0].length;
  layers.splice(n, 1);
  layers.unshift(generate_layer(width, height));
}

function check_full_layers(layers, counts) {
  var score = 0;
  var depth = layers.length;
  var height = layers[0].length;
  var width = layers[0][0].length;
  var fullsize = width * height;

  var todo = [];

  for (var i = 0; i < counts.length; ++i) {
    if (counts[i] == fullsize) {
      score += 1;
      remove_layer(layers, i);
      todo.push(i);
    }
  }

  for (var i = 0; i < todo.length; ++i) {
    counts.splice(todo[i], 1);
    counts.unshift(0);
  }

  return score * fullsize;
}

/*****************************************************************************************/
// Utils
/*****************************************************************************************/
function log(text) {
  // FUNCIÓN ELIMINADA: No necesaria
}

/*****************************************************************************************/
// Tests (eliminadas o reducidas)
/*****************************************************************************************/
function test_cubes(canvas, ctx) {
    // Eliminada
}

function test_layer(canvas, ctx) {
    // Eliminada
}

function test_cache(canvas, ctx) {
    // Eliminada
}

/*****************************************************************************************/
// Pause magic (simplificado)
/*****************************************************************************************/
function init_pause_elements() {
  // Eliminada: No se usa en modo demo
}

function pause(canvas, ctx) {
    // Eliminada: No se usa en modo demo
}

/*****************************************************************************************/
// Gameplay
/*****************************************************************************************/
function reset_pit(type) {
  LAYERS = generate_layers(PIT_WIDTH, PIT_HEIGHT, PIT_DEPTH);
  init_layers(LAYERS, type);
  COUNTS = generate_counts(LAYERS);
}

function init_game_keys(canvas, ctx) {
    // No hay teclas en modo demo
    // Aseguramos que no haya listeners para evitar errores.
    $(document).off('keydown');
}

function end_game(canvas, ctx) {
    clearTimeout(ID1);
    clearTimeout(ID2);
    render_pit(canvas, ctx);
    
    // Mostramos mensaje de Game Over en la consola
    console.log('--- GAME OVER ---');
    
    // Si estamos en demo, el startDemo() de la interfaz lo reiniciará si es necesario
    DEMO_MODE = false;
    
    // Ya no necesitamos CANVAS y CTX globales, pero los mantenemos para el flujo
    CANVAS = canvas;
    CTX = ctx;
    
    // No hay UI de gameover ni highscore en este modo
}

function handle_key(e, canvas, ctx) {
    // Eliminada: No se procesan teclas
}

function play_game(canvas, ctx, start_handler) {
  $(document).off('keydown', start_handler); // Desactivar el handler de inicio
  
  // No necesitamos configurar la UI de juego

  reset_pit(0);
  refresh_column();

  // Siempre en demo
  GAME_SPEED = 0; // El bot dicta el tiempo

  BLOCKS_PLACED = 0;
  AUTOFALL_DELAY = SPEED_MAP[GAME_SPEED]; // 0

  STATE.paused = 0;
  STATE.pause_ended_flag = 0;
  STATE.score = 0;
  refresh_score(); // Actualizamos el score a 0 en el span

  STATE.refresh_layers_flag = 1;
  reset(canvas, ctx);
  
  // Llamamos al bot para el primer movimiento con un pequeño retraso
  if (DEMO_MODE) {
    setTimeout(function () {
      bot_place(canvas, ctx);
    }, 20);
  }
  
  STATE.refresh_layers_flag = 0;
  STATE.render_shadow_flag = 0;

    START = new Date().getTime();
    ID1 = setInterval(function () { game_loop(canvas, ctx);}, FRAME_DELAY);
    // ID2 (autofall) se maneja ahora solo por el bot.
}

// fps counter globals
var COUNTER = 0;
var EC = 0;
(SC = 0), (XC = 0);

function game_loop(canvas, ctx) {
  console.log('Game loop...');
  END = new Date().getTime();
  ELAPSED = END - START;
  START = END;

  // Actualización de FPS
  COUNTER += 1;
  if(COUNTER % 50 == 0) {
      EC = (new Date).getTime();
      XC = EC - SC;
      SC = EC;
      var fpsEl = document.getElementById("fps");
      // Asume que la interfaz tiene un elemento con ID 'fps'
      if (fpsEl) fpsEl.textContent = "FPS: " + (50*(1000/XC).toFixed(1));
  }

  var prev_progress = STATE.progress;
  // La animación progresa dependiendo de la duración ANIM_DURATION
  STATE.progress = cap(STATE.progress + ELAPSED / ANIM_DURATION, 1);

  if (STATE.touchdown_flag && STATE.progress >= 1) {
    // speed_up(canvas, ctx); // Eliminada, no se usa en modo bot
    touchdown();
    if (STATE.new_z == 0) game_over(canvas, ctx);
    else new_piece(canvas, ctx);
  }

  // animate
  // Interpolación de posición (X, Y, Z)
  STATE.current_x = STATE.start_x + STATE.progress * (STATE.new_x - STATE.start_x);
  STATE.current_y = STATE.start_y + STATE.progress * (STATE.new_y - STATE.start_y);
  STATE.current_z = STATE.start_z + STATE.progress * (STATE.new_z - STATE.start_z);

  if (STATE.progress >= 1) {
    STATE.current_matrix = STATE.new_matrix;
    STATE.new_angles = [0, 0, 0];
  } else {
    // Interpolación de rotación
    var angles = [
      STATE.progress * STATE.new_angles[0],
      STATE.progress * STATE.new_angles[1],
      STATE.progress * STATE.new_angles[2],
    ];
    STATE.current_matrix = matmult(get_combined_rotmatrix(angles), STATE.start_matrix);
  }

  // render
  if (STATE.progress != prev_progress || STATE.pause_ended_flag) {
    STATE.pause_ended_flag = 0;
    render_frame(canvas, ctx);
  }

  // El bot es el único responsable de avanzar la pieza y de llamar a
  // attempt_piece_descent(); el loop principal sólo coordina la animación.
}

function render_frame(canvas, ctx) {
  draw_pit(canvas, ctx, PIT_WIDTH, PIT_HEIGHT, PIT_DEPTH);
  render_layers(canvas, ctx, LAYERS, STATE.refresh_layers_flag);
  if (STATE.render_piece_flag)
    render_piece(
      canvas,
      ctx,
      PIT_WIDTH,
      PIT_HEIGHT,
      PIT_DEPTH,
      STATE.current_x,
      STATE.current_y,
      STATE.current_z,
      STATE.piece,
      STATE.current_matrix,
      PIECE_COLOR
    );
  //if(STATE.render_shadow_flag)
  //    render_shadow(canvas, ctx, 100);
}

function reset(canvas, ctx) {
  STATE.pi = ALLOWED[rand_range(0, ALLOWED.length - 1)];
  STATE.piece = PIECES[SET][STATE.pi];
  
  // Centrar la pieza
  var startX = Math.floor(PIT_WIDTH / 2) - Math.floor(STATE.piece.bb.x[1] / 2);
  var startY = Math.floor(PIT_HEIGHT / 2) - Math.floor(STATE.piece.bb.y[1] / 2);

  STATE.current_x = startX;
  STATE.current_y = startY;
  STATE.current_z = 0;
  STATE.current_matrix = [1, 0, 0, 0, 1, 0, 0, 0, 1];

  STATE.new_x = startX;
  STATE.new_y = startY;
  STATE.new_z = 0;
  STATE.new_matrix = [1, 0, 0, 0, 1, 0, 0, 0, 1];
  STATE.new_angles = [0, 0, 0];

  STATE.start_x = startX;
  STATE.start_y = startY;
  STATE.start_z = 0;
  STATE.start_matrix = [1, 0, 0, 0, 1, 0, 0, 0, 1];

  STATE.progress = 0;

  STATE.render_piece_flag = 1;
  STATE.touchdown_flag = 0;
  render_frame(canvas, ctx);
}

function attempt_piece_descent() {
  console.log('Attempt piece descent...');
  console.log('Intentando descender pieza...');
  if (!STATE.piece) return false;

  var targetZ = STATE.new_z + 1;
  var projected = project_voxels(
    STATE.piece,
    STATE.new_x,
    STATE.new_y,
    targetZ,
    STATE.new_matrix
  );

  if (targetZ >= PIT_DEPTH) {
    console.log('Pieza ha llegado al fondo del pozo. Haciendo touchdown...');
    STATE.touchdown_flag = true;
    return false;
  }

  var overlap = is_overlap_layers(
    projected,
    PIT_WIDTH,
    PIT_HEIGHT,
    PIT_DEPTH,
    LAYERS
  );
  console.log('Overlap:', overlap);

  if (overlap) {
    console.log('Pieza no puede descender más. Haciendo touchdown...');
    STATE.touchdown_flag = true;
    return false;
  }

  set_start(true);
  STATE.new_z = targetZ;
  STATE.progress = 0;
  STATE.touchdown_flag = 0;

  return true;
}

function set_start(keep_angles) {
  STATE.start_x = STATE.current_x;
  STATE.start_y = STATE.current_y;
  STATE.start_z = STATE.current_z;

  // snap to final rotated position
  if (!keep_angles) {
    STATE.current_matrix = STATE.new_matrix;
    STATE.new_angles = [0, 0, 0];
  }

  STATE.start_matrix = STATE.current_matrix;
  STATE.progress = 0;
}
function touchdown() {
  STATE.render_piece_flag = 0;
  STATE.refresh_layers_flag = 1;

  nvoxels = project_voxels(STATE.piece, STATE.new_x, STATE.new_y, STATE.new_z, STATE.new_matrix);
  STATE.score += add_voxels(nvoxels, LAYERS, COUNTS);

  STATE.score += check_full_layers(LAYERS, COUNTS);
  refresh_score();

  refresh_column();
}

function new_piece(canvas, ctx) {
  reset(canvas, ctx);
  if (DEMO_MODE) {
    setTimeout(function () {
      bot_place(canvas, ctx);
    }, DEMO_BOT_PLACE_DELAY);
  }
}

function game_over(canvas, ctx) {

  if (DEMO_MODE) {
    // En DEMO: el juego nunca se detiene
    console.log("[DEMO] Ignorando game_over, generando nueva pieza...");
    new_piece(canvas, ctx);
    return;
  }

  // Modo normal (si existiera)
  clearTimeout(ID1);
  clearTimeout(ID2);
  render_pit(canvas, ctx);
  end_game(canvas, ctx);
  DEMO_MODE = false;
  console.log("Game Over. Final Score:", STATE.score);
}

function autofall(canvas, ctx) {
    // Eliminado: La caída automática es manejada por el bot.
}

function speed_up(canvas, ctx) {
    // Eliminado: No se usa en modo bot
}


/*****************************************************************************************/
// User interface (macros) (Simplificadas)
/*****************************************************************************************/
function set_ui_start() {
    // No hace nada en esta interfaz
}

function set_ui_game() {
    // No hace nada en esta interfaz
}

function set_ui_gameover() {
    // No hace nada en esta interfaz
}

function refresh_score() {
  // Nota: La función en index.html sobreescribe esto para actualizar el elemento correcto
  var scoreEl = document.getElementById('score'); 
  if (scoreEl) {
    scoreEl.textContent = pretty_number(STATE.score);
  }
}

/*****************************************************************************************/
// Settings
/*****************************************************************************************/
function save_settings() {
  // Guarda las configuraciones PIT en cookies
  if (typeof $.cookie === 'function') {
      var tmp = SET + ':' + PIT_WIDTH + ':' + PIT_HEIGHT + ':' + PIT_DEPTH + ':' + SPEED;
      $.cookie('co_settings', tmp, { expires: 10000 });
  }
}

function load_settings() {
  // Carga las configuraciones PIT desde cookies
  if (typeof $.cookie === 'function') {
      var tmp = $.cookie('co_settings');
      if (tmp) {
          var chunks = tmp.split(':');
          var set = chunks[0];
          if (TEMPLATES[set] != undefined) SET = set;

          PIT_WIDTH = parseInt(chunks[1]);
          PIT_HEIGHT = parseInt(chunks[2]);
          PIT_DEPTH = parseInt(chunks[3]);

          SPEED = parseInt(chunks[4]);
          AUTOFALL_DELAY = SPEED_MAP[SPEED];
      }
  }
}

/*****************************************************************************************/
// Custom keys (Eliminadas, no se usan)
/*****************************************************************************************/
function pretty_key(keycode) {}
function reset_key_labels() {}
function set_key(keycode) {}
function new_key(el) {}
function copy_keymap(src, dst) {}
function accept_keys() {}
function reset_keys() {}
function save_keys() {}
function load_keys() {}
function change_keys(canvas, ctx) {}

/*****************************************************************************************/
// Highscore (Simplificado)
/*****************************************************************************************/
function difhash(set, width, height, depth, speed) {
  return width + 'x' + height + 'x' + depth + ':' + set[0] + ':' + speed;
}

function save_score() {
    // Eliminada: No guardamos highscore en DEMO
}

function load_score() {
    // Eliminada: No cargamos highscore en DEMO
}

function generate_highscores() {
    // Eliminada
}

function show_highscores() {
    // Eliminada
}


/*****************************************************************************************/
// Colum
/*****************************************************************************************/
function refresh_column() {
  var xcanvas = $('#screen2');
  var canvas = xcanvas.get(0);
  var ctx = canvas.getContext('2d');
  
  // La interfaz pide un tamaño fijo (80x500), lo usamos
  var width = 80;
  var height = 500; 

  xcanvas.attr('width', width).attr('height', height);
  ctx.clearRect(0, 0, width, height);

  var i, c, top, bottom, lingrad;
  var unit = 14; // Tamaño de cada segmento de la columna
  var sy = height - (unit + 2) * COUNTS.length + 2;
  
  // Dibujar columna de capas
  for (i = 0; i < COUNTS.length; ++i) {
    top = sy + i * (unit + 2);
    if (COUNTS[i] != undefined && COUNTS[i] > 0) {
      var c = COLORS[COLORS.length - 1 - i];
      var c2 = 'hsla(' + c[0] + ',' + c[1] + '%,' + (c[2] - 10) + '%,' + c[3] + ')';
      var c1 = 'hsla(' + c[0] + ',' + c[1] + '%,' + (c[2] - 30) + '%,' + c[3] + ')';

      bottom = top + unit;
      lingrad = ctx.createLinearGradient(0, top, width, bottom);
      lingrad.addColorStop(0.0, c2);
      lingrad.addColorStop(1.0, c1);
      ctx.fillStyle = lingrad;
    } else {
      ctx.fillStyle = '#050505';
    }
    ctx.fillRect(0, top, unit, unit);
    
    // Dibujar porcentaje
    var percent = ((COUNTS[i] / (PIT_WIDTH * PIT_HEIGHT)) * 100).toFixed(0) + '%';
    ctx.font = '10px system-ui, sans-serif';
    ctx.fillStyle = '#555';
    ctx.textAlign = 'left';
    ctx.fillText(percent, unit + 5, top + unit / 2 + 3);
  }
}

/*****************************************************************************************/
// Main
/*****************************************************************************************/

var rotateSpeed = "medium";

function setRotateSpeed(spd) {
    if (spd === "slow")

      ANIM_DURATION = SLOW_ANIM_DURATION;
    else if (spd === "fast") {
        ANIM_DURATION = FAST_ANIM_DURATION;
} else {
        ANIM_DURATION = MED_ANIM_DURATION;
    }
}

$(document).ready(function () {
  copy_keymap(KEYMAP_DEFAULT, KEYMAP);
  copy_keymap(KEYMAP, KEYMAP_TMP);

  load_settings();
  
  var xcanvas = $('#screen');
  var canvas = xcanvas.get(0);
  var ctx = canvas.getContext('2d');
  xcanvas.attr('width', WIDTH).attr('height', HEIGHT);

  precompute_pieces();
  init_colors(PIT_DEPTH);

  reset_pit(3);
  render_pit(canvas, ctx);
  reset_allowed();

  STATE.score = 0;
  refresh_score();

  // Inicialización obligatoria del estado para que game_loop arranque bien
STATE.progress = 0;
STATE.current_x = 0;
STATE.current_y = 0;
STATE.current_z = 0;
STATE.current_matrix = [1,0,0, 0,1,0, 0,0,1];

STATE.start_x = 0;
STATE.start_y = 0;
STATE.start_z = 0;
STATE.start_matrix = [1,0,0, 0,1,0, 0,0,1];

STATE.new_x = 0;
STATE.new_y = 0;
STATE.new_z = 0;
STATE.new_matrix = [1,0,0, 0,1,0, 0,0,1];
STATE.new_angles = [0,0,0];


  
  // Eliminamos listeners de UI innecesarios
  $('#pitSizeSelect').change(function() {
      applyPitFromSelect();
  });
});

function showScoreUI() {
    // Eliminada: No hay UI de highscore/gameover
}

// FUNCIONES DE UI DEL JUEGO QUE DEBEN EXISTIR PERO NO HACEN NADA EN ESTA VERSIÓN
function change_set(el) { /* no-op */ }
function change_speed(el) { /* no-op */ }
function change_pit(el, canvas, ctx) {
  var dimensions = el.innerHTML.toLowerCase().split('x');
  PIT_WIDTH = parseInt(dimensions[0]);
  PIT_HEIGHT = parseInt(dimensions[1]);
  PIT_DEPTH = parseInt(dimensions[2]);

  save_settings();

  init_colors(PIT_DEPTH);

  reset_pit(3);
  render_pit(canvas, ctx);

  reset_allowed();
}

function reset_allowed() {
  ALLOWED = [];
  for (var i = 0; i < PIECES[SET].length; ++i) {
    var bb = PIECES[SET][i].bb;
    if (
      bb.x[0] >= 0 &&
      bb.x[1] <= PIT_WIDTH &&
      bb.y[0] >= 0 &&
      bb.y[1] <= PIT_HEIGHT &&
      bb.z[0] >= 0 &&
      bb.z[1] <= PIT_DEPTH
    )
      ALLOWED.push(i);
  }
}
