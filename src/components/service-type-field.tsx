'use client';

import { type ChangeEvent, useState } from 'react';
import clsx from 'clsx';
import type { ServiceSchedule } from '../lib/types';
import { formFieldClass, inputClass, mutedTextClass } from '../lib/ui';

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
    <div className={clsx(formFieldClass, 'gap-3')}>
      <label htmlFor="schedule_id" className="text-sm font-medium text-slate-600">
        Service
      </label>
      <select
        id="schedule_id"
        name="schedule_id"
        required
        value={selection}
        onChange={handleChange}
        className={inputClass}
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

      <div className={clsx('grid gap-2', mode !== 'custom' && 'hidden')}>
        <input
          id="custom_service_name"
          name="custom_service_name"
          type="text"
          placeholder="Describe the service (e.g. Battery replacement)"
          required={mode === 'custom'}
          disabled={mode !== 'custom'}
          className={inputClass}
        />
        <p className={mutedTextClass}>
          We&apos;ll log custom services without automatic reminders.
        </p>
      </div>
    </div>
  );
}
