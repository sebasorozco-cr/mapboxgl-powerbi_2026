// Placement of the visual's data layers (circles, clusters, heatmap, choropleth, raster).
//
// Classic styles: layers are placed before a style layer id (see calculateLabelPosition).
//
// Mapbox Standard (and styles built on it) is loaded as a style *import*. Its layers are not part of
// map.getStyle().layers, so data layers are placed with the `slot` layer property instead.
// Slots of Standard, as documented by Mapbox:
//   'bottom' - above land / water polygons, below roads
//   'middle' - above roads (lines), behind 3D buildings, below ALL labels
//   'top'    - above POI labels, behind place and transit labels (meant for symbol layers)
//   none     - above everything
// Which one is used is chosen by the "Data position" option of the Standard Style card.

interface SlotSettings {
    standard?: { dataPosition?: string };
}

/** Ids of the style imports (e.g. 'basemap' for Mapbox Standard). Empty for classic styles. */
export function getStyleImportIds(map: any): string[] {
    try {
        const style: any = map.getStyle();
        if (style && Array.isArray(style.imports)) {
            return style.imports.map((i: any) => i.id);
        }
    } catch (e) {
        // style not ready yet
    }
    return [];
}

/** True when the loaded style is built on imports (Mapbox Standard and derived styles). */
export function usesImportedBasemap(map: any): boolean {
    return getStyleImportIds(map).length > 0;
}

/** Slot to put data layers in, or undefined when the layers should simply go on top of everything. */
export function getDataSlot(settings: SlotSettings, map: any): string | undefined {
    if (!usesImportedBasemap(map)) {
        return undefined;
    }
    const position = settings && settings.standard ? settings.standard.dataPosition : undefined;
    if (position === 'none') {
        return undefined;
    }
    return position === 'top' ? 'top' : 'middle';
}

// The slot every data layer was last added with, per map ('' means "no slot").
// Tracked here because a layer's slot cannot be changed in place and should not be read back
// from Mapbox internals.
const layerSlots = new WeakMap<object, { [layerId: string]: string }>();

function rememberSlot(map: any, layerId: string, slot: string | undefined) {
    let slots = layerSlots.get(map);
    if (!slots) {
        slots = {};
        layerSlots.set(map, slots);
    }
    slots[layerId] = slot || '';
}

function recordedSlot(map: any, layerId: string): string | undefined {
    const slots = layerSlots.get(map);
    return slots ? slots[layerId] : undefined;
}

/** map.addLayer that is aware of slots. */
export function addDataLayer(map: any, layer: any, beforeId: string | null | undefined, settings: SlotSettings) {
    const slot = getDataSlot(settings, map);
    if (slot) {
        layer.slot = slot;
    } else {
        delete layer.slot;
    }
    map.addLayer(layer, beforeId || undefined);
    rememberSlot(map, layer.id, slot);
}

/** map.moveLayer that is aware of slots, and that follows a change of the "Data position" option. */
export function moveDataLayer(map: any, layerId: string, beforeId: string | null | undefined, settings: SlotSettings) {
    if (usesImportedBasemap(map)) {
        const slot = getDataSlot(settings, map);
        const recorded = recordedSlot(map, layerId);

        if (recorded !== undefined && recorded !== (slot || '')) {
            // The data position changed: the slot cannot be changed in place, so re-create the layer
            relocateLayer(map, layerId, slot, beforeId);
            return;
        }
        if (slot && !beforeId) {
            // Already at the end of its slot; moving without a target would push it out of the slot
            return;
        }
    }
    map.moveLayer(layerId, beforeId || undefined);
}

function relocateLayer(map: any, layerId: string, slot: string | undefined, beforeId: string | null | undefined) {
    const style: any = map.getStyle();
    const layers: any[] = style && Array.isArray(style.layers) ? style.layers : [];
    const spec = layers.filter((l) => l.id === layerId)[0];
    if (!spec) {
        return;
    }

    // Detached copy of the layer's current definition (source, filter, paint, layout, zoom range...)
    const copy = JSON.parse(JSON.stringify(spec));
    if (slot) {
        copy.slot = slot;
    } else {
        delete copy.slot;
    }

    map.removeLayer(layerId);
    map.addLayer(copy, beforeId || undefined);
    rememberSlot(map, layerId, slot);
}
