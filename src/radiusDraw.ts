import { Filter } from "./filter"
import * as MapboxDrawConstants from "./drawConstants";
import { constants } from "./constants";
import { distanceMeters, circleRing, formatMeters } from "./geoMath";

// Anything smaller than this (meters) is treated as an accidental double click and ignored
const MIN_RADIUS_M = 1;

const KEY_ESCAPE = 27;
const KEY_ENTER = 13;

/**
 * Radius selection tool.
 *
 * How it works: click once to set the center, move the mouse to size the circle (a live label
 * shows the radius in meters), click again to confirm. The circle is produced as a regular
 * Mapbox GL Draw polygon and the usual 'draw.create' event is fired, so the existing selection
 * logic in drawControl.ts treats it exactly like a lasso or polygon selection.
 * Escape cancels, Enter confirms.
 */
export module RadiusDraw {
    export function create(filter: Filter) {
        const RadiusMode: any = {};

        RadiusMode.onSetup = function () {
            const polygon = this.newFeature({
                type: MapboxDrawConstants.geojsonTypes.FEATURE,
                properties: {},
                geometry: {
                    type: MapboxDrawConstants.geojsonTypes.POLYGON,
                    coordinates: [[]]
                }
            });

            this.addFeature(polygon);
            this.clearSelectedFeatures();
            this.updateUIClasses({ mouse: MapboxDrawConstants.cursors.ADD });
            this.activateUIButton(MapboxDrawConstants.types.POINT);
            this.setActionableState({ trash: true });
            this.map.doubleClickZoom.disable();

            // Pause hover highlights / selection clearing while drawing (same as lasso and polygon)
            if (filter) {
                filter.setSelectionInProgress(true);
            }
            toggleIcon(constants.CONTROL_BUTTON_RADIUS, true);

            return {
                polygon,
                center: null,
                radius: 0,
                confirmed: false,
                label: createLabel(this.map)
            };
        };

        RadiusMode.onClick = RadiusMode.onTap = function (state, e) {
            const position = [e.lngLat.lng, e.lngLat.lat];

            if (!state.center) {
                // First click: this is the center of the circle
                state.center = position;
                return;
            }

            // Second click: confirm the circle
            const radius = distanceMeters(state.center, position);
            if (radius < MIN_RADIUS_M) {
                return;
            }
            applyRadius(state, radius);
            state.confirmed = true;
            this.changeMode(MapboxDrawConstants.modes.SIMPLE_SELECT, { featureIds: [state.polygon.id] });
        };

        RadiusMode.onMouseMove = RadiusMode.onTouchMove = function (state, e) {
            this.updateUIClasses({ mouse: MapboxDrawConstants.cursors.ADD });
            const point = e.point || this.map.project(e.lngLat);

            if (!state.center) {
                setLabel(state, 'Click to set the center', point);
                return;
            }

            const radius = distanceMeters(state.center, [e.lngLat.lng, e.lngLat.lat]);
            applyRadius(state, radius);
            setLabel(state, 'Radius: ' + formatMeters(radius), point);
        };

        RadiusMode.onKeyUp = function (state, e) {
            if (e.keyCode === KEY_ESCAPE) {
                this.deleteFeature([state.polygon.id], { silent: true });
                this.changeMode(MapboxDrawConstants.modes.SIMPLE_SELECT);
            } else if (e.keyCode === KEY_ENTER && state.center && state.radius >= MIN_RADIUS_M) {
                state.confirmed = true;
                this.changeMode(MapboxDrawConstants.modes.SIMPLE_SELECT, { featureIds: [state.polygon.id] });
            }
        };

        RadiusMode.onTrash = function (state) {
            this.deleteFeature([state.polygon.id], { silent: true });
            this.changeMode(MapboxDrawConstants.modes.SIMPLE_SELECT);
        };

        RadiusMode.onStop = function (state) {
            removeLabel(state);
            toggleIcon(constants.CONTROL_BUTTON_RADIUS, false);
            if (filter) {
                filter.setSelectionInProgress(false);
            }

            this.updateUIClasses({ mouse: MapboxDrawConstants.cursors.NONE });
            this.activateUIButton();

            // Give double click zoom back once the current click sequence is over
            const map = this.map;
            window.setTimeout(() => {
                try {
                    map.doubleClickZoom.enable();
                } catch (error) {
                    // map may already be gone
                }
            }, 0);

            if (this.getFeature(state.polygon.id) === undefined) {
                // Cancelled with Escape or trash, nothing to select
                return;
            }

            if (state.confirmed && state.polygon.isValid()) {
                // Same event a finished polygon fires; drawControl.ts turns it into a selection
                this.map.fire(MapboxDrawConstants.events.CREATE, {
                    features: [state.polygon.toGeoJSON()]
                });
            } else {
                this.deleteFeature([state.polygon.id], { silent: true });
                this.changeMode(MapboxDrawConstants.modes.SIMPLE_SELECT, {}, { silent: true });
            }
        };

        RadiusMode.toDisplayFeatures = function (state, geojson, display) {
            const isActive = geojson.properties.id === state.polygon.id;
            geojson.properties.active = isActive
                ? MapboxDrawConstants.activeStates.ACTIVE
                : MapboxDrawConstants.activeStates.INACTIVE;

            if (!isActive) {
                return display(geojson);
            }

            // Nothing to show until the center has been placed
            if (!state.center) {
                return;
            }

            // Marker for the center of the circle
            display({
                type: MapboxDrawConstants.geojsonTypes.FEATURE,
                properties: {
                    meta: MapboxDrawConstants.meta.VERTEX,
                    parent: state.polygon.id,
                    coord_path: '0.0',
                    active: MapboxDrawConstants.activeStates.INACTIVE
                },
                geometry: {
                    type: MapboxDrawConstants.geojsonTypes.POINT,
                    coordinates: state.center
                }
            });

            if (state.radius > 0) {
                geojson.properties.meta = MapboxDrawConstants.meta.FEATURE;
                display(geojson);
            }
        };

        return RadiusMode;
    }

    export function makeIcon(surrogateControl: HTMLElement) {
        // Replace the (unused) point tool icon and title with the radius tool's
        try {
            let buttonClassName = MapboxDrawConstants.classes.CONTROL_BUTTON;
            buttonClassName += ` ${constants.CONTROL_BUTTON_RADIUS}`;
            surrogateControl.className = buttonClassName;
            surrogateControl.title = 'Radius selection tool';
        } catch (error) {
            // Failed to replace the icon and title of the point tool control
        }
    }

    function applyRadius(state, radius: number) {
        state.radius = radius;
        if (radius <= 0) {
            return;
        }
        const ring = circleRing(state.center, radius);
        if (typeof state.polygon.incomingCoords === 'function') {
            // Takes a regular closed GeoJSON ring
            state.polygon.incomingCoords([ring]);
        } else {
            // Draw stores polygon rings without the closing position
            state.polygon.setCoordinates([ring.slice(0, -1)]);
        }
    }

    function createLabel(map): HTMLElement {
        const label = document.createElement('div');
        label.style.cssText = 'position:absolute;z-index:10;pointer-events:none;display:none;' +
            'padding:2px 6px;border-radius:3px;background:rgba(32,32,32,0.85);color:#fff;' +
            'font:12px/16px Segoe UI,Arial,sans-serif;white-space:nowrap;';
        map.getContainer().appendChild(label);
        return label;
    }

    function setLabel(state, text: string, point) {
        const label: HTMLElement = state.label;
        if (!label) {
            return;
        }
        label.textContent = text;
        label.style.left = (point.x + 14) + 'px';
        label.style.top = (point.y + 14) + 'px';
        label.style.display = 'block';
    }

    function removeLabel(state) {
        if (state.label && state.label.parentNode) {
            state.label.parentNode.removeChild(state.label);
        }
        state.label = null;
    }

    function toggleIcon(className: string, toToggle: boolean) {
        try {
            const drawControlGroup = document.getElementsByClassName(className);
            const drawControl: any = drawControlGroup[0];
            const toggled = 'toggled';
            if (toToggle) {
                drawControl.classList.add(toggled);
            } else {
                drawControl.classList.remove(toggled);
            }
        } catch (error) {
            // Failed to toggle icon
        }
    }
}
