(function () {
  'use strict';

  const DEFAULTS = {
    snapshotUrl: '/api/v1/portal',
    eventsUrl: '/api/v1/portal/events',
    pollingInterval: 12000,
    staleAfter: 30000,
  };

  class PortalBridge extends EventTarget {
    constructor(options = {}) {
      super();
      this.options = { ...DEFAULTS, ...options };
      this.state = null;
      this.status = 'idle';
      this.source = null;
      this.pollTimer = null;
      this.staleTimer = null;
      this.lastVersion = 0;
      this.lastUpdate = 0;
      this.abortController = null;
      this.onVisibilityChange = () => document.hidden ? this.pause() : this.resume();
    }

    emit(type, detail) {
      this.dispatchEvent(new CustomEvent(type, { detail }));
    }

    setStatus(status, detail = {}) {
      if (this.status === status && !detail.force) return;
      this.status = status;
      this.emit('status', { status, lastUpdate: this.lastUpdate, ...detail });
    }

    async fetchSnapshot() {
      if (this.abortController) this.abortController.abort();
      this.abortController = new AbortController();
      const response = await fetch(this.options.snapshotUrl, {
        headers: { Accept: 'application/json', 'X-Portal-Client': 'web-v1' },
        cache: 'no-store',
        signal: this.abortController.signal,
      });
      if (!response.ok) throw new Error(`Portal snapshot failed: ${response.status}`);
      this.applyEnvelope(await response.json(), 'snapshot');
    }

    applyEnvelope(payload, transport) {
      const envelope = payload && payload.data ? payload : { version: 0, sentAt: new Date().toISOString(), data: payload };
      if (envelope.version && envelope.version < this.lastVersion) return;
      this.lastVersion = envelope.version || this.lastVersion;
      this.lastUpdate = Date.now();
      this.state = envelope.data;
      this.setStatus('live', { transport, version: this.lastVersion, force: true });
      this.emit('state', { state: this.state, transport, version: this.lastVersion });
      this.armStaleTimer();
    }

    connectEvents() {
      if (!window.EventSource || document.hidden) return this.startPolling();
      if (this.source) this.source.close();
      this.setStatus('connecting');
      this.source = new EventSource(this.options.eventsUrl);
      this.source.addEventListener('portal', event => {
        try { this.applyEnvelope(JSON.parse(event.data), 'sse'); }
        catch (error) { this.emit('error', { error, phase: 'parse' }); }
      });
      this.source.onopen = () => this.stopPolling();
      this.source.onerror = () => {
        this.setStatus('degraded', { transport: 'polling' });
        this.startPolling();
      };
    }

    startPolling() {
      if (this.pollTimer || document.hidden) return;
      const poll = async () => {
        try { await this.fetchSnapshot(); }
        catch (error) {
          if (error.name !== 'AbortError') {
            this.setStatus('offline', { error: error.message });
            this.emit('error', { error, phase: 'snapshot' });
          }
        }
      };
      poll();
      this.pollTimer = setInterval(poll, this.options.pollingInterval);
    }

    stopPolling() {
      clearInterval(this.pollTimer);
      this.pollTimer = null;
    }

    armStaleTimer() {
      clearTimeout(this.staleTimer);
      this.staleTimer = setTimeout(() => {
        this.setStatus('stale', { age: Date.now() - this.lastUpdate });
        this.startPolling();
      }, this.options.staleAfter);
    }

    async command(module, action, payload = {}) {
      const response = await fetch(`/api/v1/commands/${encodeURIComponent(module)}/${encodeURIComponent(action)}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Accept: 'application/json', 'X-Portal-Client': 'web-v1' },
        body: JSON.stringify(payload),
      });
      const result = await response.json().catch(() => ({}));
      if (!response.ok) throw new Error(result.error || `Command failed: ${response.status}`);
      return result;
    }

    start() {
      document.addEventListener('visibilitychange', this.onVisibilityChange);
      this.fetchSnapshot().catch(() => this.startPolling());
      this.connectEvents();
      return this;
    }

    pause() {
      if (this.source) { this.source.close(); this.source = null; }
      this.stopPolling();
      clearTimeout(this.staleTimer);
      if (this.abortController) this.abortController.abort();
      this.setStatus('paused');
    }

    resume() {
      this.fetchSnapshot().catch(() => this.startPolling());
      this.connectEvents();
    }

    destroy() {
      this.pause();
      document.removeEventListener('visibilitychange', this.onVisibilityChange);
    }
  }

  window.AlparPortalBridge = PortalBridge;
}());
