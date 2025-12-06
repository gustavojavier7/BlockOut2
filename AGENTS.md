# 🧩 Guía de Desarrollo de Agentes para Depuración del Juego

**Proyecto:** Tetris HTML5 Co-op + IA Assist  
**Versión del Documento:** 1.0.0  
**Versión del Juego Requerida (UI):** ≥ v2.1  
**Autor:** Gustavo + Agente de Depuración  
**Última Actualización:** 2025-12-06

> Este documento define las reglas de implementación para agentes automáticos en el juego: Co-op Bot e IA-Assist, con foco en estabilidad, depuración y Fast-Fail.

---

## 📌 Principio Rector: Fast-Fail

Un agente **debe abortar inmediatamente** cualquier acción si detecta una condición inválida.

✔ No avanzar con estados corruptos  
✔ No continuar si hay superposición detectable  
✔ No ocultar errores → siempre loguear el motivo  
✔ Reversión automática del daño parcial  
✔ Encapsular la falla para evitar cascadas

📍 _Meta_: detectar el error **antes** de que el jugador o el bot lo sufran.

Ejemplo mínimo:

```js
if (!puzzle) return fail("[AGENT] Pieza no disponible.");
if (overlap(projected)) return fail("[AGENT] Colisión simulada.");

