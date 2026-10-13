import { z } from "zod";

export interface EmployeeDto {
  id: number;
  firstName: string;
  lastName: string;
  email: string;
  phoneNumber?: string;
  dateOfBirth?: string;
  position: string;
  department: string;
  status: number;
  createdAt: string;
}

export const employeeFormSchema = z.object({
  firstName: z.string().min(2, "First name must be at least 2 characters"),
  lastName: z.string().min(2, "Last name must be at least 2 characters"),
  email: z.string().email("Invalid email address"),
  phoneNumber: z.string().optional(),
  dateOfBirth: z.string().optional(),
  position: z.string().min(2, "Position is required"),
  department: z.string().min(2, "Department is required"),
});

export type EmployeeFormValues = z.infer<typeof employeeFormSchema>;
