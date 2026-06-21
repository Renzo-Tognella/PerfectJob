import {
  formatLocation,
  formatExperiencePeriod,
  formatEducationTitle,
  formatEducationYears,
  formatYearsExperience,
  formatLanguage,
  summarizeResumeAnalysis,
} from '@/services/profile/profileFormat';

describe('profileFormat', () => {
  it('formats location from city and state', () => {
    expect(formatLocation('São Paulo', 'SP')).toBe('São Paulo, SP');
    expect(formatLocation('São Paulo', null)).toBe('São Paulo');
    expect(formatLocation(null, null)).toBeNull();
  });

  it('formats experience period including ongoing roles', () => {
    expect(formatExperiencePeriod({ title: 'Dev', startDate: '2020', endDate: '2022' })).toBe('2020 - 2022');
    expect(formatExperiencePeriod({ title: 'Dev', startDate: '2021', endDate: null })).toBe('2021 - Atual');
    expect(formatExperiencePeriod({ title: 'Dev' })).toBeNull();
  });

  it('formats education title and years', () => {
    expect(formatEducationTitle({ institution: 'USP', degree: 'Bacharelado', fieldOfStudy: 'CC' }))
      .toBe('Bacharelado em CC');
    expect(formatEducationTitle({ institution: 'USP', degree: 'Bacharelado' })).toBe('Bacharelado');
    expect(formatEducationYears({ institution: 'USP', startYear: 2015, endYear: 2019 })).toBe('2015 - 2019');
    expect(formatEducationYears({ institution: 'USP', endYear: 2019 })).toBe('2019');
  });

  it('formats years of experience with pluralization', () => {
    expect(formatYearsExperience(1)).toBe('1 ano de experiência');
    expect(formatYearsExperience(5)).toBe('5 anos de experiência');
    expect(formatYearsExperience(0)).toBeNull();
    expect(formatYearsExperience(null)).toBeNull();
  });

  it('formats a language with and without level', () => {
    expect(formatLanguage({ name: 'Inglês', level: 'Avançado' })).toBe('Inglês — Avançado');
    expect(formatLanguage({ name: 'Inglês' })).toBe('Inglês');
  });

  it('summarizes a resume analysis', () => {
    const summary = summarizeResumeAnalysis({
      skills: ['Java', 'React'],
      experiences: [{ title: 'Dev' }],
      education: [],
      languages: [{ name: 'Inglês', level: 'Avançado' }],
    });
    expect(summary).toBe('2 competências · 1 experiência · 0 formações · 1 idioma');
  });
});
