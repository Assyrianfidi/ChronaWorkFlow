const nowIso = () => new Date().toISOString();
const envName = () => {
    const v = process.env.NODE_ENV;
    return v ? String(v) : undefined;
};
export const logEvent = (event) => {
    const enriched = {
        ...event,
        timestamp: nowIso(),
        environment: envName(),
    };
    const payload = JSON.stringify(enriched);
    if (enriched.level === 'error') {
        console.error(payload);
        return;
    }
    console.info(payload);
};
export const logError = (component, message, error, data) => {
    const errMessage = error instanceof Error ? error.message : 'Unknown error';
    logEvent({
        level: 'error',
        component,
        message,
        data: {
            ...(data ?? {}),
            error: errMessage,
        },
    });
};
const metrics = {};
const ensureMetrics = (key) => {
    metrics[key] ?? (metrics[key] = { requestCount: 0, errorCount: 0 });
    return metrics[key];
};
export const recordRequest = (key) => {
    const m = ensureMetrics(key);
    m.requestCount += 1;
    m.lastRequestAt = nowIso();
};
export const recordError = (key) => {
    const m = ensureMetrics(key);
    m.errorCount += 1;
    m.lastErrorAt = nowIso();
};
export const getMetricsSnapshot = () => {
    return { ...metrics };
};
//# sourceMappingURL=logging.js.map