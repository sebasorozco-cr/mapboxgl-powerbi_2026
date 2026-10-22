import { StandardConfig } from "./standardConfig";

const PRESETS = ['dawn', 'day', 'dusk', 'night'];
const PANEL_AUTOHIDE_MS = 2000;   // close the panel this long after the last click

export class StandardPanelControl implements mapboxgl.IControl {
    private map: any;
    private container: HTMLElement;
    private panel: HTMLElement;
    private added = false;
    private preset: HTMLSelectElement;
    private dataMode: HTMLSelectElement;
    private boxes: { [key: string]: HTMLInputElement } = {};
    private hideTimer: any = null;
    private hovering = false;
    private selectBusy = false;

    constructor(private onChange: (key: string, value: string) => void,
                private onReset: () => void,
                private getDataMode: () => string,
                private isTerrainOn: () => boolean) {}

    public isAdded() { return this.added; }
    public moveToEnd() {
        if (this.container && this.container.parentNode) {
            this.container.parentNode.appendChild(this.container);
        }
    }
    
    public getDefaultPosition(): any { return 'top-left'; }

    public onAdd(map) {
        this.map = map;
        this.added = true;
        this.container = document.createElement('div');
        this.container.className = 'mapboxgl-ctrl mapboxgl-ctrl-group';

        const button = document.createElement('button');
        button.type = 'button';
        button.title = 'Map style';
        button.textContent = '◐';
        button.style.fontSize = '18px';
        button.addEventListener('click', () => {
            const opening = this.panel.style.display !== 'block';
            this.panel.style.display = opening ? 'block' : 'none';
            this.refresh();
            if (opening) { this.scheduleHide(); } else { this.clearHide(); }
        });
        this.container.appendChild(button);

        this.panel = document.createElement('div');
        this.panel.style.cssText = 'display:none;padding:8px;min-width:170px;max-width:210px;background:#fff;font-size:14px;';
        this.container.appendChild(this.panel);

        // Auto-hide: restart on any interaction, pause while the pointer is over the panel
        this.panel.addEventListener('click', () => this.scheduleHide());
        this.panel.addEventListener('input', () => this.scheduleHide());
        this.panel.addEventListener('change', () => { this.selectBusy = false; this.scheduleHide(); });
        this.panel.addEventListener('mouseenter', () => { this.hovering = true; this.clearHide(); });
        this.panel.addEventListener('mouseleave', () => { this.hovering = false; this.scheduleHide(); });
        this.panel.addEventListener('mousedown', (e) => {
            if ((e.target as HTMLElement).tagName === 'SELECT') {
                this.selectBusy = true;
                this.clearHide();
            }
        });
        this.panel.addEventListener('focusout', (e) => {
            if ((e.target as HTMLElement).tagName === 'SELECT') {
                this.selectBusy = false;
                this.scheduleHide();
            }
        });

        this.preset = this.addSelect('Light preset',
            PRESETS.map((p) => [p, p.charAt(0).toUpperCase() + p.slice(1)]),
            (v) => this.onChange('lightPreset', v));
        this.addBox('show3dLandmarks', '3D landmarks');
        this.addBox('show3dBuildings', '3D buildings');
        this.addBox('terrain', '3D terrain');
        this.dataMode = this.addSelect('Data colors',
            [['true', 'True colors'], ['preset', 'Light preset']],
            (v) => this.onChange('dataColors', v));

        const reset = document.createElement('button');
        reset.type = 'button';
        reset.textContent = 'Reset';
        reset.style.cssText = 'margin-top:6px;width:auto;height:auto;padding:3px 10px;border:1px solid #ccc;border-radius:3px;background:#f5f5f5;';
        reset.addEventListener('click', () => this.onReset());
        this.panel.appendChild(reset);

        this.refresh();
        return this.container;
    }

    public onRemove() {
        this.clearHide();
        this.added = false;
        if (this.container && this.container.parentNode) {
            this.container.parentNode.removeChild(this.container);
        }
        this.map = undefined;
    }

    private clearHide() {
        if (this.hideTimer) {
            clearTimeout(this.hideTimer);
            this.hideTimer = null;
        }
    }

    private scheduleHide() {
        this.clearHide();
        if (!this.panel || this.panel.style.display !== 'block' || this.hovering || this.selectBusy) {
            return;
        }
        this.hideTimer = setTimeout(() => {
            this.hideTimer = null;
            if (this.panel) { this.panel.style.display = 'none'; }
        }, PANEL_AUTOHIDE_MS);
    }

    private addSelect(label: string, options: string[][], fn: (v: string) => void): HTMLSelectElement {
        const row = document.createElement('label');
        row.style.cssText = 'display:block;margin:4px 0;';
        row.appendChild(document.createTextNode(label));
        const select = document.createElement('select');
        select.style.cssText = 'display:block;width:100%;';
        options.forEach(([value, text]) => {
            const o = document.createElement('option');
            o.value = value;
            o.textContent = text;
            select.appendChild(o);
        });
        select.addEventListener('change', () => fn(select.value));
        row.appendChild(select);
        this.panel.appendChild(row);
        return select;
    }

    private addBox(key: string, label: string) {
        const row = document.createElement('label');
        row.style.cssText = 'display:block;margin:4px 0;';
        const box = document.createElement('input');
        box.type = 'checkbox';
        box.addEventListener('change', () => this.onChange(key, box.checked ? 'show' : 'hide'));
        this.boxes[key] = box;
        row.appendChild(box);
        row.appendChild(document.createTextNode(' ' + label));
        this.panel.appendChild(row);
    }

    /** Sync the controls with what the map really has right now. */
    public refresh() {
        if (!this.added || !this.map) {
            return;
        }
        const id = StandardConfig.importId(this.map);
        if (!id) {
            return;
        }
        try { this.preset.value = String(this.map.getConfigProperty(id, 'lightPreset')); } catch (e) { }
        ['show3dLandmarks', 'show3dBuildings'].forEach((key) => {
            try { this.boxes[key].checked = !!this.map.getConfigProperty(id, key); } catch (e) { }
        });
        this.boxes['terrain'].checked = this.isTerrainOn();
        this.dataMode.value = this.getDataMode();
    }
}