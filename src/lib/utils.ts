import { clsx, type ClassValue } from "clsx";

export function cn(...values: ClassValue[]) {
  return clsx(values);
}

export function pct(value: number) {
  return `${Math.round(value * 100)}%`;
}

export function statusLabel(status: string) {
  return status.replace("_", " ");
}
