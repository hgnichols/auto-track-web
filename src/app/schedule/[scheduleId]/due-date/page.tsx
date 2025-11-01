import Link from 'next/link';
import { notFound } from 'next/navigation';
import { requireDeviceId } from '../../../../lib/device';
import { getSchedule, getVehicle } from '../../../../lib/repository';
import {
  cardClass,
  ghostButtonCompactClass,
  mutedTextClass
} from '../../../../lib/ui';
import type { Vehicle } from '../../../../lib/types';
import { UpdateDueDateForm } from './update-form';

type PageSearchParams = Record<string, string | string[] | undefined>;

type PageProps = {
  params: Promise<{ scheduleId: string }> | { scheduleId: string };
  searchParams?: Promise<PageSearchParams> | PageSearchParams;
};

function resolveReturnPath(searchParams?: Record<string, string | string[] | undefined>) {
  const raw = searchParams?.return;
  const candidate =
    typeof raw === 'string'
      ? raw
      : Array.isArray(raw) && raw.length > 0
      ? raw[0]
      : undefined;

  return candidate && candidate.startsWith('/') ? candidate : '/';
}

function vehicleDisplayName(vehicle: Vehicle) {
  const year = vehicle.year ? `${vehicle.year} ` : '';
  return `${year}${vehicle.make} ${vehicle.model}`.trim();
}

export default async function UpdateDueDatePage({ params, searchParams }: PageProps) {
  const resolvedParams = params instanceof Promise ? await params : params;
  const resolvedSearchParams =
    searchParams instanceof Promise ? await searchParams : searchParams;

  const scheduleId = resolvedParams?.scheduleId?.trim();

  if (!scheduleId) {
    notFound();
  }

  const currentPath = `/schedule/${scheduleId}/due-date`;
  const deviceId = await requireDeviceId(currentPath);
  const schedule = await getSchedule(deviceId, scheduleId);

  if (!schedule) {
    notFound();
  }

  const vehicle = await getVehicle(deviceId, schedule.vehicle_id);

  if (!vehicle) {
    notFound();
  }

  const returnPath = resolveReturnPath(resolvedSearchParams);
  const backLabel = returnPath === '/timeline' ? 'Back to timeline' : 'Back to dashboard';
  const vehicleLabel = vehicleDisplayName(vehicle);
  const currentDueDateLabel = schedule.next_due_date
    ? new Date(schedule.next_due_date).toLocaleDateString()
    : null;

  return (
    <div className="mx-auto flex w-full max-w-2xl flex-col gap-4 px-4 py-10 sm:py-12">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <Link href={returnPath} className={ghostButtonCompactClass}>
          {backLabel}
        </Link>
      </div>

      <section className={`${cardClass} grid gap-6`}>
        <header className="grid gap-2">
          <h1 className="text-2xl font-semibold tracking-tight text-slate-900 dark:text-slate-100">
            Adjust due date
          </h1>
          <p className={mutedTextClass}>
            Set a new target date for the <span className="font-medium">{schedule.service_name}</span> reminder.
          </p>
          <p className={mutedTextClass}>
            Vehicle: <span className="font-medium text-slate-800 dark:text-slate-100">{vehicleLabel}</span>
          </p>
          {currentDueDateLabel && (
            <p className="text-sm text-slate-500">
              Current target date: {currentDueDateLabel}
            </p>
          )}
        </header>

        <UpdateDueDateForm
          scheduleId={schedule.id}
          defaultDueDate={schedule.next_due_date}
          returnPath={returnPath}
        />
      </section>
    </div>
  );
}
