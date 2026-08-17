import { principles } from "../data/principles";
import type { Principle } from '../data/principles';

export function getDayOfYear(): number {
  const now = new Date();
  const start = new Date(now.getFullYear(), 0, 0);
  const diff = now.getTime() - start.getTime();
  const oneDay = 1000 * 60 * 60 * 24;
  return Math.floor(diff / oneDay);
}

export function getDailyPrinciple(): Principle {
  const dayOfYear = getDayOfYear();
  // Using modulo to cycle through the 30 principles safely
  const index = dayOfYear % principles.length;
  return principles[index];
}
