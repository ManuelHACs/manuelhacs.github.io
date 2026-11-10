# Mantenimiento CIFP La Granja

Aplicación web para llevar el plan de mantenimiento del edificio y de los equipos del CIFP La Granja (Edificio, Forestal, Alimentaria, Laboratorio y Jardinería).

- `index.html`: la aplicación, que incluye el catálogo de tareas.
- `config.js`: dirección del script de Google que guarda los datos.
- `apps-script/Codigo.gs`: código que se pega en la hoja de Google (Extensiones › Apps Script).

Los datos se guardan en una hoja de Google Sheets. La pestaña **Datos** es la que usa la aplicación (no editar a mano) y la pestaña **Resumen** sirve para consultar de un vistazo el estado de cada tarea.

## Puesta en marcha del script

1. Abre la hoja de datos › **Extensiones › Apps Script**.
2. Borra lo que haya y pega el contenido de `apps-script/Codigo.gs`. Guarda.
3. Elige la función `preparar` y pulsa **Ejecutar**. Acepta los permisos.
4. **Implementar › Nueva implementación** › tipo **Aplicación web**:
   - Ejecutar como: **Yo**
   - Quién tiene acceso: **Cualquier usuario**
5. Copia la URL que acaba en `/exec` y ponla en `config.js`.

Si más adelante cambias el código del script, usa **Implementar › Gestionar implementaciones › Editar › Nueva versión** para que la URL no cambie.
