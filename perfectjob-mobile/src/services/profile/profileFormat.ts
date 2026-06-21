import type { EducationDto, ExperienceDto, LanguageDto, ResumeAnalysisResponse } from '@/types/profile';

/** "São Paulo, SP" | "São Paulo" | null */
export function formatLocation(
  city?: string | null,
  state?: string | null,
): string | null {
  const parts = [city, state].map((p) => (p ? p.trim() : '')).filter(Boolean);
  return parts.length ? parts.join(', ') : null;
}

/** "2020 - Atual" | "2020 - 2022" | "2020" | null */
export function formatExperiencePeriod(exp: ExperienceDto): string | null {
  const start = exp.startDate?.trim();
  const end = exp.endDate?.trim();
  if (start && end) return `${start} - ${end}`;
  if (start && !end) return `${start} - Atual`;
  if (!start && end) return end;
  return null;
}

/** "Bacharelado em CS" | "Bacharelado" | "CS" | "" */
export function formatEducationTitle(edu: EducationDto): string {
  const degree = edu.degree?.trim();
  const field = edu.fieldOfStudy?.trim();
  if (degree && field) return `${degree} em ${field}`;
  return degree || field || '';
}

export function formatEducationYears(edu: EducationDto): string | null {
  if (edu.startYear && edu.endYear) return `${edu.startYear} - ${edu.endYear}`;
  if (edu.endYear) return String(edu.endYear);
  if (edu.startYear) return `${edu.startYear} - Atual`;
  return null;
}

export function formatYearsExperience(years?: number | null): string | null {
  if (years == null || years <= 0) return null;
  return years === 1 ? '1 ano de experiência' : `${years} anos de experiência`;
}

/** "Inglês — Avançado" | "Inglês" */
export function formatLanguage(lang: LanguageDto): string {
  return lang.level ? `${lang.name} — ${lang.level}` : lang.name;
}

/** Human summary of what a CV analysis extracted, e.g.
 *  "8 competências · 2 experiências · 1 formação". */
export function summarizeResumeAnalysis(analysis: ResumeAnalysisResponse): string {
  const parts: string[] = [];
  const skills = analysis.skills?.length ?? 0;
  const experiences = analysis.experiences?.length ?? 0;
  const education = analysis.education?.length ?? 0;
  const languages = analysis.languages?.length ?? 0;
  parts.push(`${skills} ${skills === 1 ? 'competência' : 'competências'}`);
  parts.push(`${experiences} ${experiences === 1 ? 'experiência' : 'experiências'}`);
  parts.push(`${education} ${education === 1 ? 'formação' : 'formações'}`);
  parts.push(`${languages} ${languages === 1 ? 'idioma' : 'idiomas'}`);
  return parts.join(' · ');
}
