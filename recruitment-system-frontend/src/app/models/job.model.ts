export interface Job {
  id: number;
  user_id: number;
  title: string;
  description: string;
  min_salary: number;
  max_salary: number;
  requirements: string;
  number_of_applicants: number;
  company_name: string;
  status: string;
  applications_count?: number;
  created_at: string;
  updated_at: string;
} 