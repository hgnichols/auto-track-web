'use server';

import { revalidatePath } from 'next/cache';
import { redirect } from 'next/navigation';
import { requireDeviceId } from '../../../../lib/device';
import { getSchedule, updateScheduleDueDate } from '../../../../lib/repository';

const REVALIDATE_TARGETS = ['/', '/timeline', '/service/new'];

export async function submitScheduleDueDateAction(formData: FormData) {
  const rawReturnPath = formData.get('return_path');
  const scheduleIdValue = formData.get('schedule_id');
  const dueDateValue = formData.get('next_due_date');

  const fallbackReturnPath =
    typeof rawReturnPath === 'string' && rawReturnPath.startsWith('/') ? rawReturnPath : '/';

  const deviceId = await requireDeviceId(fallbackReturnPath);

  const scheduleId =
    typeof scheduleIdValue === 'string' && scheduleIdValue.trim().length > 0
      ? scheduleIdValue.trim()
      : '';

  if (!scheduleId) {
    throw new Error('Schedule id is required.');
  }

  const dueDate =
    typeof dueDateValue === 'string' && dueDateValue.trim().length > 0
      ? dueDateValue.trim()
      : '';

  if (!dueDate) {
    throw new Error('Please choose a target date.');
  }

  if (Number.isNaN(new Date(dueDate).getTime())) {
    throw new Error('Please enter a valid due date.');
  }

  const schedule = await getSchedule(deviceId, scheduleId);

  if (!schedule) {
    throw new Error('Schedule not found for the current device.');
  }

  await updateScheduleDueDate(deviceId, scheduleId, dueDate);

  for (const target of REVALIDATE_TARGETS) {
    revalidatePath(target);
  }

  if (!REVALIDATE_TARGETS.includes(fallbackReturnPath)) {
    revalidatePath(fallbackReturnPath);
  }

  const currentPagePath = `/schedule/${scheduleId}/due-date`;
  if (!REVALIDATE_TARGETS.includes(currentPagePath)) {
    revalidatePath(currentPagePath);
  }

  redirect(fallbackReturnPath);
}
