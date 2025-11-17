/* eslint-disable @typescript-eslint/no-explicit-any */
interface Department {
  departmentId: string;
  name: string;
  role: number;
}
export interface UserInstance {
  id: string;
  name: string;
  phoneNumber: string | null;
  email: string;
  isVerified: boolean;
  organizationId: string;
  organizationPlan: string;
  departments: Department[];
  role: any;
  currentDepartmentId: string;
  language: string;
}