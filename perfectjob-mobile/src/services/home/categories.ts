import type { IconSpec } from '@/design-system/icons';
import type { Category } from '@/types';
import type { SkillCount } from '@/types/skill';


export function skillIcon(skill: string): IconSpec {
  const key = skill.toLowerCase();
  const map: Array<[string[], IconSpec]> = [
    [['react', 'vue', 'angular', 'frontend', 'css', 'html'], { family: 'MaterialIcons', name: 'web' }],
    [['java', 'kotlin', 'spring', 'node', 'python', 'php', 'go', 'backend', '.net', 'c#'],
      { family: 'MaterialIcons', name: 'dns' }],
    [['sql', 'postgresql', 'mysql', 'mongodb', 'data', 'pandas', 'analytics', 'power bi'],
      { family: 'Ionicons', name: 'bar-chart' }],
    [['aws', 'azure', 'gcp', 'docker', 'kubernetes', 'devops', 'terraform'],
      { family: 'MaterialIcons', name: 'cloud' }],
    [['figma', 'ux', 'ui', 'design', 'photoshop'], { family: 'MaterialIcons', name: 'palette' }],
    [['scrum', 'agile', 'kanban', 'jira'], { family: 'MaterialIcons', name: 'groups' }],
  ];
  for (const [keywords, icon] of map) {
    if (keywords.some((k) => key.includes(k))) {
      return icon;
    }
  }
  return { family: 'MaterialIcons', name: 'code' };
}


export function buildCategoriesFromSkills(skills: SkillCount[], limit = 6): Category[] {
  return skills.slice(0, limit).map((s, index) => ({
    id: `${index}-${s.skill}`,
    name: s.skill,
    jobCount: s.count,
    icon: skillIcon(s.skill),
  }));
}
