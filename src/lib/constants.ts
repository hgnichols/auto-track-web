export type ServiceTemplate = {
  code: string;
  name: string;
  intervalMiles: number | null;
  intervalMonths: number | null;
  reminderLeadMiles: number | null;
  reminderLeadDays: number | null;
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
    intervalMiles: 6000,
    intervalMonths: 6,
    reminderLeadMiles: 500,
    reminderLeadDays: 14
  },
  {
    code: 'brake_inspection',
    name: 'Brake Inspection',
    intervalMiles: null,
    intervalMonths: 12,
    reminderLeadMiles: 0,
    reminderLeadDays: 30
  },
  {
    code: 'engine_air_filter',
    name: 'Replace Engine Air Filter',
    intervalMiles: 15000,
    intervalMonths: 24,
    reminderLeadMiles: 1000,
    reminderLeadDays: 30
  },
  {
    code: 'cabin_air_filter',
    name: 'Replace Cabin Air Filter',
    intervalMiles: 15000,
    intervalMonths: 12,
    reminderLeadMiles: 1000,
    reminderLeadDays: 21
  },
  {
    code: 'brake_fluid_flush',
    name: 'Brake Fluid Flush',
    intervalMiles: null,
    intervalMonths: 24,
    reminderLeadMiles: null,
    reminderLeadDays: 21
  },
  {
    code: 'coolant_service',
    name: 'Coolant Flush & Replace',
    intervalMiles: 60000,
    intervalMonths: 60,
    reminderLeadMiles: 1000,
    reminderLeadDays: 45
  },
  {
    code: 'transmission_service',
    name: 'Transmission Fluid Service',
    intervalMiles: 60000,
    intervalMonths: 60,
    reminderLeadMiles: 1000,
    reminderLeadDays: 45
  },
  {
    code: 'spark_plug_replacement',
    name: 'Replace Spark Plugs',
    intervalMiles: 100000,
    intervalMonths: 72,
    reminderLeadMiles: 5000,
    reminderLeadDays: 45
  },
  {
    code: 'battery_check',
    name: 'Battery & Charging System Check',
    intervalMiles: null,
    intervalMonths: 12,
    reminderLeadMiles: null,
    reminderLeadDays: 14
  },
  {
    code: 'wiper_blade_replacement',
    name: 'Replace Wiper Blades',
    intervalMiles: null,
    intervalMonths: 12,
    reminderLeadMiles: null,
    reminderLeadDays: 14
  }
];
