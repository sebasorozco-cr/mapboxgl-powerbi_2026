# Mapbox GL para Power BI – v1.8.4.1

Visual personalizado de Power BI basado en Mapbox GL JS 3.20. Esta versión agrega soporte para los estilos basados en Standard de Mapbox, un **modo Caminata** en primera persona, un control **Rayos X** y numerosas mejoras de interfaz y estabilidad respecto a la versión **v1.7.4.1**.

## Novedades desde la v1.7.4.1

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

## Nota sobre la versión
La v1.8.4.1 usa un GUID nuevo, por lo que Power BI la trata como un visual distinto de las versiones anteriores. En los informes existentes, reemplace el visual anterior por este.

## Notas conocidas
- Las opciones de terreno, ajustes de iluminación y "color real" solo se aplican a estilos basados en Standard.
- Hasta ahora no se han encontrado nuevas limitaciones.
