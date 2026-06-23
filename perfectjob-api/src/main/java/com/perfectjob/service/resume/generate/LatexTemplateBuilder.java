package com.perfectjob.service.resume.generate;

import com.perfectjob.dto.response.EducationDto;
import com.perfectjob.dto.response.ProfileResponse;
import org.springframework.stereotype.Component;

import java.util.List;

/**
 * Builds a complete LaTeX document string from structured LLM content + profile data.
 * The template is fixed (LLM never produces LaTeX). All dynamic content is escaped.
 */
@Component
public class LatexTemplateBuilder {

    /**
     * Returns a complete `.tex` document string. No I/O, deterministic.
     */
    public String build(TailoredResumeContent content, ProfileResponse profile) {
        StringBuilder sb = new StringBuilder(8192);
        writePreamble(sb);
        writeHeader(sb, profile);
        writeSummary(sb, content.professionalSummary());
        writeSkills(sb, content.highlightedSkills());
        writeExperiences(sb, content.tailoredExperiences());
        writeEducation(sb, profile);
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
        sb.append("{\\fontsize{17}{18}\\selectfont\\bfseries ")
          .append(escapeLatex(nullToEmpty(p.fullName())))
          .append("} \\\\[0.05cm]\n");
        sb.append("{\\normalsize ")
          .append(escapeLatex(nullToEmpty(p.headline())))
          .append("} \\\\[0.08cm]\n");
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
    }

    private void writeSkills(StringBuilder sb, List<String> skills) {
        if (skills == null || skills.isEmpty()) return;
        section(sb, "Competências Técnicas");
        sb.append("\\begin{itemize}\n");
        for (String s : skills) {
            if (s == null || s.isBlank()) continue;
            sb.append("    \\item ").append(escapeLatex(s.strip())).append("\n");
        }
        sb.append("\\end{itemize}\n\n");
    }

    private void writeExperiences(StringBuilder sb, List<TailoredResumeContent.TailoredExperience> experiences) {
        if (experiences == null || experiences.isEmpty()) return;
        section(sb, "Experiência Profissional");
        for (TailoredResumeContent.TailoredExperience e : experiences) {
            if (e == null) continue;
            String start = nullToEmpty(e.startDate());
            String end = nullToEmpty(e.endDate());
            String dateRange = (start + (isBlank(end) ? "" : " -- " + end)).trim();
            sb.append("\\textbf{")
              .append(escapeLatex(nullToEmpty(e.title())))
              .append("} \\hfill {\\itshape\\color{textgray} ")
              .append(escapeLatex(dateRange))
              .append("} \\\\\n");
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
    }

    private void writeEducation(StringBuilder sb, ProfileResponse p) {
        if (p.education() == null || p.education().isEmpty()) return;
        section(sb, "Formação Acadêmica");
        for (EducationDto e : p.education()) {
            if (e == null) continue;
            String line = escapeLatex(nullToEmpty(e.institution()));
            if (!isBlank(e.degree())) line += " — " + escapeLatex(e.degree());
            if (!isBlank(e.fieldOfStudy())) line += " em " + escapeLatex(e.fieldOfStudy());
            if (e.startYear() != null) {
                line += " (" + e.startYear();
                if (e.endYear() != null) line += "–" + e.endYear();
                line += ")";
            }
            sb.append(line).append(" \\\\\n");
        }
        sb.append("\n");
    }

    private void writeFooter(StringBuilder sb) {
        sb.append("\\end{document}\n");
    }

    private void section(StringBuilder sb, String title) {
        sb.append("{\\bfseries\\fontsize{12.9}{12.9}\\selectfont ")
          .append(escapeLatex(title.toUpperCase()))
          .append("}\\par\n");
        sb.append("{\\color{rulegray}\\hrule height 0.45pt}\n");
        sb.append("\\vspace{0.05cm}\n");
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
