# Mapbox GL for Power BI – v1.8.4.1

Custom Power BI visual based on Mapbox GL JS 3.20. This release adds support for Mapbox's Standard-based styles, a first-person **Walk mode**, an **X-ray** control, and many interface and stability improvements over **v1.7.4.1**.

## What's new since v1.7.4.1

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

## Version note
v1.8.4.1 uses a new visual GUID, so Power BI treats it as a different visual from earlier versions. In existing reports, replace the old visual with this one.

## Known notes
- The terrain, light-preset and "true color" options only apply to Standard-based styles.

