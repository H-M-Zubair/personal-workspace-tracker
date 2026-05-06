export type WeekDay = "Mon" | "Tue" | "Wed" | "Thu" | "Fri" | "Sat" | "Sun";

export type TaskPriority = "Low" | "Medium" | "High";
export type TaskCategory = "Work" | "Personal" | "Learning" | "Health" | "Other";

export interface Task {
  id: string;
  userId: string;
  title: string;
  description?: string;
  category: TaskCategory;
  priority: TaskPriority;
  plannedHours: number;
  plannedMinutes: number;
  workDays: WeekDay[];
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface AttendanceRecord {
  id: string;
  userId: string;
  date: string;
  checkedInAt: string;
  checkedOutAt?: string;
}

export interface ApiResponse<T> {
  success: boolean;
  data?: T;
  error?: string;
}
