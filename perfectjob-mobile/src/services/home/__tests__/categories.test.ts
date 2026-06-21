import { skillIcon, buildCategoriesFromSkills } from '@/services/home/categories';

describe('home categories', () => {
  it('maps known skills to representative icons', () => {
    expect(skillIcon('React').name).toBe('web');
    expect(skillIcon('Java').name).toBe('dns');
    expect(skillIcon('PostgreSQL').name).toBe('bar-chart');
    expect(skillIcon('AWS').name).toBe('cloud');
    expect(skillIcon('Figma').name).toBe('palette');
  });

  it('falls back to a generic icon for unknown skills', () => {
    expect(skillIcon('Quantum Widget').name).toBe('code');
  });

  it('builds category cards from trending skills, respecting the limit', () => {
    const skills = [
      { skill: 'Java', count: 12 },
      { skill: 'React', count: 8 },
      { skill: 'SQL', count: 5 },
    ];
    const categories = buildCategoriesFromSkills(skills, 2);

    expect(categories).toHaveLength(2);
    expect(categories[0].name).toBe('Java');
    expect(categories[0].jobCount).toBe(12);
    expect(categories[0].icon).toBeDefined();
    expect(categories[1].name).toBe('React');
  });
});
