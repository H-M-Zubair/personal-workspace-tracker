import { differenceInSeconds, format } from "date-fns";

export function formatClock(date: Date) {
  return format(date, "hh:mm a");
}

export function getElapsedSeconds(start: Date) {
  return Math.max(0, differenceInSeconds(new Date(), start));
}

export function formatDuration(totalSeconds: number) {
  const hours = Math.floor(totalSeconds / 3600);
  const minutes = Math.floor((totalSeconds % 3600) / 60);
  const seconds = totalSeconds % 60;

  return [hours, minutes, seconds].map((value) => String(value).padStart(2, "0")).join(":");
}
