'use client';

import { useMemo, useState } from 'react';
import clsx from 'clsx';
import type { ServiceSchedule } from '../lib/types';
import { TypeaheadSelect, type Option } from './typeahead-select';
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
  const options = useMemo<Option[]>(() => {
    const scheduleOptions = schedules.map((schedule) => ({
      value: schedule.id,
      label: schedule.service_name
    }));
    return [
      ...scheduleOptions,
      {
        value: 'custom',
        label: 'Custom service'
      }
    ];
  }, [schedules]);

  const handleChange = (value: string) => {
    setSelection(value);
    setMode(value === 'custom' ? 'custom' : 'default');
  };

  return (
    <div className={clsx(formFieldClass, 'gap-3')}>
      <label htmlFor="schedule_id" className="text-sm font-medium text-slate-600">
        Service
      </label>
      <TypeaheadSelect
        id="schedule_id"
        name="schedule_id"
        value={selection}
        options={options}
        onChange={handleChange}
        placeholder="Search service type"
        emptyText="No services matched your search"
        required
      />

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
