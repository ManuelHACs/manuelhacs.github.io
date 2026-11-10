/**
 * Mantenimiento CIFP La Granja: conexión entre la aplicación web y esta hoja.
 *
 * La aplicación guarda cada tarea e incidencia como una fila de la pestaña "Datos".
 * La pestaña "Resumen" se rellena sola con los campos más útiles para consultarlos a mano.
 * No hace falta tocar nada de este código.
 */

const HOJA_DATOS = 'Datos';
const HOJA_RESUMEN = 'Resumen';
const COLECCIONES = ['tareas', 'incidencias'];
const CABECERA = ['coleccion', 'id', 'json', 'actualizado', 'por'];
const CABECERA_RESUMEN = ['coleccion', 'id', 'estado', 'asignado_a', 'ultima_ejecucion', 'descripcion', 'actualizado', 'por'];

function doGet() {
  return responder_({ ok: true, data: leerTodo_() });
}

function doPost(e) {
  try {
    const p = JSON.parse((e && e.postData && e.postData.contents) || '{}');
    if (p.action === 'list') return responder_({ ok: true, data: leerTodo_() });
    if (p.action === 'set' || p.action === 'delete') {
      if (COLECCIONES.indexOf(p.col) < 0) throw new Error('Colección no válida');
      if (!p.id || String(p.id).length > 120) throw new Error('Identificador no válido');
      const lock = LockService.getScriptLock();
      lock.waitLock(20000);
      try {
        if (p.action === 'set') guardar_(p.col, String(p.id), p.data, p.by);
        else borrar_(p.col, String(p.id));
      } finally {
        lock.releaseLock();
      }
      return responder_({ ok: true });
    }
    throw new Error('Acción no válida');
  } catch (err) {
    return responder_({ ok: false, error: String(err && err.message || err) });
  }
}

function responder_(obj) {
  return ContentService.createTextOutput(JSON.stringify(obj)).setMimeType(ContentService.MimeType.JSON);
}

function hoja_(nombre, cabecera) {
  const ss = SpreadsheetApp.getActiveSpreadsheet();
  let sh = ss.getSheetByName(nombre);
  if (!sh) sh = ss.insertSheet(nombre);
  if (sh.getLastRow() === 0) {
    sh.appendRow(cabecera);
    sh.setFrozenRows(1);
    sh.getRange(1, 1, 1, cabecera.length).setFontWeight('bold');
  }
  return sh;
}

function leerTodo_() {
  const out = {};
  COLECCIONES.forEach(function (c) { out[c] = {}; });
  const sh = hoja_(HOJA_DATOS, CABECERA);
  const n = sh.getLastRow() - 1;
  if (n <= 0) return out;
  const filas = sh.getRange(2, 1, n, 3).getValues();
  filas.forEach(function (f) {
    if (!out[f[0]] || !f[1]) return;
    try { out[f[0]][f[1]] = JSON.parse(f[2]); } catch (e) {}
  });
  return out;
}

function buscarFila_(sh, col, id) {
  const n = sh.getLastRow() - 1;
  if (n <= 0) return -1;
  const vals = sh.getRange(2, 1, n, 2).getValues();
  for (let i = 0; i < vals.length; i++) {
    if (vals[i][0] === col && String(vals[i][1]) === id) return i + 2;
  }
  return -1;
}

function guardar_(col, id, data, por) {
  const json = JSON.stringify(data);
  if (json.length > 49000) throw new Error('El registro es demasiado grande');
  const ahora = new Date();
  const fila = [col, id, json, ahora, String(por || '').slice(0, 60)];
  const sh = hoja_(HOJA_DATOS, CABECERA);
  const r = buscarFila_(sh, col, id);
  if (r > 0) sh.getRange(r, 1, 1, fila.length).setValues([fila]);
  else sh.appendRow(fila);

  const d = data || {};
  const resumen = [col, id, d.status || '', d.destino || '', d.lastDone || '', d.note || d.titulo || d.title || '', ahora, fila[4]];
  const rs = hoja_(HOJA_RESUMEN, CABECERA_RESUMEN);
  const rr = buscarFila_(rs, col, id);
  if (rr > 0) rs.getRange(rr, 1, 1, resumen.length).setValues([resumen]);
  else rs.appendRow(resumen);
}

function borrar_(col, id) {
  [HOJA_DATOS, HOJA_RESUMEN].forEach(function (nombre) {
    const sh = SpreadsheetApp.getActiveSpreadsheet().getSheetByName(nombre);
    if (!sh) return;
    const r = buscarFila_(sh, col, id);
    if (r > 0) sh.deleteRow(r);
  });
}

/** Ejecuta esta función una vez desde el editor para crear las pestañas y dar permisos. */
function preparar() {
  hoja_(HOJA_DATOS, CABECERA);
  hoja_(HOJA_RESUMEN, CABECERA_RESUMEN);
}
