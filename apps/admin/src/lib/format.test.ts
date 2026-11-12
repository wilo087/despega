import assert from 'node:assert/strict';
import { it } from 'node:test';
import { formatDate, formatDateTime } from './format.ts';

it('muestra el día y la hora de Santo Domingo aunque el servidor use UTC', () => {
  const original = process.env.TZ;
  process.env.TZ = 'UTC';
  try {
    const timestamp = '2026-10-30T02:30:00.000Z';
    assert.match(formatDate(timestamp), /29 oct.*2026/);
    assert.match(formatDateTime(timestamp), /10:30/);
    assert.equal(formatDate(undefined), '—');
    assert.equal(formatDateTime('sin fecha'), 'sin fecha');
  } finally {
    if (original === undefined) delete process.env.TZ;
    else process.env.TZ = original;
  }
});
