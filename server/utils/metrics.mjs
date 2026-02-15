const counters = new Map();

const keyFor = (name, labels) => {
  const parts = Object.entries(labels || {})
    .sort(([a], [b]) => a.localeCompare(b))
    .map(([k, v]) => `${k}=${String(v)}`);
  return `${name}|${parts.join(',')}`;
};

export const incCounter = (name, labels = {}, value = 1) => {
  const key = keyFor(name, labels);
  const current = counters.get(key) || { name, labels, value: 0 };
  current.value += value;
  counters.set(key, current);
};

export const renderPrometheus = () => {
  const lines = [];
  const byName = new Map();

  for (const item of counters.values()) {
    if (!byName.has(item.name)) byName.set(item.name, []);
    byName.get(item.name).push(item);
  }

  for (const [name, items] of byName.entries()) {
    lines.push(`# TYPE ${name} counter`);
    for (const it of items) {
      const labelEntries = Object.entries(it.labels || {});
      const labelStr = labelEntries.length
        ? `{${labelEntries
            .map(([k, v]) => `${k}="${String(v).replace(/\\/g, '\\\\').replace(/"/g, '\\"')}"`)
            .join(',')}}`
        : '';
      lines.push(`${name}${labelStr} ${it.value}`);
    }
  }

  return `${lines.join('\n')}\n`;
};

export const metricsHandler = (req, res) => {
  const isProd = process.env.NODE_ENV === 'production';
  const token = process.env.METRICS_TOKEN;

  if (isProd && token) {
    const auth = req.headers.authorization || '';
    const expected = `Bearer ${token}`;
    if (auth !== expected) {
      return res.status(401).send('Unauthorized');
    }
  }

  res.setHeader('Content-Type', 'text/plain; version=0.0.4; charset=utf-8');
  res.status(200).send(renderPrometheus());
};
