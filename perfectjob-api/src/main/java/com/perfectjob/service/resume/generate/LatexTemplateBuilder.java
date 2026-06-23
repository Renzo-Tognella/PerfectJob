package com.perfectjob.service.resume.generate;

import com.perfectjob.dto.response.EducationDto;
import com.perfectjob.dto.response.ProfileResponse;
import org.springframework.stereotype.Component;

import java.util.List;
import java.util.Map;
import java.util.stream.Collectors;

/**
 * Builds a complete LaTeX document string from structured LLM content + profile data.
 * The template is fixed (LLM never produces LaTeX). All dynamic content is escaped.
 */
@Component
public class LatexTemplateBuilder {

    private static final List<String> CATEGORY_ORDER = List.of(
            "Linguagens",
            "Frameworks",
            "Bancos de Dados",
            "Ferramentas e Plataformas",
            "Metodologias"
    );

    private static final String SECTION_BODY_VSPACE = "\\vspace{0.20cm}\n";
    private static final String SECTION_HEADING_VSPACE = "\\vspace{0.10cm}\n";

    /**
     * Returns a complete `.tex` document string. No I/O, deterministic.
     */
    public String build(TailoredResumeContent content, ProfileResponse profile) {
        StringBuilder sb = new StringBuilder(8192);
        writePreamble(sb);
        sb.append("\\begin{document}\n\n");
        writeHeader(sb, profile);
        writeSummary(sb, content.professionalSummary());
        writeSkills(sb, content.categorizedSkills());
        writeExperiences(sb, content.tailoredExperiences());
        writeEducation(sb, profile);
        writeLanguages(sb, content.validatedLanguages());
        writeFooter(sb);
        return sb.toString();
    }

    // -----------------------------------------------------------------
    // Template sections
    // -----------------------------------------------------------------

    private void writePreamble(StringBuilder sb) {
        sb.append("\\documentclass[a4paper,9pt]{article}\n")
          .append("\\usepackage[utf8]{inputenc}\n")
          .append("\\usepackage[T1]{fontenc}\n")
          .append("\\usepackage[brazil]{babel}\n")
          .append("\\usepackage[scaled=0.95]{helvet}\n")
          .append("\\renewcommand{\\familydefault}{\\sfdefault}\n")
          .append("\\usepackage[a4paper,top=0.62cm,bottom=0.62cm,left=1.1cm,right=1.1cm]{geometry}\n")
          .append("\\usepackage[hidelinks]{hyperref}\n")
          .append("\\usepackage{enumitem}\n")
          .append("\\usepackage{xcolor}\n")
          .append("\\definecolor{textgray}{HTML}{565656}\n")
          .append("\\definecolor{rulegray}{HTML}{8A8A8A}\n")
          .append("\\pagestyle{empty}\n")
          .append("\\setlength{\\parindent}{0pt}\n")
          .append("\\setlength{\\parskip}{0pt}\n")
          .append("\\raggedright\n")
          .append("\\setlist[itemize]{leftmargin=1.05em,itemsep=1.0pt,topsep=1.5pt,parsep=0pt,partopsep=0pt}\n\n");
    }

    private void writeHeader(StringBuilder sb, ProfileResponse p) {
        sb.append("\\begin{center}\n");
        if (!isBlank(p.fullName())) {
            sb.append("{\\fontsize{17}{18}\\selectfont\\bfseries ")
              .append(escapeLatex(p.fullName()))
              .append("} \\\\[0.05cm]\n");
        }
        if (!isBlank(p.headline())) {
            sb.append("{\\normalsize ")
              .append(escapeLatex(p.headline()))
              .append("} \\\\[0.08cm]\n");
        }
        sb.append("{\\small ")
          .append(escapeLatex(formatLocation(p.locationCity(), p.locationState())))
          .append(contactBlock(p))
          .append("}\n");
        sb.append("\\end{center}\n");
        sb.append("\\vspace{0.04cm}\n\n");
    }

    private String formatLocation(String city, String state) {
        if (isBlank(city) && isBlank(state)) return "";
        StringBuilder loc = new StringBuilder();
        if (!isBlank(city)) loc.append(escapeLatex(city));
        if (!isBlank(city) && !isBlank(state)) loc.append(", ");
        if (!isBlank(state)) loc.append(escapeLatex(state));
        return loc.toString();
    }

    private String contactBlock(ProfileResponse p) {
        StringBuilder s = new StringBuilder();
        boolean any = false;
        if (!isBlank(p.phone())) {
            s.append(" \\textbar\\ ").append(escapeLatex(p.phone()));
            any = true;
        }
        if (!isBlank(p.linkedinUrl())) {
            s.append(" \\textbar\\ LinkedIn: ").append(escapeLatex(p.linkedinUrl()));
            any = true;
        }
        if (!isBlank(p.githubUrl())) {
            s.append(" \\textbar\\ GitHub: ").append(escapeLatex(p.githubUrl()));
            any = true;
        }
        return any ? s.toString() : "";
    }

    private void writeSummary(StringBuilder sb, String summary) {
        if (isBlank(summary)) return;
        section(sb, "Resumo Profissional");
        sb.append(escapeLatex(summary)).append("\n\n");
        sb.append(SECTION_BODY_VSPACE);
    }

    private void writeSkills(StringBuilder sb, List<TailoredResumeContent.CategorizedSkill> categories) {
        if (categories == null || categories.isEmpty()) return;
        Map<String, List<String>> byCategory = categories.stream()
                .filter(c -> c != null && c.category() != null && c.items() != null && !c.items().isEmpty())
                .collect(Collectors.toMap(
                        TailoredResumeContent.CategorizedSkill::category,
                        c -> c.items().stream()
                                .filter(s -> s != null && !s.isBlank())
                                .map(String::strip)
                                .toList(),
                        (a, b) -> a
                ));
        List<String> populated = CATEGORY_ORDER.stream()
                .filter(cat -> byCategory.containsKey(cat) && !byCategory.get(cat).isEmpty())
                .toList();
        if (populated.isEmpty()) return;
        section(sb, "Competências");
        sb.append("\\begin{itemize}\n");
        for (String category : populated) {
            List<String> items = byCategory.get(category);
            String itemsJoined = items.stream()
                    .map(LatexTemplateBuilder::escapeLatex)
                    .collect(Collectors.joining(", "));
            sb.append("    \\item \\textbf{")
              .append(escapeLatex(category))
              .append(":} ")
              .append(itemsJoined)
              .append("\n");
        }
        sb.append("\\end{itemize}\n\n");
        sb.append(SECTION_BODY_VSPACE);
    }

    private void writeExperiences(StringBuilder sb, List<TailoredResumeContent.TailoredExperience> experiences) {
        if (experiences == null || experiences.isEmpty()) return;
        section(sb, "Experiência Profissional");
        for (TailoredResumeContent.TailoredExperience e : experiences) {
            if (e == null) continue;
            String start = nullToEmpty(e.startDate());
            String end = nullToEmpty(e.endDate());
            String dateRange = (start + (isBlank(end) ? "" : " -- " + end)).trim();
            boolean hasTitle = !isBlank(e.title());
            boolean hasDateRange = !isBlank(dateRange);
            if (hasTitle || hasDateRange) {
                if (hasTitle) {
                    sb.append("\\textbf{")
                      .append(escapeLatex(e.title()))
                      .append("}");
                }
                if (hasTitle && hasDateRange) {
                    sb.append(" \\hfill ");
                }
                if (hasDateRange) {
                    sb.append("{\\itshape\\color{textgray} ")
                      .append(escapeLatex(dateRange))
                      .append("}");
                }
                sb.append(" \\\\\n");
            }
            if (!isBlank(e.company())) {
                sb.append("{\\itshape\\color{textgray}")
                  .append(escapeLatex(e.company()))
                  .append("}\\\\\n");
            }
            if (e.bulletPoints() != null && !e.bulletPoints().isEmpty()) {
                sb.append("\\begin{itemize}\n");
                for (String b : e.bulletPoints()) {
                    if (b == null || b.isBlank()) continue;
                    sb.append("    \\item ").append(escapeLatex(b.strip())).append("\n");
                }
                sb.append("\\end{itemize}\n");
            }
            sb.append("\\vspace{0.10cm}\n");
        }
        sb.append("\n");
        sb.append(SECTION_BODY_VSPACE);
    }

    private void writeEducation(StringBuilder sb, ProfileResponse p) {
        if (p.education() == null || p.education().isEmpty()) return;
        section(sb, "Formação Acadêmica");
        for (EducationDto e : p.education()) {
            if (e == null) continue;
            StringBuilder line = new StringBuilder();
            if (!isBlank(e.institution())) line.append(escapeLatex(e.institution()));
            if (!isBlank(e.degree())) {
                if (line.length() > 0) line.append(" — ");
                line.append(escapeLatex(e.degree()));
            }
            if (!isBlank(e.fieldOfStudy())) {
                if (line.length() > 0) line.append(" ");
                line.append("em ").append(escapeLatex(e.fieldOfStudy()));
            }
            if (e.startYear() != null) {
                line.append(" (").append(e.startYear());
                if (e.endYear() != null) line.append("–").append(e.endYear());
                line.append(")");
            }
            if (line.length() == 0) continue;
            sb.append(line).append(" \\\\\n");
        }
        sb.append("\n");
        sb.append(SECTION_BODY_VSPACE);
    }

    private void writeLanguages(StringBuilder sb, List<TailoredResumeContent.ValidatedLanguage> languages) {
        if (languages == null || languages.isEmpty()) return;
        section(sb, "Idiomas");
        String joined = languages.stream()
                .filter(l -> l != null && !isBlank(l.name()))
                .map(l -> isBlank(l.level())
                        ? escapeLatex(l.name())
                        : escapeLatex(l.name()) + " (" + escapeLatex(l.level()) + ")")
                .collect(Collectors.joining(" \\textbar\\ "));
        if (!joined.isEmpty()) {
            sb.append(joined).append("\n\n");
        }
        sb.append(SECTION_BODY_VSPACE);
    }

    private void writeFooter(StringBuilder sb) {
        sb.append("\\end{document}\n");
    }

    private void section(StringBuilder sb, String title) {
        sb.append("{\\bfseries\\fontsize{12.9}{12.9}\\selectfont ")
          .append(escapeLatex(title.toUpperCase()))
          .append("}\\par\n");
        sb.append("{\\color{rulegray}\\hrule height 0.45pt}\n");
        sb.append(SECTION_HEADING_VSPACE);
    }

    // -----------------------------------------------------------------
    // Escaping
    // -----------------------------------------------------------------

    /**
     * Escapes all LaTeX special characters in the given text. Returns empty string for null.
     */
    public static String escapeLatex(String text) {
        if (text == null) return "";
        StringBuilder out = new StringBuilder(text.length() + 16);
        for (int i = 0; i < text.length(); i++) {
            char c = text.charAt(i);
            switch (c) {
                case '\\' -> out.append("\\textbackslash{}");
                case '&'  -> out.append("\\&");
                case '%'  -> out.append("\\%");
                case '$'  -> out.append("\\$");
                case '#'  -> out.append("\\#");
                case '_'  -> out.append("\\_");
                case '{'  -> out.append("\\{");
                case '}'  -> out.append("\\}");
                case '~'  -> out.append("\\textasciitilde{}");
                case '^'  -> out.append("\\textasciicircum{}");
                default   -> out.append(c);
            }
        }
        return out.toString();
    }

    private static boolean isBlank(String s) {
        return s == null || s.isBlank();
    }

    private static String nullToEmpty(String s) {
        return s == null ? "" : s;
    }
}
