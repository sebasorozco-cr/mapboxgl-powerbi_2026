const MPS_AT_Z17 = 64;       // walking speed in m/s at zoom 17 (scales with zoom)
const SPRINT = 3;            // Shift multiplier
const TURN_DEG_S = 30;       // arrow left/right, degrees per second
const TILT_DEG_S = 40;       // arrow up/down, degrees per second
const ZOOM_PER_S = 0.6;      // Q/E altitude change, zoom levels per second
const MIN_ZOOM = 14;
const MAX_ZOOM = 21.5;
const WALK_PITCH = 85;
const WALK_ZOOM = 18;        // zoom level when walk mode starts

const HANDLED = [
    'KeyW', 'KeyA', 'KeyS', 'KeyD', 'KeyQ', 'KeyE',
    'ArrowLeft', 'ArrowRight', 'ArrowUp', 'ArrowDown',
    'ShiftLeft', 'ShiftRight'
];

export class WalkControl implements mapboxgl.IControl {
    private map: any;
    private container: HTMLDivElement;
    private button: HTMLButtonElement;
    private hint: HTMLDivElement;
    private active = false;
    private added = false;
    private savedPitch = 0;
    private savedZoom = 0;
    private keys: { [code: string]: boolean } = {};
    private raf = 0;
    private last = 0;
    private target: HTMLElement;

    public isAdded() { return this.added; }
    public moveToEnd() {
        if (this.container && this.container.parentNode) {
            this.container.parentNode.appendChild(this.container);
        }
    }


    private onKeyDown = (e: KeyboardEvent) => {
        if (e.code === 'Escape') {
            this.setActive(false);
            return;
        }
        if (HANDLED.indexOf(e.code) >= 0) {
            this.keys[e.code] = true;
            e.preventDefault();
            e.stopPropagation();
        }
    };

    private onKeyUp = (e: KeyboardEvent) => {
        if (HANDLED.indexOf(e.code) >= 0) {
            this.keys[e.code] = false;
            e.preventDefault();
            e.stopPropagation();
        }
    };

    private onBlur = () => { this.keys = {}; };

    public onAdd(map: any): HTMLElement {
        this.added = true;
        this.map = map;
        this.container = document.createElement('div');
        this.container.className = 'mapboxgl-ctrl mapboxgl-ctrl-group';

        this.button = document.createElement('button');
        this.button.type = 'button';
        this.button.title = 'Walk mode (W A S D, Q/E, Shift, Esc)';
        this.button.setAttribute('aria-label', 'Walk mode');
        this.button.innerHTML =
            '<svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" ' +
            'stroke-width="2" stroke-linecap="round" stroke-linejoin="round">' +
            '<circle cx="13" cy="4.5" r="1.8"/>' +
            '<path d="M13 8 L12 14 L9 21 M12 14 L15 17 L15.5 21 M13 9.5 L9.5 12 M13 9.5 L16.5 12"/>' +
            '</svg>';
        this.button.style.cssText = 'display:flex;align-items:center;justify-content:center;color:#333;';
        this.button.addEventListener('click', () => this.setActive(!this.active));
        this.container.appendChild(this.button);

        this.hint = document.createElement('div');
        this.hint.style.cssText =
            'display:none;position:absolute;left:40px;top:0;white-space:nowrap;' +
            'background:rgba(0,0,0,0.75);color:#fff;font-weight:700;font-size:13px;' +
            'padding:6px 10px;border-radius:4px;pointer-events:none;';
        this.hint.textContent =
            'WASD move \u2022 Q/E tilt \u2022 Arrows look/zoom \u2022 Shift sprint \u2022 Esc exit';
        this.container.style.position = 'relative';
        this.container.appendChild(this.hint);

        this.target = map.getCanvasContainer();
        return this.container;
    }

    public onRemove() {
        this.added = false;
        try {
            this.setActive(false);
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
        this.keys = {};
        this.button.style.background = on ? '#2d7ff9' : '';
        this.button.style.color = on ? '#fff' : '#333';
        this.hint.style.display = on ? 'block' : 'none';

        if (on) {
            this.savedPitch = this.map.getPitch();
            this.savedZoom = this.map.getZoom();
            this.map.keyboard.disable();
            this.target.addEventListener('keydown', this.onKeyDown, true);
            this.target.addEventListener('keyup', this.onKeyUp, true);
            this.target.addEventListener('blur', this.onBlur, true);
            window.addEventListener('blur', this.onBlur);

            // keyboard focus is needed so the visual receives key presses
            const canvas: HTMLElement = this.map.getCanvas();
            canvas.setAttribute('tabindex', '0');
            canvas.focus();

            this.map.easeTo({
                pitch: Math.max(this.map.getPitch(), WALK_PITCH),
                zoom: WALK_ZOOM,
                duration: 900
            });
            this.last = 0;
            this.raf = requestAnimationFrame(this.tick);
        } else {
            cancelAnimationFrame(this.raf);
            this.target.removeEventListener('keydown', this.onKeyDown, true);
            this.target.removeEventListener('keyup', this.onKeyUp, true);
            this.target.removeEventListener('blur', this.onBlur, true);
            window.removeEventListener('blur', this.onBlur);
            this.map.keyboard.enable();
            this.map.easeTo({ pitch: this.savedPitch, zoom: this.savedZoom, duration: 700 });
        }
    }

    private tick = (now: number) => {
        if (!this.active || !this.map) {
            return;
        }
        const dt = this.last ? Math.min((now - this.last) / 1000, 0.1) : 0;
        this.last = now;
        const k = this.keys;
        const map = this.map;

        if (dt > 0 && !map.isEasing()) {
            let bearing = map.getBearing();
            let pitch = map.getPitch();
            let zoom = map.getZoom();
            const c = map.getCenter();

            if (k.ArrowLeft) { bearing += TURN_DEG_S * dt; }
            if (k.ArrowRight) { bearing -= TURN_DEG_S * dt; }
            if (k.KeyQ) { pitch = Math.max(0, pitch - TILT_DEG_S * dt); }
            if (k.KeyE) { pitch = Math.min(85, pitch + TILT_DEG_S * dt); }
            if (k.ArrowUp) { zoom = Math.min(MAX_ZOOM, zoom + ZOOM_PER_S * dt); }
            if (k.ArrowDown) { zoom = Math.max(MIN_ZOOM, zoom - ZOOM_PER_S * dt); }

            const fwd = (k.KeyW ? 1 : 0) - (k.KeyS ? 1 : 0);
            const side = (k.KeyD ? 1 : 0) - (k.KeyA ? 1 : 0);
            let lng = c.lng;
            let lat = c.lat;

            if (fwd || side) {
                const speed = MPS_AT_Z17 * Math.pow(2, 17 - zoom) *
                    ((k.ShiftLeft || k.ShiftRight) ? SPRINT : 1);
                const rad = bearing * Math.PI / 180;
                // meters east / north
                const east = (Math.sin(rad) * fwd + Math.cos(rad) * side) * speed * dt;
                const north = (Math.cos(rad) * fwd - Math.sin(rad) * side) * speed * dt;
                lat += north / 111320;
                lng += east / (111320 * Math.max(0.01, Math.cos(lat * Math.PI / 180)));
            }

            if (fwd || side || k.ArrowLeft || k.ArrowRight || k.ArrowUp ||
                k.ArrowDown || k.KeyQ || k.KeyE) {
                map.jumpTo({ center: [lng, lat], bearing, pitch, zoom });
            }
        }
        this.raf = requestAnimationFrame(this.tick);
    };
}