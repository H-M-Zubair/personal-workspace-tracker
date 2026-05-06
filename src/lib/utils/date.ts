import { format } from "date-fns";

export function getTodayLabel(date = new Date()) {
  return format(date, "EEEE, MMM d");
}
