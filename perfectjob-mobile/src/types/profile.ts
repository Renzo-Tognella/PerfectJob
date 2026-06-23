export interface ExperienceDto {
  title: string;
  company?: string | null;
  startDate?: string | null;
  endDate?: string | null;
  description?: string | null;
}

export interface EducationDto {
  institution: string;
  degree?: string | null;
  fieldOfStudy?: string | null;
  startYear?: number | null;
  endYear?: number | null;
}

export interface LanguageDto {
  name: string;
  level?: string | null;
}

export const LANGUAGE_LEVELS = ['Básico', 'Intermediário', 'Avançado', 'Fluente', 'Nativo'] as const;

export interface ProfileResponse {
  id: number;
  email: string;
  fullName: string;
  role: string;
  headline?: string | null;
  phone?: string | null;
  bio?: string | null;
  avatarUrl?: string | null;
  linkedinUrl?: string | null;
  githubUrl?: string | null;
  locationCity?: string | null;
  locationState?: string | null;
  yearsExperience?: number | null;
  resumeUrl?: string | null;
  resumeUpdatedAt?: string | null;
  skills: string[];
  experiences: ExperienceDto[];
  education: EducationDto[];
  languages: LanguageDto[];
  savedJobsCount: number;
}

export interface ResumeAnalysisResponse {
  headline?: string | null;
  email?: string | null;
  phone?: string | null;
  linkedinUrl?: string | null;
  githubUrl?: string | null;
  yearsExperience?: number | null;
  skills: string[];
  experiences: ExperienceDto[];
  education: EducationDto[];
  languages: LanguageDto[];
}

export interface UpdateProfilePayload {
  fullName?: string;
  headline?: string | null;
  phone?: string | null;
  bio?: string | null;
  avatarUrl?: string | null;
  linkedinUrl?: string | null;
  githubUrl?: string | null;
  locationCity?: string | null;
  locationState?: string | null;
  yearsExperience?: number | null;
  skills?: string[];
  experiences?: ExperienceDto[];
  education?: EducationDto[];
  languages?: LanguageDto[];
}
