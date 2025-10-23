'use client';

import { useEffect, useMemo, useState } from 'react';
import { useFormStatus } from 'react-dom';
import { submitVehicleAction } from './actions';
import { TypeaheadSelect, type Option } from '../../components/typeahead-select';
import { formFieldClass, inputClass, primaryButtonClass } from '../../lib/ui';

type VehicleFormProps = {
  years: number[];
};

function SubmitButton({ disabled }: { disabled: boolean }) {
  const { pending } = useFormStatus();
  return (
    <button type="submit" className={primaryButtonClass} disabled={disabled || pending}>
      {pending ? 'Saving...' : 'Save vehicle'}
    </button>
  );
}

export function VehicleForm({ years }: VehicleFormProps) {
  const sortedYears = useMemo(
    () => [...years].sort((a, b) => b - a),
    [years]
  );
  const yearOptions = useMemo<Option[]>(
    () => sortedYears.map((year) => ({ value: String(year), label: String(year) })),
    [sortedYears]
  );
  const [selectedYear, setSelectedYear] = useState('');
  const [makeOptions, setMakeOptions] = useState<Option[]>([]);
  const [modelOptions, setModelOptions] = useState<Option[]>([]);
  const [selectedMake, setSelectedMake] = useState('');
  const [selectedModel, setSelectedModel] = useState('');
  const [isLoadingMakes, setIsLoadingMakes] = useState(false);
  const [isLoadingModels, setIsLoadingModels] = useState(false);
  const [fetchError, setFetchError] = useState<string | null>(null);

  useEffect(() => {
    if (selectedYear && !sortedYears.map((year) => String(year)).includes(selectedYear)) {
      setSelectedYear('');
    }
  }, [sortedYears, selectedYear]);

  useEffect(() => {
    if (!selectedYear) {
      setMakeOptions([]);
      setSelectedMake('');
      return;
    }

    let cancelled = false;
    setIsLoadingMakes(true);
    setFetchError(null);
    setMakeOptions([]);
    setSelectedMake('');
    setModelOptions([]);
    setSelectedModel('');

    fetch(`/api/vehicle-catalog/makes?year=${selectedYear}`)
      .then((response) => {
        if (!response.ok) {
          throw new Error(`Request failed with status ${response.status}`);
        }
        return response.json() as Promise<{ makes: Option[] }>;
      })
      .then((payload) => {
        if (cancelled) {
          return;
        }
        const options = payload.makes ?? [];
        setMakeOptions(options);
        setSelectedMake((current) =>
          options.some((option) => option.value === current) ? current : ''
        );
        if (options.length === 0) {
          setFetchError('No makes found for that year. Try a different year.');
        }
      })
      .catch((error) => {
        if (!cancelled) {
          console.error('Failed to load vehicle makes', error);
          setFetchError('Unable to load makes for that year. Please try again.');
          setMakeOptions([]);
          setSelectedMake('');
        }
      })
      .finally(() => {
        if (!cancelled) {
          setIsLoadingMakes(false);
        }
      });

    return () => {
      cancelled = true;
    };
  }, [selectedYear]);

  useEffect(() => {
    if (!selectedYear || !selectedMake) {
      setModelOptions([]);
      setSelectedModel('');
      return;
    }

    let cancelled = false;
    setIsLoadingModels(true);
    setFetchError(null);
    setModelOptions([]);
    setSelectedModel('');

    fetch(`/api/vehicle-catalog/models?year=${selectedYear}&make=${encodeURIComponent(selectedMake)}`)
      .then((response) => {
        if (!response.ok) {
          throw new Error(`Request failed with status ${response.status}`);
        }
        return response.json() as Promise<{ models: Option[] }>;
      })
      .then((payload) => {
        if (cancelled) {
          return;
        }
        const options = payload.models ?? [];
        setModelOptions(options);
        setSelectedModel((current) =>
          options.some((option) => option.value === current) ? current : ''
        );
        if (options.length === 0) {
          setFetchError('No models found for that make and year. Try another combination.');
        }
      })
      .catch((error) => {
        if (!cancelled) {
          console.error('Failed to load vehicle models', error);
          setFetchError('Unable to load models for that make. Please try again.');
          setModelOptions([]);
          setSelectedModel('');
        }
      })
      .finally(() => {
        if (!cancelled) {
          setIsLoadingModels(false);
        }
      });

    return () => {
      cancelled = true;
    };
  }, [selectedYear, selectedMake]);

  const disableSubmit =
    !selectedYear || !selectedMake || !selectedModel || isLoadingMakes || isLoadingModels;

  return (
    <form action={submitVehicleAction} className="grid gap-6">
      <div className="grid gap-4 sm:grid-cols-2">
        <div className={formFieldClass}>
          <label htmlFor="year" className="text-sm font-medium text-slate-600">
            Year *
          </label>
          <TypeaheadSelect
            id="year"
            name="year"
            value={selectedYear}
            options={yearOptions}
            onChange={(nextValue) => setSelectedYear(nextValue)}
            disabled={yearOptions.length === 0}
            placeholder="Search year"
          />
        </div>
        <div className={formFieldClass}>
          <label htmlFor="make" className="text-sm font-medium text-slate-600">
            Make *
          </label>
          <TypeaheadSelect
            id="make"
            name="make"
            value={selectedMake}
            options={makeOptions}
            onChange={(nextValue) => setSelectedMake(nextValue)}
            disabled={!selectedYear || isLoadingMakes || makeOptions.length === 0}
            isLoading={isLoadingMakes}
            placeholder={
              selectedYear
                ? isLoadingMakes
                  ? 'Loading makes…'
                  : 'Search make'
                : 'Choose a year first'
            }
            emptyText="No makes matched your search"
          />
        </div>
        <div className={formFieldClass}>
          <label htmlFor="model" className="text-sm font-medium text-slate-600">
            Model *
          </label>
          <TypeaheadSelect
            id="model"
            name="model"
            value={selectedModel}
            options={modelOptions}
            onChange={(nextValue) => setSelectedModel(nextValue)}
            disabled={!selectedMake || isLoadingModels || modelOptions.length === 0}
            isLoading={isLoadingModels}
            placeholder={
              selectedMake
                ? isLoadingModels
                  ? 'Loading models…'
                  : 'Search model'
                : 'Choose a make first'
            }
            emptyText="No models matched your search"
          />
        </div>
        <div className={formFieldClass}>
          <label htmlFor="vin" className="text-sm font-medium text-slate-600">
            VIN
          </label>
          <input id="vin" name="vin" type="text" placeholder="Optional" className={inputClass} />
        </div>
        <div className={formFieldClass}>
          <label htmlFor="current_mileage" className="text-sm font-medium text-slate-600">
            Current mileage
          </label>
          <input
            id="current_mileage"
            name="current_mileage"
            type="number"
            min="0"
            step="1"
            placeholder="e.g. 54000"
            className={inputClass}
          />
        </div>
        <div className={formFieldClass}>
          <label htmlFor="contact_email" className="text-sm font-medium text-slate-600">
            Reminder email
          </label>
          <input
            id="contact_email"
            name="contact_email"
            type="email"
            placeholder="Optional - name@email.com"
            className={inputClass}
          />
        </div>
      </div>

      {fetchError && (
        <p className="text-sm text-red-600" role="alert">
          {fetchError}
        </p>
      )}

      <div className="flex justify-end">
        <SubmitButton disabled={disableSubmit} />
      </div>
    </form>
  );
}
