package com.perfectjob.service.resume.generate;

import com.perfectjob.dto.response.EducationDto;
import com.perfectjob.dto.response.ExperienceDto;
import com.perfectjob.dto.response.LanguageDto;
import com.perfectjob.dto.response.ProfileResponse;
import org.junit.jupiter.api.Test;

import java.time.LocalDateTime;
import java.util.List;

import static org.assertj.core.api.Assertions.assertThat;

class LatexTemplateBuilderTest {

    private final LatexTemplateBuilder builder = new LatexTemplateBuilder();

    private ProfileResponse sampleProfile() {
        return new ProfileResponse(
                1L, "cand@test.com", "João Silva", "CANDIDATE",
                "Desenvolvedor Full Stack", "11999998888", "bio", null,
                "https://linkedin.com/in/joao", "https://github.com/joao",
                "São Paulo", "SP", 5, null, LocalDateTime.now(),
                List.of("Java", "Spring"),
                List.of(new ExperienceDto("Backend Dev", "Acme", "Jan/2022", "Atual", "did things")),
                List.of(new EducationDto("USP", "BSc", "CS", 2018, 2022)),
                List.of(new LanguageDto("Inglês", "Avançado")),
                3L
        );
    }

    @Test
    void build_containsPreambleAndDocumentClass() {
        String tex = builder.build(sampleTailoredContent(), sampleProfile());

        assertThat(tex).contains("\\documentclass[a4paper,9pt]{article}");
        assertThat(tex).contains("\\usepackage[utf8]{inputenc}");
        assertThat(tex).contains("\\usepackage[brazil]{babel}");
        assertThat(tex).contains("\\usepackage[scaled=0.95]{helvet}");
        assertThat(tex).contains("\\definecolor{textgray}{HTML}{565656}");
        assertThat(tex).contains("\\definecolor{rulegray}{HTML}{8A8A8A}");
        assertThat(tex).endsWith("\\end{document}\n");
    }

    @Test
    void build_includesNameAndHeadlineInHeader() {
        String tex = builder.build(sampleTailoredContent(), sampleProfile());

        assertThat(tex).contains("João Silva");
        assertThat(tex).contains("Desenvolvedor Full Stack");
        assertThat(tex).contains("São Paulo");
        assertThat(tex).contains("SP");
        assertThat(tex).contains("11999998888");
    }

    @Test
    void build_includesProfessionalSummary() {
        String tex = builder.build(sampleTailoredContent(), sampleProfile());

        assertThat(tex).contains("Engenheiro de software com 5 anos");
    }

    @Test
    void build_includesCategorizedSkillsAsCompactLines() {
        String tex = builder.build(sampleTailoredContent(), sampleProfile());


        assertThat(tex).contains("COMPETÊNCIAS");

        assertThat(tex).contains("\\textbf{Linguagens:}");
        assertThat(tex).contains("Java");
        assertThat(tex).contains("Spring");

        assertThat(tex).doesNotContain("COMPETÊNCIAS TÉCNICAS");

        assertThat(tex).contains("\\hrule");
    }

    @Test
    void build_includesTailoredExperiences() {
        String tex = builder.build(sampleTailoredContent(), sampleProfile());

        assertThat(tex).contains("Backend Dev");
        assertThat(tex).contains("Acme");
        assertThat(tex).contains("Jan/2022");
        assertThat(tex).contains("Atual");

        assertThat(tex).contains("\\item Reduzi 40\\% o tempo de deploy");
    }

    @Test
    void build_includesEducation() {
        String tex = builder.build(sampleTailoredContent(), sampleProfile());

        assertThat(tex).contains("USP");
        assertThat(tex).contains("BSc");
        assertThat(tex).contains("CS");
        assertThat(tex).contains("(2018–2022)");
    }

    @Test
    void escapeLatex_handlesAllSpecialChars() {
        assertThat(LatexTemplateBuilder.escapeLatex("&")).isEqualTo("\\&");
        assertThat(LatexTemplateBuilder.escapeLatex("%")).isEqualTo("\\%");
        assertThat(LatexTemplateBuilder.escapeLatex("$")).isEqualTo("\\$");
        assertThat(LatexTemplateBuilder.escapeLatex("#")).isEqualTo("\\#");
        assertThat(LatexTemplateBuilder.escapeLatex("_")).isEqualTo("\\_");
        assertThat(LatexTemplateBuilder.escapeLatex("{")).isEqualTo("\\{");
        assertThat(LatexTemplateBuilder.escapeLatex("}")).isEqualTo("\\}");
        assertThat(LatexTemplateBuilder.escapeLatex("~")).isEqualTo("\\textasciitilde{}");
        assertThat(LatexTemplateBuilder.escapeLatex("^")).isEqualTo("\\textasciicircum{}");
        assertThat(LatexTemplateBuilder.escapeLatex("\\")).isEqualTo("\\textbackslash{}");
    }

    @Test
    void escapeLatex_returnsEmptyForNull() {
        assertThat(LatexTemplateBuilder.escapeLatex(null)).isEmpty();
    }

    @Test
    void escapeLatex_preservesPlainText() {
        assertThat(LatexTemplateBuilder.escapeLatex("Hello World"))
                .isEqualTo("Hello World");
    }

    @Test
    void escapeLatex_handlesCombinedSpecials() {
        assertThat(LatexTemplateBuilder.escapeLatex("a&b%c$d#e_f{g}h~i^j\\k"))
                .isEqualTo("a\\&b\\%c\\$d\\#e\\_f\\{g\\}h\\textasciitilde{}i\\textasciicircum{}j\\textbackslash{}k");
    }

    @Test
    void build_handlesNullOptionalFieldsGracefully() {
        ProfileResponse minimal = new ProfileResponse(
                1L, "cand@test.com", "Maria", "CANDIDATE",
                null, null, null, null, null, null, null, null, null, null, null,
                List.of(),
                List.of(),
                List.of(),
                List.of(),
                0L
        );
        TailoredResumeContent content = new TailoredResumeContent(
                "Resumo curto",
                List.of(new TailoredResumeContent.CategorizedSkill("Linguagens", List.of("Java"))),
                List.of(new TailoredResumeContent.TailoredExperience("Dev", "X", "Jan/2022", "Atual", List.of("feito"))),
                List.of()
        );

        String tex = builder.build(content, minimal);

        assertThat(tex).contains("Maria");
        assertThat(tex).contains("Resumo curto");
        assertThat(tex).contains("Dev");
        assertThat(tex).contains("feito");
    }

    @Test
    void build_omitsHeadlineLineWhenHeadlineIsBlank() {
        ProfileResponse noHeadline = new ProfileResponse(
                1L, "cand@test.com", "Maria", "CANDIDATE",
                null, null, null, null, null, null, null, null, null, null, null,
                List.of(),
                List.of(),
                List.of(),
                List.of(),
                0L
        );

        String tex = builder.build(sampleTailoredContent(), noHeadline);

        assertThat(tex).doesNotContain("\\normalsize \n");
        assertThat(tex).doesNotContain("} \\\\[0.08cm]");
    }

    @Test
    void build_omitsFullNameLineWhenFullNameIsBlank() {
        ProfileResponse noName = new ProfileResponse(
                1L, "cand@test.com", null, "CANDIDATE",
                "Dev", null, null, null, null, null, null, null, null, null, null,
                List.of(),
                List.of(),
                List.of(),
                List.of(),
                0L
        );

        String tex = builder.build(sampleTailoredContent(), noName);

        assertThat(tex).doesNotContain("\\fontsize{17}{18}");
        assertThat(tex).doesNotContain("} \\\\[0.05cm]");
    }

    @Test
    void build_omitsExperienceLineWhenTitleAndDateRangeAreBlank() {
        ProfileResponse full = sampleProfile();
        TailoredResumeContent content = new TailoredResumeContent(
                null,
                List.of(),
                List.of(new TailoredResumeContent.TailoredExperience(null, null, null, null, List.of("feito"))),
                List.of()
        );

        String tex = builder.build(content, full);

        assertThat(tex).contains("feito");
        assertThat(tex).doesNotContain("\\textbf{}");
        assertThat(tex).doesNotContain("\\hfill {\\itshape\\color{textgray}  } \\\\");
    }

    @Test
    void build_omitsEducationLineWhenAllFieldsAreBlank() {
        ProfileResponse noEducation = new ProfileResponse(
                1L, "cand@test.com", "Maria", "CANDIDATE",
                "Dev", null, null, null, null, null, null, null, null, null, null,
                List.of(),
                List.of(),
                List.of(),
                List.of(),
                0L
        );
        TailoredResumeContent content = new TailoredResumeContent(null, List.of(), List.of(), List.of());

        String tex = builder.build(content, noEducation);

        assertThat(tex).doesNotContain("FORMAÇÃO ACADÊMICA");
    }





    @Test
    void build_rendersCategorizedSkillsInCanonicalOrder() {



        TailoredResumeContent reversed = new TailoredResumeContent(
                "Resumo.",
                List.of(
                        new TailoredResumeContent.CategorizedSkill("Metodologias", List.of("Agile", "Scrum")),
                        new TailoredResumeContent.CategorizedSkill("Ferramentas e Plataformas", List.of("Docker", "Git")),
                        new TailoredResumeContent.CategorizedSkill("Bancos de Dados", List.of("PostgreSQL")),
                        new TailoredResumeContent.CategorizedSkill("Frameworks", List.of("Spring")),
                        new TailoredResumeContent.CategorizedSkill("Linguagens", List.of("Java", "Kotlin"))
                ),
                List.of(),
                List.of()
        );

        String tex = builder.build(reversed, sampleProfile());



        int linguagens = tex.indexOf("\\textbf{Linguagens:}");
        int frameworks = tex.indexOf("\\textbf{Frameworks:}");
        int bancos = tex.indexOf("\\textbf{Bancos de Dados:}");
        int ferramentas = tex.indexOf("\\textbf{Ferramentas e Plataformas:}");
        int metodologias = tex.indexOf("\\textbf{Metodologias:}");

        assertThat(linguagens).isPositive();
        assertThat(frameworks).isGreaterThan(linguagens);
        assertThat(bancos).isGreaterThan(frameworks);
        assertThat(ferramentas).isGreaterThan(bancos);
        assertThat(metodologias).isGreaterThan(ferramentas);
    }

    @Test
    void build_omitsCategoriesWithZeroItems() {

        TailoredResumeContent sparse = new TailoredResumeContent(
                "Resumo.",
                List.of(
                        new TailoredResumeContent.CategorizedSkill("Linguagens", List.of("Java")),
                        new TailoredResumeContent.CategorizedSkill("Frameworks", List.of("Spring"))
                ),
                List.of(),
                List.of()
        );

        String tex = builder.build(sparse, sampleProfile());


        assertThat(tex).contains("\\textbf{Linguagens:}");
        assertThat(tex).contains("\\textbf{Frameworks:}");

        assertThat(tex).doesNotContain("\\textbf{Bancos de Dados:}");
        assertThat(tex).doesNotContain("\\textbf{Ferramentas e Plataformas:}");
        assertThat(tex).doesNotContain("\\textbf{Metodologias:}");
    }








    @Test
    void build_includesIdiomasSectionWhenValidatedLanguagesNonEmpty() {


        String tex = builder.build(sampleTailoredContent(), sampleProfile());

        assertThat(tex).contains("IDIOMAS");
    }

    @Test
    void build_omitsIdiomasSectionWhenValidatedLanguagesEmpty() {
        TailoredResumeContent noLanguages = new TailoredResumeContent(
                "Resumo.",
                List.of(new TailoredResumeContent.CategorizedSkill("Linguagens", List.of("Java"))),
                List.of(),
                List.of()
        );
        ProfileResponse noLanguagesProfile = sampleProfile();



        String tex = builder.build(noLanguages, noLanguagesProfile);

        assertThat(tex).doesNotContain("IDIOMAS");
    }

    @Test
    void build_omitsIdiomasSectionWhenValidatedLanguagesNull() {
        TailoredResumeContent nullLanguages = new TailoredResumeContent(
                "Resumo.",
                List.of(new TailoredResumeContent.CategorizedSkill("Linguagens", List.of("Java"))),
                List.of(),
                null
        );
        ProfileResponse profile = sampleProfile();

        String tex = builder.build(nullLanguages, profile);

        assertThat(tex).doesNotContain("IDIOMAS");
    }

    @Test
    void build_idiomasSectionUsesSameHrulePatternAsOtherSections() {


        String tex = builder.build(sampleTailoredContent(), sampleProfile());




        assertThat(tex).contains("\\hrule height 0.45pt}\n\\vspace{0.10cm}");

        int idiomasPos = tex.indexOf("IDIOMAS");
        assertThat(idiomasPos).isPositive();



        int idiomasHrulePos = tex.indexOf("\\hrule height 0.45pt}", idiomasPos);
        assertThat(idiomasHrulePos).isPositive();

        String afterIdiomasHrule = tex.substring(idiomasHrulePos);
        assertThat(afterIdiomasHrule).startsWith("\\hrule height 0.45pt}\n\\vspace{0.10cm}\n");
    }

    @Test
    void build_rendersEachLanguageAsLanguageParensLevel() {
        TailoredResumeContent twoLanguages = new TailoredResumeContent(
                "Resumo.",
                List.of(new TailoredResumeContent.CategorizedSkill("Linguagens", List.of("Java"))),
                List.of(),
                List.of(
                        new TailoredResumeContent.ValidatedLanguage("Inglês", "Avançado"),
                        new TailoredResumeContent.ValidatedLanguage("Português", "Nativo")
                )
        );

        String tex = builder.build(twoLanguages, sampleProfile());

        assertThat(tex).contains("Inglês (Avançado)");
        assertThat(tex).contains("Português (Nativo)");
    }

    @Test
    void build_rendersLanguagesInOrderProvided() {
        TailoredResumeContent orderedLanguages = new TailoredResumeContent(
                "Resumo.",
                List.of(new TailoredResumeContent.CategorizedSkill("Linguagens", List.of("Java"))),
                List.of(),
                List.of(
                        new TailoredResumeContent.ValidatedLanguage("Espanhol", "Básico"),
                        new TailoredResumeContent.ValidatedLanguage("Inglês", "Avançado"),
                        new TailoredResumeContent.ValidatedLanguage("Português", "Nativo")
                )
        );

        String tex = builder.build(orderedLanguages, sampleProfile());

        int espanhol = tex.indexOf("Espanhol (Básico)");
        int ingles = tex.indexOf("Inglês (Avançado)");
        int portugues = tex.indexOf("Português (Nativo)");

        assertThat(espanhol).isPositive();
        assertThat(ingles).isGreaterThan(espanhol);
        assertThat(portugues).isGreaterThan(ingles);
    }





    @Test
    void build_includesVspaceBetweenSectionContentAndNextHeading() {
        String tex = builder.build(sampleTailoredContent(), sampleProfile());



        assertThat(tex).contains("\\vspace{0.20cm}");
    }

    @Test
    void build_includesVspaceImmediatelyAfterEveryHrule() {
        String tex = builder.build(sampleTailoredContent(), sampleProfile());







        long hruleCount = countOccurrences(tex, "\\hrule height 0.45pt}");
        long hruleVspacePairCount = countOccurrences(tex, "\\hrule height 0.45pt}\n\\vspace{0.10cm}");

        assertThat(hruleVspacePairCount).isEqualTo(hruleCount);
        assertThat(hruleVspacePairCount).isPositive();
    }

    @Test
    void build_doesNotIncludeNewpageInTypicalFullProfile() {


        String tex = builder.build(sampleTailoredContent(), sampleProfile());

        assertThat(tex).doesNotContain("\\newpage");
    }

    private static long countOccurrences(String haystack, String needle) {
        long count = 0;
        int idx = 0;
        while ((idx = haystack.indexOf(needle, idx)) != -1) {
            count++;
            idx += needle.length();
        }
        return count;
    }

    private TailoredResumeContent sampleTailoredContent() {
        return new TailoredResumeContent(
                "Engenheiro de software com 5 anos de experiência em backend Java.",
                List.of(new TailoredResumeContent.CategorizedSkill(
                        "Linguagens", List.of("Java", "Spring"))),
                List.of(new TailoredResumeContent.TailoredExperience(
                        "Backend Dev", "Acme", "Jan/2022", "Atual",
                        List.of("Reduzi 40% o tempo de deploy", "Implementei 10 APIs REST")
                )),
                List.of(new TailoredResumeContent.ValidatedLanguage("Português", "Nativo"),
                        new TailoredResumeContent.ValidatedLanguage("Inglês", "Avançado"))
        );
    }
}
