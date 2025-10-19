export type ServiceTemplate = {
  code: string;
  name: string;
  intervalMiles: number;
  intervalMonths: number;
  reminderLeadMiles: number;
  reminderLeadDays: number;
};

export const DEFAULT_SERVICE_TEMPLATES: ServiceTemplate[] = [
  {
    code: 'oil_change',
    name: 'Oil Change',
    intervalMiles: 5000,
    intervalMonths: 6,
    reminderLeadMiles: 500,
    reminderLeadDays: 14
  },
  {
    code: 'tire_rotation',
    name: 'Tire Rotation',
    intervalMiles: 7500,
    intervalMonths: 12,
    reminderLeadMiles: 500,
    reminderLeadDays: 21
  },
  {
    code: 'brake_inspection',
    name: 'Brake Inspection',
    intervalMiles: 0,
    intervalMonths: 12,
    reminderLeadMiles: 0,
    reminderLeadDays: 30
  }
];
