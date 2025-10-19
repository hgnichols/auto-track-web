'use client';

import { type ChangeEvent, useState } from 'react';
import type { ServiceSchedule } from '../lib/types';

type Props = {
  schedules: ServiceSchedule[];
};

type Mode = 'default' | 'custom';

export default function ServiceTypeField({ schedules }: Props) {
  const defaultSelection = schedules.length > 0 ? schedules[0].id : 'custom';
  const defaultMode: Mode = defaultSelection === 'custom' ? 'custom' : 'default';
  const [mode, setMode] = useState<Mode>(defaultMode);
  const [selection, setSelection] = useState(defaultSelection);

  const handleChange = (event: ChangeEvent<HTMLSelectElement>) => {
    const value = event.target.value;
    setSelection(value);
    setMode(value === 'custom' ? 'custom' : 'default');
  };

  return (
    <div className="form-field" style={{ display: 'grid', gap: '0.75rem' }}>
      <label htmlFor="schedule_id">Service</label>
      <select
        id="schedule_id"
        name="schedule_id"
        required
        value={selection}
        onChange={handleChange}
      >
        <option value="" disabled>
          Select service type
        </option>
        {schedules.map((schedule) => (
          <option key={schedule.id} value={schedule.id}>
            {schedule.service_name}
          </option>
        ))}
        <option value="custom">Custom service</option>
      </select>

      <div
        style={{
          display: mode === 'custom' ? 'grid' : 'none',
          gap: '0.35rem'
        }}
      >
        <input
          id="custom_service_name"
          name="custom_service_name"
          type="text"
          placeholder="Describe the service (e.g. Battery replacement)"
          required={mode === 'custom'}
          disabled={mode !== 'custom'}
        />
        <p style={{ margin: 0, color: 'var(--text-secondary)', fontSize: '0.9rem' }}>
          We&apos;ll log custom services without automatic reminders.
        </p>
      </div>
    </div>
  );
}
