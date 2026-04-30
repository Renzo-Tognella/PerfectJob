export interface JobResponse {
  id: number;
  companyId: number;
  companyName: string;
  title: string;
  slug: string;
  description: string;
  requirements: string;
  benefits: string;
  salaryMin: number;
  salaryMax: number;
  salaryCurrency: string;
  workModel: string;
  experienceLevel: string;
  jobType: string;
  contractType: string;
  locationCity: string;
  locationState: string;
  locationCountry: string;
  skills: string[];
  status: string;
  views: number;
  applicationsCount: number;
  createdAt: string;
  updatedAt: string;
  expiresAt: string;
}
