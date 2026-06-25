export interface AdminResume {
  id: number;
  candidateName: string;
  candidateEmail: string | null;
  jobTitle: string;
  createdAt: string;
}

export interface AdminResumeStats {
  totalResumes: number;
  resumesToday: number;
}

export interface ResumeCountByJob {
  jobId: number;
  jobTitle: string;
  resumeCount: number;
}
