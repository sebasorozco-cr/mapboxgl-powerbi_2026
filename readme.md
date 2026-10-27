# Mapbox GL for Power BI – v1.8.5

Custom Power BI visual based on Mapbox GL JS 3.20. This release fixes the extrusion height of 3D Choropleth maps, which is now stable and expressed in meters, on top of everything introduced in **v1.8.4.1** (Standard style support, Walk mode, X-ray control).

## What's new in v1.8.5

### Choropleth: absolute extrusion height (in meters)

Previously, the height of extruded Choropleth polygons was rescaled using the minimum and maximum of the field placed in **Size**:

- The lowest value in the data was drawn at zero height, and every other value was extruded relative to it.
- Power BI only passes the rows that remain after filters, so applying any slicer or filter changed the minimum and maximum, and with them the displayed height of every polygon.
- A fixed internal multiplier (×100) was applied on top, so heights were not in meters.

This made the visual unreliable for 3D urban visualization, where the height of a building must not depend on what else is currently on screen.

v1.8.5 adds a new option, **Height in meters (absolute)**, in the *Choropleth* section of the format pane. It is **on by default**.

When it is on:

- The value of the **Size** field is used directly as the extrusion height **in meters**, the same way Mapbox Studio's `fill-extrusion-height` works.
- Heights do not depend on the minimum, maximum, or any other statistic of the dataset, so they remain constant when filters, slicers, or cross-filtering are applied.
- The internal ×100 multiplier is not applied.
- The legacy **Extrusion Height** setting no longer switches extrusion on or off. Extrusion is active whenever a **Size** field is assigned.
- Rows with an empty or non-numeric Size value are drawn at height 0.

When it is off, the previous behavior is kept (values rescaled between the base height and the **Extrusion Height** setting).

> **Tip:** the Size field must already contain the height in meters. If your data holds another quantity (for example, number of floors), create a calculated column in Power BI that converts it to meters and use that column as Size. For example, with `DAX`: `Height m = SWITCH([Levels], 2, 6, 3, 10, 3)`.

### Technical changes

| File | Change |
| --- | --- |
| `src/layers/choropleth.ts` | `sizeInterpolate()` returns `baseHeight + value` in absolute mode and guards against null / non-numeric values. The height multiplier is only applied in legacy mode. `isExtruding()` no longer depends on the `height` setting in absolute mode. |
| `src/settings.ts` | New `absoluteHeight: boolean` property in `ChoroplethSettings` (default `true`). |
| `capabilities.json` | New `absoluteHeight` boolean in the `choropleth` object. |

### Known notes

- Color classification still uses the minimum and maximum of the data it receives, so color classes can still change when filters are applied. Only the extrusion height has been made independent of the dataset.
- Reports that relied on the old scaled heights will look different after upgrading, because the new mode is on by default. Turn off **Height in meters (absolute)** in those reports to restore the previous look.

## Version note

If the visual GUID is unchanged from the previous release, Power BI will treat v1.8.5 as an update of the same visual. If it was changed, replace the old visual with this one in existing reports.

---

## Previous release: v1.8.4.1

Added support for Mapbox's Standard-based styles, a first-person **Walk mode**, an **X-ray** control, and many interface and stability improvements over **v1.7.4.1**.

### Mapbox Standard style support
- Support for Mapbox's Standard-based styles, including light presets (Day, Dawn, Dusk, Night), 3D Topography, Buildings and Landmarks.
- In-map **style panel** to change the style options directly from the viewport. It hides itself 2 seconds after the last click and stays visible while the mouse is over it.
- **Data position** option: choose where data layers sit relative to the basemap layers (slots).
- **True color for data layers**: user-data layers can ignore the lighting of the light preset and keep their original colors.
- **Terrain switch**: show, hide, or keep the terrain defined by the style.
- Highlight and hover-highlight colors of Choropleth maps are kept exactly as chosen in the format pane under every light preset.
- Selection tools (draw) keep consistent colors under dark light presets.
- Mapbox GL JS upgraded to version 3.20.

### Walk mode
- New first-person navigation mode.
  - **W / A / S / D**: move.
  - **Q / E**: change the pitch.
  - **Arrow keys**: change the zoom level.
- Turning it on tilts the map and zooms straight to level 18. Turning it off returns to the zoom and pitch the user had before.
- Refined button behavior.

### X-ray control
- New X-ray button that lets users see through 3D buildings. 3D Landmarks are not affected.

### Pitch
- New **Initial Pitch** setting (on/off + angle) in the *Viz Settings* tab. It works whether Auto-zoom is on or off.
- Removed the **Extrusion Pitch** setting from the Choropleth tab, since it did not work with the Standard style.

### Interface improvements
- Larger font in the geocoder search box.
- New simple, monochrome icons for the X-ray and Walk mode buttons, matching the rest of the viewport controls.
- Style panel auto-hide (see above).

### Fixes
- User-defined geometry and the color legend now load correctly on first load. Previously they could be missing until a filter was applied or the report page was changed.
- Fixed a first-load error (`Cannot read properties of undefined (reading 'send')`).
- Standard options are re-applied once the map is idle, so the style's defaults no longer overwrite them.

### Known notes
- The terrain, light-preset and "true color" options only apply to Standard-based styles.
