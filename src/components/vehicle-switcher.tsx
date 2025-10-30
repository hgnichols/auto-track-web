'use client';

import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import { useMemo, useTransition } from 'react';
import { selectVehicleAction } from '../app/vehicle/actions';
import type { Vehicle } from '../lib/types';
import { ghostButtonCompactClass, mutedTextClass } from '../lib/ui';

type VehicleSwitcherProps = {
  vehicles: Vehicle[];
  activeVehicleId: string | null;
  returnPath?: string;
};

const glassContainerClass =
  'flex flex-wrap items-center gap-4 rounded-3xl border border-slate-200/70 bg-white/70 px-4 py-3 shadow-[0_28px_60px_-42px_rgba(15,23,42,0.55)] backdrop-blur-xl transition-colors duration-200 dark:border-slate-700/60 dark:bg-slate-900/55 dark:shadow-[0_30px_65px_-44px_rgba(2,6,23,0.8)]';

const selectWrapperClass = 'relative inline-flex items-center';

const selectClass =
  'h-11 min-w-[240px] appearance-none rounded-2xl border border-slate-200/70 bg-white/85 px-4 pr-10 text-sm font-semibold text-slate-900 shadow-[0_20px_44px_-34px_rgba(15,23,42,0.6)] transition-colors duration-200 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-blue-300 disabled:cursor-not-allowed disabled:opacity-60 dark:border-slate-700/60 dark:bg-slate-900/70 dark:text-slate-100 dark:shadow-[0_22px_48px_-36px_rgba(2,6,23,0.8)] dark:focus-visible:outline-blue-400';

const chevronClass =
  'pointer-events-none absolute right-3 text-slate-500 transition-colors duration-200 dark:text-slate-300';

const addButtonClass = `${ghostButtonCompactClass} h-11 rounded-2xl px-4`;

function vehicleLabel(vehicle: Vehicle) {
  const parts: string[] = [];
  if (vehicle.year) {
    parts.push(String(vehicle.year));
  }
  parts.push(vehicle.make);
  parts.push(vehicle.model);
  return parts.join(' ').trim();
}

export default function VehicleSwitcher({ vehicles, activeVehicleId, returnPath }: VehicleSwitcherProps) {
  const router = useRouter();
  const pathname = usePathname();
  const [isPending, startTransition] = useTransition();

  const safePath = returnPath ?? pathname ?? '/';

  const addVehicleHref = useMemo(() => {
    const encoded = encodeURIComponent(safePath);
    return `/onboarding?mode=add&redirect=${encoded}`;
  }, [safePath]);

  if (vehicles.length <= 1) {
    const vehicle = vehicles[0];

    if (!vehicle) {
      return null;
    }

    return (
      <div className={glassContainerClass}>
        <div className="flex flex-wrap items-center gap-3">
          <span className="text-[11px] font-semibold uppercase tracking-[0.18em] text-slate-500 dark:text-slate-400">
            Vehicle
          </span>
          <span className="text-sm font-semibold text-slate-900 dark:text-slate-100">
            {vehicleLabel(vehicle)}
          </span>
        </div>
        <Link href={addVehicleHref} className={addButtonClass}>
          Add vehicle
        </Link>
      </div>
    );
  }

  const selectedVehicleId = activeVehicleId ?? vehicles[0]?.id ?? '';

  return (
    <div className={glassContainerClass}>
      <div className="flex flex-wrap items-center gap-3">
        <label
          className="text-[11px] font-semibold uppercase tracking-[0.18em] text-slate-500 dark:text-slate-400"
          htmlFor="vehicle-switcher"
        >
          Vehicle
        </label>
        <div className={selectWrapperClass}>
          <select
            id="vehicle-switcher"
            className={selectClass}
            value={selectedVehicleId}
            disabled={isPending}
            onChange={(event) => {
              const nextVehicleId = event.target.value;

              if (!nextVehicleId || nextVehicleId === selectedVehicleId) {
                return;
              }

              startTransition(async () => {
                await selectVehicleAction(nextVehicleId, safePath);
                router.refresh();
              });
            }}
          >
            {vehicles.map((vehicle) => (
              <option key={vehicle.id} value={vehicle.id}>
                {vehicleLabel(vehicle)}
              </option>
            ))}
          </select>
          <span className={chevronClass} aria-hidden="true">
            <svg width="16" height="16" viewBox="0 0 16 16" fill="none" xmlns="http://www.w3.org/2000/svg">
              <path
                d="M4.5 6.5L8 10L11.5 6.5"
                stroke="currentColor"
                strokeWidth="1.4"
                strokeLinecap="round"
                strokeLinejoin="round"
              />
            </svg>
          </span>
        </div>
      </div>
      <Link href={addVehicleHref} className={addButtonClass}>
        Add vehicle
      </Link>
      {isPending && (
        <span className={mutedTextClass} role="status">
          Updating...
        </span>
      )}
    </div>
  );
}
