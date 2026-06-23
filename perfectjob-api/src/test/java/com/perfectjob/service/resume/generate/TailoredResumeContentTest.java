package com.perfectjob.service.resume.generate;

import org.junit.jupiter.api.Test;

import java.util.List;

import static org.assertj.core.api.Assertions.assertThat;

class TailoredResumeContentTest {

    @Test
    void categorizedSkills_returnsListOfCategorizedSkill() {
        List<TailoredResumeContent.CategorizedSkill> categories = List.of(
                new TailoredResumeContent.CategorizedSkill("Linguagens", List.of("Java"))
        );

        TailoredResumeContent content = new TailoredResumeContent(
                "Engenheiro de software",
                categories,
                List.of()
        );

        assertThat(content.categorizedSkills()).isSameAs(categories);
        assertThat(content.categorizedSkills()).hasSize(1);
        assertThat(content.categorizedSkills().get(0).category()).isEqualTo("Linguagens");
        assertThat(content.categorizedSkills().get(0).items()).containsExactly("Java");
    }

    @Test
    void categorizedSkillRecord_holdsCategoryAndItems() {
        TailoredResumeContent.CategorizedSkill skill = new TailoredResumeContent.CategorizedSkill(
                "Frameworks", List.of("Spring", "Hibernate"));

        assertThat(skill.category()).isEqualTo("Frameworks");
        assertThat(skill.items()).containsExactly("Spring", "Hibernate");
    }
}
