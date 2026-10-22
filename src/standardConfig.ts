// Applies the "Standard Style" format pane options to the Mapbox Standard basemap.
//
// "Standard" is loaded as a style *import* (usually with the id "basemap") and is customised through
// config properties (map.setConfigProperty) instead of by editing layers.
//
// Every option has a "keep" choice, which means: leave whatever the style itself defines. The
// value the style defines is remembered when the style loads, so switching an option back to "keep"
// restores it. That way a custom style built on Standard keeps its own look unless an option is
// overridden explicitly.

// Config properties of the Standard basemap that the format pane controls.
// Properties a given style / mapbox-gl version does not know are skipped automatically.
export const STANDARD_CONFIG_KEYS: string[] = [
    'lightPreset',
    'theme',
    'showPlaceLabels',
    'showRoadLabels',
    'showPointOfInterestLabels',
    'showTransitLabels',
    'show3dObjects',
    'showAdminBoundaries',
    'showPedestrianRoads',
    'show3dLandmarks',
    'show3dBuildings'
];

const KEEP = 'keep';

export class StandardConfig {
    private base: { [key: string]: any } = {};
    private applied: { [key: string]: any } = {};
    private baseReady: boolean = false;

    /** Forget everything; call whenever a different style is about to be loaded. */
    public reset() {
        this.base = {};
        this.applied = {};
        this.baseReady = false;
    }
    
    /** The value the style itself defines for a config property (undefined if unknown). */
    public getBase(key: string): any {
        return this.base[key];
    }

    /** Id of the Standard import in the loaded style (normally "basemap"), or null for classic styles. */
    public static importId(map: any): string | null {
        try {
            const style = map.getStyle();
            const imports = style && Array.isArray(style.imports) ? style.imports : [];
            if (imports.length === 0) {
                return null;
            }
            const ids: string[] = imports.map((i: any) => i.id);
            return ids.indexOf('basemap') >= 0 ? 'basemap' : ids[0];
        } catch (e) {
            return null;
        }
    }

    /**
     * Apply the choices of the "Standard Style" card to the map.
     * Safe to call on every update: it only touches properties whose value actually changes.
     */
    
public apply(map: any, choices: any) {
    if (!map || !choices) {
        return;
    }
    const importId = StandardConfig.importId(map);
    if (!importId) {
        return;
    }

    if (!this.baseReady) {
        // Wait until the style and its import are fully loaded, otherwise we'd record wrong defaults
        if (!map.isStyleLoaded()) {
            return;
        }
        STANDARD_CONFIG_KEYS.forEach((key) => {
            try {
                this.base[key] = map.getConfigProperty(importId, key);
            } catch (e) {
                // property not supported by this style or mapbox-gl version
            }
        });
        this.baseReady = true;
    }

    STANDARD_CONFIG_KEYS.forEach((key) => {
        const base = this.base[key];
        if (base === undefined) {
            return;
        }

        const choice = choices[key];
        let value = base;
        if (choice && choice !== KEEP) {
            value = (typeof base === 'boolean') ? choice === 'show' : choice;
        }

        // Compare with what the map really has now, not with a cache
        let current: any;
        try {
            current = map.getConfigProperty(importId, key);
        } catch (e) {
            current = undefined;
        }
        if (current === value) {
            return;
        }

        try {
            map.setConfigProperty(importId, key, value);
            this.applied[key] = value;
        } catch (e) {
            console.warn('Could not set Standard config property ' + key, e);
        }
    });
}}
