import { StandardConfig } from "./standardConfig";
import { usesImportedBasemap } from "./layerSlots";

const CONFIG_KEY = 'show3dBuildings';
const SRC_ID = 'visual-xray-src';
const LAYER_ID = 'visual-xray-buildings';
const OPACITY = 0.6;          // how transparent the buildings become (0.6 = 60%)
const FADE_START = 16;        // buildings start fading in at this zoom...
const FADE_END = 17;          // ...and reach OPACITY here
const BUILDING_COLOR = '#e4e6ea';

export class XRayControl implements mapboxgl.IControl {
    private map: any;
    private container: HTMLDivElement;
    private button: HTMLButtonElement;
    private active = false;
    private added = false;
    private hidden = false;   // true while we have switched off the basemap's own buildings

    /** wantsBuildings: should 3D buildings be visible at all, according to the Standard Style settings */
    constructor(private wantsBuildings: () => boolean) { }

    public isAdded() { return this.added; }

    public moveToEnd() {
        if (this.container && this.container.parentNode) {
            this.container.parentNode.appendChild(this.container);
        }
    }

    public onAdd(map: any): HTMLElement {
        this.added = true;
        this.map = map;
        this.container = document.createElement('div');
        this.container.className = 'mapboxgl-ctrl mapboxgl-ctrl-group';

        this.button = document.createElement('button');
        this.button.type = 'button';
        this.button.title = 'X-ray: see through 3D buildings';
        this.button.setAttribute('aria-label', 'X-ray buildings');
        this.button.innerHTML =
            '<svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" ' +
            'stroke-width="2" stroke-linecap="round" stroke-linejoin="round">' +
            '<path d="M12 3 L20 7.5 V16.5 L12 21 L4 16.5 V7.5 Z"/>' +
            '<path d="M4 7.5 L12 12 L20 7.5 M12 12 V21" stroke-dasharray="2 2.5"/>' +
            '</svg>';
        this.button.style.cssText = 'display:flex;align-items:center;justify-content:center;color:#333;';
        this.button.addEventListener('click', () => this.setActive(!this.active));
        this.container.appendChild(this.button);
        return this.container;
    }

    public onRemove() {
        this.added = false;
        try {
            this.active = false;
            this.sync();
        } catch (e) { /* map already gone */ }
        if (this.container && this.container.parentNode) {
            this.container.parentNode.removeChild(this.container);
        }
        this.map = undefined;
    }

    public getDefaultPosition(): mapboxgl.ControlPosition {
        return 'top-left';
    }

    private setActive(on: boolean) {
        if (!this.map || on === this.active) {
            return;
        }
        this.active = on;
        this.button.style.background = on ? '#2d7ff9' : '';
        this.button.style.color = on ? '#fff' : '#333';
        this.sync();
    }

    /** Brings the map in line with the button state and the Standard Style settings. Safe to call often. */
    public sync() {
        const map = this.map;
        if (!map || !usesImportedBasemap(map)) {
            return;
        }
        try {
            const importId = StandardConfig.importId(map);
            if (!importId) {
                return;
            }
            const wants = this.wantsBuildings();
            if (this.active) {
                if (map.getConfigProperty(importId, CONFIG_KEY) !== false) {
                    map.setConfigProperty(importId, CONFIG_KEY, false);
                }
                this.hidden = true;
                if (wants) {
                    this.showGhost(map);
                } else {
                    this.removeGhost(map);
                }
            } else {
                this.removeGhost(map);
                if (this.hidden) {
                    map.setConfigProperty(importId, CONFIG_KEY, wants);
                    this.hidden = false;
                }
            }
        } catch (e) {
            console.warn('X-ray buildings could not be applied', e);
        }
    }

    private showGhost(map: any) {
        if (!map.getSource(SRC_ID)) {
            map.addSource(SRC_ID, {
                type: 'vector',
                url: 'mapbox://mapbox.mapbox-streets-v8'
            });
        }
        if (!map.getLayer(LAYER_ID)) {
            map.addLayer({
                id: LAYER_ID,
                type: 'fill-extrusion',
                source: SRC_ID,
                'source-layer': 'building',
                slot: 'middle',
                minzoom: 15,
                filter: ['==', ['get', 'extrude'], 'true'],
                paint: {
                    'fill-extrusion-color': BUILDING_COLOR,
                    'fill-extrusion-height': ['get', 'height'],
                    'fill-extrusion-base': ['get', 'min_height'],
                    'fill-extrusion-opacity': [
                        'interpolate', ['linear'], ['zoom'],
                        FADE_START, 0, FADE_END, OPACITY
                    ],
                    'fill-extrusion-emissive-strength': 0
                }
            });
        }
    }

    private removeGhost(map: any) {
        if (map.getLayer(LAYER_ID)) {
            map.removeLayer(LAYER_ID);
        }
        if (map.getSource(SRC_ID)) {
            map.removeSource(SRC_ID);
        }
    }
}