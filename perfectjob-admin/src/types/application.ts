export type ApplicationStatus = 'PENDING' | 'REVIEWING' | 'ACCEPTED' | 'REJECTED' | 'HIRED';

export interface ApplicationResponse {
  id: number;
  jobId: number;
  jobTitle: string;
  jobSlug: string;
  companyName: string;
  candidateId: number;
  candidateName: string;
  status: ApplicationStatus;
  coverLetter?: string;
  resumeUrl?: string;
  createdAt: string;
  updatedAt: string;
}
