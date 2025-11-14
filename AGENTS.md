Guía para Desarrollar Agentes de Depuración
Directivas de Desarrollo
Desarrollar el análisis en idioma español: Todo el análisis y documentación debe ser realizado en español para facilitar la comprensión y el mantenimiento del código.
Priorizar el concepto de "fast fail": El código debe ser diseñado para fallar lo más rápidamente posible cuando se detecte un error, para minimizar el impacto en el sistema y facilitar la depuración.
Agregar comentarios para ayudar al mantenimiento: El código debe incluir comentarios claros y concisos que expliquen la lógica y el propósito de cada sección, para facilitar el mantenimiento y la depuración.
Estrategias de Depuración
Identificar los puntos de falla: Antes de comenzar a depurar, es importante identificar los puntos de falla potenciales en el código.
Utilizar logs y trazas: Utilizar logs y trazas para registrar la ejecución del código y detectar errores.
Implementar pruebas unitarias: Implementar pruebas unitarias para verificar la funcionalidad de cada componente del código.
Utilizar herramientas de depuración: Utilizar herramientas de depuración como depuradores y analizadores de código para identificar y solucionar errores.
Mejores Prácticas
Seguir los estándares de codificación: Seguir los estándares de codificación establecidos para el proyecto para mantener la consistencia y la legibilidad del código.
Utilizar nombres de variables y funciones descriptivos: Utilizar nombres de variables y funciones que describan claramente su propósito y funcionalidad.
Evitar la complejidad innecesaria: Evitar la complejidad innecesaria en el código y enfocarse en la simplicidad y la claridad.
Documentar el código: Documentar el código de manera clara y concisa para facilitar el mantenimiento y la depuración.
Ejemplo de Código con "Fast Fail" y Comentarios
JavaScript
function attempt_piece_descent() {
  // Verificar si la pieza es válida
  if (!STATE.piece) {
    console.error("La pieza no es válida");
    return false;
  }

  // Calcular la posición de la pieza
  var targetZ = STATE.new_z + 1;
  var projected = project_voxels(
    STATE.piece,
    STATE.new_x,
    STATE.new_y,
    targetZ,
    STATE.new_matrix
  );

  // Verificar si la pieza se superpone con otras piezas
  if (is_overlap_layers(projected, PIT_WIDTH, PIT_HEIGHT, PIT_DEPTH, LAYERS)) {
    console.log("Pieza se superpone con otras piezas");
    STATE.touchdown_flag = true;
    return false;
  }

  // Actualizar la posición de la pieza
  set_start(true);
  STATE.new_z = targetZ;
  STATE.progress = 0;
  STATE.touchdown_flag = 0;

  return true;
}
En este ejemplo, se utiliza el concepto de "fast fail" para verificar si la pieza es válida y si se superpone con otras piezas, y se agregan comentarios para explicar la lógica y el propósito de cada sección del código.
