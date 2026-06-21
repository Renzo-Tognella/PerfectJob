package com.perfectjob.service.resume;

import com.perfectjob.dto.response.EducationDto;
import com.perfectjob.dto.response.ExperienceDto;
import com.perfectjob.dto.response.ResumeAnalysisResponse;
import org.junit.jupiter.api.Test;

import java.util.List;

import static org.assertj.core.api.Assertions.assertThat;

class ResumeAnalyzerTest {

    private final ResumeAnalyzer analyzer = new ResumeAnalyzer();

    private static final String SAMPLE_CV = """
            João Silva
            Desenvolvedor Full Stack
            São Paulo, SP
            joao.silva@email.com | (11) 98765-4321
            linkedin.com/in/joaosilva | github.com/joaosilva

            Resumo
            Desenvolvedor com experiência em aplicações web modernas.

            Experiência Profissional
            Desenvolvedor Full Stack - TechCorp | 2021 - Atual
            Desenvolvi APIs em Java e Spring Boot.
            Trabalhei com React no frontend.

            Desenvolvedor Backend - StartupX | 2019 - 2021
            Construí microserviços com Node.js e PostgreSQL.

            Formação Acadêmica
            Bacharelado em Ciência da Computação - Universidade de São Paulo (2015 - 2019)

            Competências
            Java, Spring Boot, React, Node.js, PostgreSQL, Docker, AWS, Scrum
            """;

    @Test
    void analyze_extractsContactInformation() {
        ResumeAnalysisResponse result = analyzer.analyze(SAMPLE_CV);

        assertThat(result.email()).isEqualTo("joao.silva@email.com");
        assertThat(result.phone()).contains("98765");
        assertThat(result.linkedinUrl()).isEqualTo("https://linkedin.com/in/joaosilva");
        assertThat(result.githubUrl()).isEqualTo("https://github.com/joaosilva");
        assertThat(result.headline()).isEqualTo("Desenvolvedor Full Stack");
    }

    @Test
    void analyze_extractsSkillsFromBodyAndSkillsSection() {
        ResumeAnalysisResponse result = analyzer.analyze(SAMPLE_CV);

        assertThat(result.skills())
                .contains("Java", "Spring Boot", "React", "Node.js", "PostgreSQL",
                        "Docker", "AWS", "Scrum");
    }

    @Test
    void analyze_doesNotMatchSkillSubstrings() {
        // "Java" must not be detected inside "JavaScript"; only JavaScript should be present.
        List<String> skills = analyzer.extractSkills("Experienced with JavaScript and TypeScript.", List.of());

        assertThat(skills).contains("JavaScript", "TypeScript");
        assertThat(skills).doesNotContain("Java");
    }

    @Test
    void extractSkills_recognisesCompoundAndSymbolSkills() {
        List<String> skills = analyzer.extractSkills(
                "Stack: C++, C#, .NET, Node.js, CI/CD and React Native.", List.of());

        assertThat(skills).contains("C++", "C#", ".NET", "Node.js", "CI/CD", "React Native");
    }

    @Test
    void extractSkills_picksUpUnknownSkillsListedInSkillsSection() {
        List<String> skills = analyzer.extractSkills("", List.of("Salesforce, SAP, Java"));

        assertThat(skills).contains("Salesforce", "SAP", "Java");
    }

    @Test
    void analyze_parsesExperiencesWithRolesCompaniesAndDates() {
        ResumeAnalysisResponse result = analyzer.analyze(SAMPLE_CV);

        assertThat(result.experiences()).hasSize(2);

        ExperienceDto first = result.experiences().get(0);
        assertThat(first.title()).isEqualTo("Desenvolvedor Full Stack");
        assertThat(first.company()).isEqualTo("TechCorp");
        assertThat(first.startDate()).isEqualTo("2021");
        assertThat(first.endDate()).isNull(); // "Atual" => ongoing
        assertThat(first.description()).contains("Java", "Spring Boot", "React");

        ExperienceDto second = result.experiences().get(1);
        assertThat(second.title()).isEqualTo("Desenvolvedor Backend");
        assertThat(second.company()).isEqualTo("StartupX");
        assertThat(second.startDate()).isEqualTo("2019");
        assertThat(second.endDate()).isEqualTo("2021");
    }

    @Test
    void analyze_parsesEducation() {
        ResumeAnalysisResponse result = analyzer.analyze(SAMPLE_CV);

        assertThat(result.education()).hasSize(1);
        EducationDto edu = result.education().get(0);
        assertThat(edu.institution()).isEqualTo("Universidade de São Paulo");
        assertThat(edu.degree()).isEqualTo("Bacharelado");
        assertThat(edu.fieldOfStudy()).isEqualTo("Ciência da Computação");
        assertThat(edu.startYear()).isEqualTo(2015);
        assertThat(edu.endYear()).isEqualTo(2019);
    }

    @Test
    void analyze_estimatesYearsOfExperience() {
        ResumeAnalysisResponse result = analyzer.analyze(SAMPLE_CV);

        // StartupX (2019-2021) alone contributes 2 years; the ongoing role adds more.
        assertThat(result.yearsExperience()).isNotNull();
        assertThat(result.yearsExperience()).isGreaterThanOrEqualTo(2);
    }

    @Test
    void analyze_handlesEmptyInputGracefully() {
        ResumeAnalysisResponse result = analyzer.analyze("");

        assertThat(result.skills()).isEmpty();
        assertThat(result.experiences()).isEmpty();
        assertThat(result.education()).isEmpty();
        assertThat(result.email()).isNull();
        assertThat(result.yearsExperience()).isNull();
    }

    @Test
    void analyze_isNullSafe() {
        ResumeAnalysisResponse result = analyzer.analyze(null);

        assertThat(result).isNotNull();
        assertThat(result.skills()).isEmpty();
    }
}
