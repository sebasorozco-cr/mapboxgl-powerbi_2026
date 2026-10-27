# Mapbox GL para Power BI – v1.8.5

Visual personalizado de Power BI basado en Mapbox GL JS 3.20. Esta versión corrige la altura de extrusión de los mapas coropléticos 3D, que ahora es estable y se expresa en metros, y conserva todo lo incorporado en la **v1.8.4.1** (soporte para estilos Standard, modo Caminata y control Rayos X).

## Novedades de la v1.8.5

### Mapa coroplético: altura de extrusión absoluta (en metros)

Anteriormente, la altura de los polígonos extruidos de los mapas coropléticos se reescalaba usando el mínimo y el máximo del campo colocado en **Size**:

- El valor más bajo de los datos se dibujaba con altura cero, y todos los demás valores se extruían en relación con él.
- Power BI solo entrega al visual las filas que quedan después de aplicar los filtros, por lo que al aplicar cualquier segmentación o filtro cambiaban el mínimo y el máximo y, con ellos, la altura mostrada de todos los polígonos.
- Además se aplicaba un multiplicador interno fijo (×100), de modo que las alturas no estaban en metros.

Esto hacía que el visual no fuera confiable para la visualización urbana en 3D, donde la altura de un edificio no debe depender de qué otros elementos estén visibles en ese momento.

La v1.8.5 agrega una nueva opción, **Height in meters (absolute)** (altura en metros, absoluta), en la sección *Choropleth* del panel de formato. Viene **activada por defecto**.

Cuando está activada:

- El valor del campo **Size** se usa directamente como altura de extrusión **en metros**, igual que funciona `fill-extrusion-height` en Mapbox Studio.
- Las alturas no dependen del mínimo, del máximo ni de ninguna otra estadística del conjunto de datos, por lo que permanecen constantes al aplicar filtros, segmentaciones o filtrado cruzado.
- No se aplica el multiplicador interno ×100.
- El parámetro anterior **Extrusion Height** ya no activa ni desactiva la extrusión. La extrusión está activa siempre que haya un campo asignado a **Size**.
- Las filas con un valor de Size vacío o no numérico se dibujan con altura 0.

Cuando está desactivada, se mantiene el comportamiento anterior (los valores se reescalan entre la altura base y el parámetro **Extrusion Height**).

> **Consejo:** el campo Size debe contener ya la altura en metros. Si sus datos contienen otra magnitud (por ejemplo, el número de pisos), cree una columna calculada en Power BI que la convierta a metros y use esa columna como Size. Por ejemplo, con `DAX`: `Height m = SWITCH([Levels], 2, 6, 3, 10, 3)`.

### Cambios técnicos

| Archivo | Cambio |
| --- | --- |
| `src/layers/choropleth.ts` | `sizeInterpolate()` devuelve `baseHeight + valor` en modo absoluto y se protege contra valores nulos o no numéricos. El multiplicador de altura solo se aplica en el modo anterior. `isExtruding()` ya no depende del parámetro `height` en modo absoluto. |
| `src/settings.ts` | Nueva propiedad `absoluteHeight: boolean` en `ChoroplethSettings` (por defecto `true`). |
| `capabilities.json` | Nuevo booleano `absoluteHeight` en el objeto `choropleth`. |

### Notas conocidas

- La clasificación de colores sigue usando el mínimo y el máximo de los datos que recibe, por lo que las clases de color aún pueden cambiar al aplicar filtros. Solo la altura de extrusión se hizo independiente del conjunto de datos.
- Los informes que dependían de las alturas reescaladas anteriores se verán distintos después de actualizar, porque el nuevo modo viene activado por defecto. Desactive **Height in meters (absolute)** en esos informes para recuperar el aspecto anterior.

## Nota sobre la versión

La v1.8.5 usa un GUID nuevo, por lo que Power BI la trata como un visual distinto de las versiones anteriores. En los informes existentes, reemplace el visual anterior por este.

---

## Versión anterior: v1.8.4.1

Agregó soporte para los estilos basados en Standard de Mapbox, un **modo Caminata** en primera persona, un control **Rayos X** y numerosas mejoras de interfaz y estabilidad respecto a la versión **v1.7.4.1**.

### Soporte para estilos Standard de Mapbox
- Soporte para los estilos basados en Standard de Mapbox, incluyendo los ajustes de iluminación (Día, Amanecer, Atardecer, Noche), topografía 3D, edificios y monumentos (landmarks).
- **Panel de estilo** dentro del mapa para cambiar las opciones del estilo directamente desde el visor. Se oculta solo 2 segundos después del último clic y permanece visible mientras el mouse esté sobre él.
- Opción **Posición de los datos**: permite elegir dónde se ubican las capas de datos respecto a las capas del mapa base (slots).
- **Color real en las capas de datos**: las capas de datos del usuario pueden ignorar la iluminación del ajuste elegido y conservar sus colores originales.
- **Control de terreno**: mostrar, ocultar o mantener el terreno definido por el estilo.
- Los colores de resaltado y de resaltado al pasar el mouse en los mapas coropléticos se mantienen exactamente como se eligen en el panel de formato, con cualquier ajuste de iluminación.
- Las herramientas de selección (dibujo) conservan colores consistentes bajo los ajustes de iluminación oscuros.
- Mapbox GL JS actualizado a la versión 3.20.

### Modo Caminata
- Nuevo modo de navegación en primera persona.
  - **W / A / S / D**: moverse.
  - **Q / E**: cambiar la inclinación (pitch).
  - **Teclas de flecha**: cambiar el nivel de zoom.
- Al activarlo, el mapa se inclina y el zoom pasa directamente al nivel 18. Al desactivarlo, se recupera el zoom y la inclinación que tenía el usuario.
- Comportamiento de los botones refinado.

### Control Rayos X
- Nuevo botón Rayos X que permite ver a través de los edificios 3D. Los monumentos 3D (landmarks) no se ven afectados.

### Inclinación (pitch)
- Nuevo parámetro **Inclinación inicial** (activar/desactivar + ángulo) en la pestaña *Viz Settings*. Funciona con el zoom automático activado o desactivado.
- Se eliminó el parámetro **Extrusion Pitch** de la pestaña Choropleth, porque no funcionaba con el estilo Standard.

### Mejoras de interfaz
- Fuente más grande en el cuadro de búsqueda del geocodificador.
- Nuevos íconos simples y monocromáticos para los botones Rayos X y Modo Caminata, en armonía con el resto de los controles del visor.
- Ocultamiento automático del panel de estilo (ver arriba).

### Correcciones
- La geometría definida por el usuario y la leyenda de colores ahora cargan correctamente en la primera carga. Antes podían faltar hasta aplicar un filtro o cambiar de página del informe.
- Se corrigió un error en la primera carga (`Cannot read properties of undefined (reading 'send')`).
- Las opciones de Standard se vuelven a aplicar cuando el mapa queda inactivo, por lo que los valores por defecto del estilo ya no las sobrescriben.

### Notas conocidas
- Las opciones de terreno, ajustes de iluminación y "color real" solo se aplican a estilos basados en Standard.
