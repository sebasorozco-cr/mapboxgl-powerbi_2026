import { usesImportedBasemap } from "./layerSlots";

const EMISSIVE: { [type: string]: string[] } = {
    circle: ['circle-emissive-strength'],
    fill: ['fill-emissive-strength'],
    line: ['line-emissive-strength'],
    'fill-extrusion': ['fill-extrusion-emissive-strength'],
    raster: ['raster-emissive-strength'],
    symbol: ['text-emissive-strength', 'icon-emissive-strength']
};

/** mode: 'true' = ignore the light preset (emissive 1), 'preset' = follow it (emissive 0). */
export function applyDataBrightness(map: any, layerIds: string[], mode: string) {
    if (!map || !usesImportedBasemap(map)) {
        return;
    }
    const value = mode === 'preset' ? 0 : 1;
    const style: any = map.getStyle();
    const specs: any[] = style && Array.isArray(style.layers) ? style.layers : [];
    layerIds.concat(['cluster-label']).forEach((id) => {
        const spec = specs.filter((l) => l.id === id)[0];
        if (!spec) {
            return;
        }
        (EMISSIVE[spec.type] || []).forEach((prop) => {
            try {
                if (map.getPaintProperty(id, prop) !== value) {
                    map.setPaintProperty(id, prop, value);
                }
            } catch (e) { /* property not supported: leave as is */ }
        });
    });
}

export class TerrainSwitch {
    private base: any = null;
    private ready = false;
    private applied = 'keep';

    public reset() {
        this.base = null;
        this.ready = false;
        this.applied = 'keep';
    }

    private ensureDem(map: any): string {
        if (!map.getSource('visual-dem')) {
            map.addSource('visual-dem', {
                type: 'raster-dem',
                url: 'mapbox://mapbox.mapbox-terrain-dem-v1',
                tileSize: 512,
                maxzoom: 16
            });
        }
        return 'visual-dem';
    }

    private turnOn(map: any) {
        const exaggeration = this.base && this.base.exaggeration !== undefined
            ? this.base.exaggeration : 1;
        let source: string;
        if (this.base && this.base.source && map.getSource(this.base.source)) {
            source = this.base.source;      // source is reachable from the root style
        } else {
            source = this.ensureDem(map);   // source lives in the import, use our own
        }
        map.setTerrain({ source, exaggeration });
    }

    /** choice: 'keep' (what the style defines) | 'show' | 'hide' */
    public apply(map: any, choice: string) {
        if (!map || !usesImportedBasemap(map)) {
            return;
        }
        try {
            if (!this.ready) {
                this.base = map.getTerrain() || null;
                this.ready = true;
            }
            const wanted = choice || 'keep';
            if (wanted === this.applied) {
                return;
            }
            if (wanted === 'hide') {
                map.setTerrain(null);
            } else if (wanted === 'show') {
                this.turnOn(map);
            } else {                         // 'keep': go back to the style's own state
                if (this.base) {
                    this.turnOn(map);
                } else {
                    map.setTerrain(null);
                }
            }
            this.applied = wanted;
        } catch (e) {
            console.warn('Could not change terrain', e);
        }
    }

    public isOn(map: any): boolean {
        try { return !!map.getTerrain(); } catch (e) { return false; }
    }
}
