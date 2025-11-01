'use client';

import { useFormStatus } from 'react-dom';
import { submitScheduleDueDateAction } from './actions';
import {
  formFieldClass,
  inputClass,
  primaryButtonCompactClass
} from '../../../../lib/ui';

type UpdateDueDateFormProps = {
  scheduleId: string;
  defaultDueDate: string | null;
  returnPath: string;
};

function SubmitButton() {
  const { pending } = useFormStatus();
  return (
    <button type="submit" className={primaryButtonCompactClass} disabled={pending}>
      {pending ? 'Saving target date...' : 'Save target date'}
    </button>
  );
}

export function UpdateDueDateForm({
  scheduleId,
  defaultDueDate,
  returnPath
}: UpdateDueDateFormProps) {
  return (
    <form action={submitScheduleDueDateAction} className="grid gap-6">
      <input type="hidden" name="schedule_id" value={scheduleId} />
      <input type="hidden" name="return_path" value={returnPath} />

      <div className={formFieldClass}>
        <label htmlFor="next_due_date" className="text-sm font-medium text-slate-600 dark:text-slate-300">
          Target date *
        </label>
        <input
          id="next_due_date"
          name="next_due_date"
          type="date"
          defaultValue={defaultDueDate ?? undefined}
          className={inputClass}
          required
        />
        <p className="text-xs text-slate-500">
          Pick when you want this service to come due. Reminders will reset around this date.
        </p>
      </div>

      <div className="flex items-center justify-end">
        <SubmitButton />
      </div>
    </form>
  );
}
