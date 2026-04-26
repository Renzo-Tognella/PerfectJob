export interface Job {
  id: string;
  title: string;
  company: string;
  location: string;
  salaryRange?: string;
  salary?: string;
  skills?: string[];
  postedAt?: string;
  matchPercentage?: number;
  logoUrl?: string;
  workModel?: 'Remoto' | 'Híbrido' | 'Presencial';
  level?: 'Júnior' | 'Pleno' | 'Sênior';
  contractType?: string;
  description?: string;
  requirements?: string[];
  benefits?: string[];
}

export interface Category {
  id: string;
  name: string;
  jobCount: number;
  icon: string;
}

export interface Company {
  id: string;
  name: string;
  logoUrl?: string;
}
