// TEMPORARY diagnostics: an on-screen panel that reports what the map is doing inside Power BI,
// where the browser console is not reachable. Turn it off with DEBUG_OVERLAY = false in visual.ts.

export class DebugOverlay {
    private el: HTMLDivElement;
    private lines: string[] = [];
    private requests: string[] = [];
    private counts: { [key: string]: number } = {};
    private header: string = '';
    private status: string = '';
    private startTime: number = Date.now();

    constructor(parent: HTMLElement) {
        this.el = document.createElement('div');
        this.el.style.cssText = 'position:absolute;left:4px;bottom:30px;z-index:9999;max-width:70%;max-height:85%;' +
            'overflow:hidden;background:rgba(0,0,0,0.82);color:#7CFC00;font:10px/12px Consolas,monospace;' +
            'padding:4px 6px;white-space:pre-wrap;word-break:break-all;pointer-events:none;';
        parent.appendChild(this.el);

        window.addEventListener('error', (e: ErrorEvent) => this.log('window.error: ' + e.message));
        window.addEventListener('unhandledrejection', (e: any) =>
            this.log('unhandledrejection: ' + ((e && e.reason && e.reason.message) || (e && e.reason))));

        const originalError = console.error;
        const originalWarn = console.warn;
        console.error = (...args: any[]) => {
            this.log('console.error: ' + args.map((a) => String(a)).join(' '));
            originalError.apply(console, args);
        };
        console.warn = (...args: any[]) => {
            this.log('console.warn: ' + args.map((a) => String(a)).join(' '));
            originalWarn.apply(console, args);
        };

        this.testBlobWorker();
    }

    public log(line: string) {
        const t = ((Date.now() - this.startTime) / 1000).toFixed(1);
        this.lines.push(t + 's ' + line.substring(0, 200));
        if (this.lines.length > 12) {
            this.lines.shift();
        }
        this.render();
    }

    public count(key: string) {
        this.counts[key] = (this.counts[key] || 0) + 1;
        this.render();
    }

    // Called for every request the map makes (from transformRequest)
    public request(resourceType: string, url: string) {
        this.counts['req:' + resourceType] = (this.counts['req:' + resourceType] || 0) + 1;
        if (resourceType !== 'Style') {
            const masked = url.replace(/access_token=[^&]+/, 'access_token=...');
            this.requests.push((url.indexOf('?') === -1 ? '[NO ?] ' : '') + resourceType + ' ' + masked.substring(0, 110));
            if (this.requests.length > 3) {
                this.requests.shift();
            }
        }
        this.render();
    }

    public attachMap(map: any, version: string) {
        this.header = 'mapbox-gl ' + version;
        this.log('map created');

        map.on('style.load', () => this.log('style.load'));
        map.on('data', (e: any) => {
            this.count('data:' + (e.dataType || '?') + (e.sourceDataType ? '/' + e.sourceDataType : ''));
        });
        map.on('error', (e: any) => this.log('map error: ' + ((e && e.error && e.error.message) || 'unknown') +
            (e && e.error && e.error.status ? ' status=' + e.error.status : '') + (e && e.sourceId ? ' src=' + e.sourceId : '')));
        ['movestart', 'moveend', 'resize', 'remove', 'webglcontextlost', 'webglcontextrestored'].forEach((name) => {
            map.on(name, () => this.count('evt:' + name));
        });
        map.on('render', () => this.count('evt:render'));
        map.on('idle', () => this.log('idle: renderedFeatures=' + this.safe(() => map.queryRenderedFeatures().length)));

        // Heartbeat: replaces the status block every 2 seconds
        window.setInterval(() => {
            this.status = 'z=' + this.safe(() => map.getZoom().toFixed(2)) +
                ' c=' + this.safe(() => { const c = map.getCenter(); return c.lng.toFixed(2) + ',' + c.lat.toFixed(2); }) +
                ' pitch=' + this.safe(() => map.getPitch().toFixed(0)) +
                ' proj=' + this.safe(() => map.getProjection().name) +
                ' moving=' + this.safe(() => map.isMoving()) +
                ' loaded=' + this.safe(() => map.loaded()) +
                ' tilesLoaded=' + this.safe(() => map.areTilesLoaded()) +
                '\ncontainer=' + this.safe(() => map.getContainer().clientWidth + 'x' + map.getContainer().clientHeight) +
                ' canvas=' + this.safe(() => map.getCanvas().width + 'x' + map.getCanvas().height) +
                ' dpr=' + window.devicePixelRatio +
                '\ntiles: ' + this.tileStates(map);
            this.render();
        }, 2000);
    }

    // Uses internal (private) fields of mapbox-gl purely for diagnostics; falls back to n/a
    private tileStates(map: any): string {
        try {
            const style = map.style;
            const caches = style._mergedSourceCaches || style._sourceCaches || {};
            const out: string[] = [];
            Object.keys(caches).slice(0, 8).forEach((id) => {
                const tiles = (caches[id] && caches[id]._tiles) || {};
                const states: { [key: string]: number } = {};
                Object.keys(tiles).forEach((k) => {
                    const s = tiles[k].state;
                    states[s] = (states[s] || 0) + 1;
                });
                out.push(id.substring(id.length - 14) + JSON.stringify(states).replace(/"/g, ''));
            });
            return out.length ? out.join(' ') : 'none';
        } catch (err) {
            return 'n/a';
        }
    }

    private safe(fn: () => any): string {
        try {
            return String(fn());
        } catch (err) {
            return '?';
        }
    }

    private testBlobWorker() {
        try {
            const blob = new Blob(['self.onmessage=function(e){self.postMessage("pong")}'], { type: 'text/javascript' });
            const worker = new Worker(URL.createObjectURL(blob));
            const timer = window.setTimeout(() => this.log('blob worker: NO RESPONSE after 3s'), 3000);
            worker.onmessage = () => {
                window.clearTimeout(timer);
                this.log('blob worker: OK');
                worker.terminate();
            };
            worker.onerror = (e: any) => {
                window.clearTimeout(timer);
                this.log('blob worker: ERROR ' + (e && e.message));
            };
            worker.postMessage('ping');
        } catch (err) {
            this.log('blob worker: THREW ' + err);
        }
    }

    private render() {
        const counts = Object.keys(this.counts).sort().map((k) => k + '=' + this.counts[k]).join('  ');
        this.el.textContent = [this.header, counts, this.status, '-- last requests --']
            .concat(this.requests, ['-- log --'], this.lines).join('\n');
    }
}
