'use client';

import { useFormStatus } from 'react-dom';
import { submitMileageUpdateAction } from './actions';
import { formFieldClass, inputClass, primaryButtonCompactClass } from '../../../lib/ui';

type UpdateMileageFormProps = {
  defaultMileage: number | null;
  vehicleId: string;
};

function SubmitButton() {
  const { pending } = useFormStatus();
  return (
    <button type="submit" className={primaryButtonCompactClass} disabled={pending}>
      {pending ? 'Saving mileage...' : 'Save mileage'}
    </button>
  );
}

export function UpdateMileageForm({ defaultMileage, vehicleId }: UpdateMileageFormProps) {
  return (
    <form action={submitMileageUpdateAction} className="grid gap-6">
      <input type="hidden" name="vehicle_id" value={vehicleId} />
      <div className={formFieldClass}>
        <label htmlFor="current_mileage" className="text-sm font-medium text-slate-600">
          Current mileage *
        </label>
        <input
          id="current_mileage"
          name="current_mileage"
          type="number"
          min="0"
          step="1"
          defaultValue={defaultMileage ?? undefined}
          placeholder="e.g. 54200"
          className={inputClass}
          inputMode="numeric"
        />
        <p className="text-xs text-slate-500">
          Use your latest odometer reading. You can update this any time.
        </p>
      </div>

      <div className="flex items-center justify-end">
        <SubmitButton />
      </div>
    </form>
  );
}
