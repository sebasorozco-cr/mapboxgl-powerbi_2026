import { Filter } from "./filter"
import { constants } from "./constants"
import { MapboxMap } from "./visual"
//import { MapboxDraw, MapboxDrawConstants, LassoDraw } from "@mapbox/mapbox-gl-draw"
import * as MapboxDrawConstants from "./drawConstants";
import { LassoDraw } from "./lassoDraw"
import { RadiusDraw } from "./radiusDraw"
import * as MapboxDrawModule from '@mapbox/mapbox-gl-draw';
// Package root import (deep imports are blocked by the package "exports" field).
const MapboxDraw: any = (MapboxDrawModule as any).default || MapboxDrawModule;

import { polygon } from "@turf/helpers"
import bbox from "@turf/bbox"
import booleanContains from "@turf/boolean-contains"
import booleanOverlap from "@turf/boolean-overlap"

export class DrawControl implements mapboxgl.IControl {
    private draw: any;
    private filter: Filter;

    constructor(filter: Filter) {
        this.filter = filter
        // Override the line string tool with our lasso draw tool
        MapboxDraw.modes.draw_line_string = LassoDraw.create(this.filter);
        // Override the (unused) point tool with our radius selection tool
        MapboxDraw.modes.draw_point = RadiusDraw.create(this.filter);

        this.draw = new MapboxDraw({
            displayControlsDefault: false,
            // defaultMode: 'lasso',
            controls: {
                'polygon': true,
                'line_string': true,    // Lasso is overriding the 'line_string' mode
                'point': true           // Radius is overriding the 'point' mode
            },
        });

    }

    updateDrawTools(isLassoTurnedOn, isPolygonTurnedOn, isRadiusTurnedOn = true) {
        this.draw.options.controls.line_string = isLassoTurnedOn
        this.draw.options.controls.polygon = isPolygonTurnedOn
        this.draw.options.controls.point = isRadiusTurnedOn
    }

    // Keeps the selection shapes readable under every light preset:
    // dark in day/dawn, yellow in dusk/night (inverted from the old behaviour)
    public restyle(map: any) {
    try {
        if (!map || !map.getStyle()) { return; }
        let preset = 'day';
        try { preset = String(map.getConfigProperty('basemap', 'lightPreset') || 'day'); } catch (e) { /* not a Standard style */ }
        const dark = preset === 'night' || preset === 'dusk';
        const color = dark ? '#fbb03b' : '#111111';

        const drawLayers = (map.getStyle().layers || []).filter((l: any) => l.id && l.id.indexOf('gl-draw-') === 0);
        console.log('[DrawControl] preset=' + preset + ' color=' + color + ' drawLayers=' + drawLayers.length,
            drawLayers.map((l: any) => l.id));

        drawLayers.forEach((l: any) => {
            // leave the vertex / midpoint handles with their own colors
            if (l.id.indexOf('vertex') > -1 || l.id.indexOf('midpoint') > -1) { return; }
            try {
                if (l.type === 'fill') {
                    map.setPaintProperty(l.id, 'fill-emissive-strength', 1);
                    map.setPaintProperty(l.id, 'fill-color', color);
                    map.setPaintProperty(l.id, 'fill-outline-color', color);
                } else if (l.type === 'line') {
                    map.setPaintProperty(l.id, 'line-emissive-strength', 1);
                    map.setPaintProperty(l.id, 'line-color', color);
                }
            } catch (e) { /* unsupported property */ }
        });
    } catch (e) { /* map not ready */ }
}

    manageHandlers(mapVisual: MapboxMap) {
        const map: mapboxgl.Map = mapVisual.getMap()
        map.on('draw.modechange' as any, () => {
            this.restyle(map);
            setTimeout(() => this.restyle(map), 50); // draw may add its layers a moment later
        });
        map.on('draw.create' as any, (e: any) => {

            map.doubleClickZoom.disable();

            // Get the feature the user has drawn
            const selection_poly = e.features[0];

            const selectFeature = function (sel_pol, feature) {
                if (feature.geometry.type === 'Point' && booleanContains(sel_pol, feature)) {
                    return true;
                }
                if ((feature.geometry.type === 'Polygon' || feature.geometry.type === 'Linestring') &&
                    (booleanOverlap(feature, sel_pol) || booleanContains(sel_pol, feature) ||
                        booleanContains(feature, sel_pol)
                    )) {
                    return true;
                }

                return false;
            }

            // Create a bounding box from the user's polygon
            const polygonBoundingBox = bbox(selection_poly);
            const southWest = map.project([polygonBoundingBox[0], polygonBoundingBox[1]]);
            const northEast = map.project([polygonBoundingBox[2], polygonBoundingBox[3]]);

            // Find features in a layer the user selected bbox
            const layers = mapVisual.getExistingLayers();
            const layerIDs = layers.map(layer => layer.getId());
            const bbox_features: any[] = map.queryRenderedFeatures([southWest, northEast], {
                layers: layerIDs
            });

            let selectedFeatures = bbox_features.reduce(function (acc, feature) {
                if (selectFeature(selection_poly, feature)) {
                    acc.push(feature);
                    return acc;
                }

                // Split the feature into polygons, if it is a MultiPolygon
                if (feature.geometry.type === 'MultiPolygon') {
                    for (let poly of feature.geometry.coordinates) {
                        if (selectFeature(selection_poly, polygon(poly))) {
                            acc.push(feature);
                            return acc;
                        }
                    };
                }

                return acc;
            }, []);

            // Here are the selected features we can use for filters, selects, etc
            if (layers && layers.length > 0) {
                const roleMap = mapVisual.getRoleMap();
                if (selectedFeatures.length > constants.MAX_SELECTION_COUNT) {
                    selectedFeatures = selectedFeatures.slice(0, constants.MAX_SELECTION_COUNT);
                }
                layers.map(layer => {
                    this.filter.updateSelection(layer, selectedFeatures, roleMap)
                })
            }

            // Remove all features from the map after selection
            this.draw.deleteAll();
        });
    }

    onAdd(map: mapboxgl.Map): HTMLElement {
        const drawControlHTML: HTMLElement = this.draw.onAdd(map)
        drawControlHTML.setAttribute("id", "drawControl");

        // Replace the line string draw icon to the lasso icon
        const drawLineGroup = drawControlHTML.getElementsByClassName(MapboxDrawConstants.classes.CONTROL_BUTTON_LINE);
        const drawLineControl: HTMLElement = <HTMLElement>drawLineGroup[0];
        LassoDraw.makeIcon(drawLineControl);

        // Replace the point draw icon to the radius icon and place it right under the lasso button
        const drawPointGroup = drawControlHTML.getElementsByClassName(MapboxDrawConstants.classes.CONTROL_BUTTON_POINT);
        const drawPointControl: HTMLElement = <HTMLElement>drawPointGroup[0];
        if (drawPointControl) {
            RadiusDraw.makeIcon(drawPointControl);
            if (drawLineControl && drawLineControl.parentNode && drawLineControl.parentNode === drawPointControl.parentNode) {
                drawLineControl.parentNode.insertBefore(drawPointControl, drawLineControl.nextSibling);
            }
        }

        return drawControlHTML
    }

    onRemove(map: mapboxgl.Map) {
        this.draw.onRemove(map)
    }

    getDefaultPosition(): any {
        return 'top-left'
    }
}
