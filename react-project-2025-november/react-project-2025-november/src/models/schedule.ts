/* eslint-disable @typescript-eslint/no-explicit-any */
export type ScheduleInstance = {
  scheduleStartDate: string;
  scheduleEndDate: string;
  scheduleId: string;
  name: string;
  approveStatus: "NOT_SUBMITTED" | "PENDING_APPROVAL" | "APPROVED" | "REJECTED";
  rejectReason: string;
  groups: Array<{
    id: string;
    name: string;
  }>;
  shifts: Array<{
    id: string;
    shiftStart: string;
    shiftEnd: string;
    isEndFollowingDay: boolean;
    shiftRule: string;
    point: number;
    name: string;
    requiredPersonnel: any;
  }>;
  staffs: Array<{
    id: string;
    name: string;
    workhours: any;
    group: string;
    offDays: string[];
    isDepartmentStaff: boolean;
    payRates: {
      weekdayRate: number;
      weekendRate: number;
      holidayRate: number;
    };
    pairList?: any[];
  }>;
  assignments: Array<{
    id: string;
    staffId: string;
    shiftId: string;
    shiftStart: string;
    shiftEnd: string;
    isUpdated: boolean;
  }>;
};