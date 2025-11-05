declare module "node-cron" {
  export function schedule(expr: string, fn: () => void): any;
  export function validate(expr: string): boolean;
  export type ScheduledTask = any;
}
