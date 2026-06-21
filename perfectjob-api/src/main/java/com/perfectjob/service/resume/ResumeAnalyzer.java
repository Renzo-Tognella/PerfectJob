package com.perfectjob.service.resume;

import com.perfectjob.dto.response.EducationDto;
import com.perfectjob.dto.response.ExperienceDto;
import com.perfectjob.dto.response.ResumeAnalysisResponse;
import org.springframework.stereotype.Component;

import java.time.Year;
import java.util.ArrayList;
import java.util.LinkedHashMap;
import java.util.LinkedHashSet;
import java.util.List;
import java.util.Map;
import java.util.Set;
import java.util.regex.Matcher;
import java.util.regex.Pattern;

/**
 * Deterministic resume (curriculo) analyzer. Extracts structured information —
 * skills, professional experience, education and contact details — from the raw
 * text of a CV. It is intentionally dependency-free and operates on a plain
 * {@link String} so it can be unit-tested in isolation; PDF-to-text conversion
 * lives in {@link PdfTextExtractor}.
 *
 * <p>The parser supports Portuguese and English resumes and degrades gracefully:
 * whatever it cannot confidently parse is simply omitted rather than guessed.
 */
@Component
public class ResumeAnalyzer {

    private static final int MAX_SKILLS = 40;

    /** Canonical skill catalogue. Matching is case-insensitive; the canonical
     *  spelling here is what gets returned. */
    private static final List<String> SKILL_DICTIONARY = List.of(
            // Languages
            "Java", "Kotlin", "Scala", "Groovy", "Python", "JavaScript", "TypeScript",
            "C++", "C#", "C", "Go", "Rust", "Ruby", "PHP", "Swift", "Objective-C",
            "Dart", "R", "MATLAB", "Perl", "Elixir",
            // JVM / backend frameworks
            "Spring Boot", "Spring", "Hibernate", "JPA", "Maven", "Gradle", "Quarkus",
            // JS / frontend
            "Node.js", "Express", "NestJS", "React Native", "React", "Next.js",
            "Angular", "Vue.js", "Vue", "Redux", "jQuery", "Svelte",
            "HTML", "CSS", "Sass", "Tailwind CSS", "Tailwind", "Bootstrap",
            // Other ecosystems
            ".NET", "ASP.NET", "Django", "Flask", "FastAPI", "Laravel",
            "Ruby on Rails", "Rails", "Flutter", "Spring Cloud",
            // Data
            "Pandas", "NumPy", "scikit-learn", "TensorFlow", "PyTorch", "Spark", "Hadoop",
            "SQL", "PostgreSQL", "MySQL", "MariaDB", "Oracle", "SQL Server", "SQLite",
            "MongoDB", "Redis", "Cassandra", "Elasticsearch", "DynamoDB", "Firebase",
            "Kafka", "RabbitMQ", "GraphQL", "gRPC", "REST", "Microservices",
            // Cloud / DevOps
            "AWS", "Azure", "GCP", "Google Cloud", "Docker", "Kubernetes", "Terraform",
            "Ansible", "Jenkins", "CI/CD", "GitHub Actions", "GitLab CI",
            "Git", "GitHub", "GitLab", "Bitbucket", "Linux", "Unix", "Bash", "Shell",
            // Practices / tools
            "Scrum", "Agile", "Kanban", "Jira", "Confluence", "TDD",
            // Design
            "Figma", "Sketch", "Adobe XD", "Photoshop", "Illustrator", "UX/UI", "UX", "UI",
            // Analytics
            "Excel", "Power BI", "Tableau", "Looker",
            // AI / ML
            "Machine Learning", "Deep Learning", "Data Science", "NLP", "Computer Vision",
            // Languages (spoken)
            "Inglês", "English", "Espanhol", "Spanish"
    );

    /** Pre-compiled patterns keyed by canonical skill, longest first so that
     *  compound skills (e.g. "React Native") are matched before their parts. */
    private static final Map<String, Pattern> SKILL_PATTERNS = buildSkillPatterns();

    private static final Pattern EMAIL =
            Pattern.compile("[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\\.[A-Za-z]{2,}");
    private static final Pattern PHONE =
            Pattern.compile("[+(]?\\d[\\d()\\s-]{8,}\\d");
    private static final Pattern LINKEDIN =
            Pattern.compile("(?:https?://)?(?:www\\.)?linkedin\\.com/in/[A-Za-z0-9_-]+/?", Pattern.CASE_INSENSITIVE);
    private static final Pattern GITHUB =
            Pattern.compile("(?:https?://)?(?:www\\.)?github\\.com/[A-Za-z0-9_-]+/?", Pattern.CASE_INSENSITIVE);
    private static final Pattern YEAR = Pattern.compile("(19|20)\\d{2}");

    /** A date range such as "2020 - 2022", "Jan 2020 – Atual", "03/2019 a 12/2021". */
    private static final String TOKEN =
            "(?:[A-Za-zçÇãÃéÉêÊáÁóÓ.]+\\.?\\s*)?(?:\\d{1,2}/)?(?:19|20)\\d{2}";
    private static final String END_TOKEN =
            "(?:" + TOKEN + "|atual|present|presente|current|hoje|o\\s*momento)";
    private static final Pattern DATE_RANGE = Pattern.compile(
            "(" + TOKEN + ")\\s*(?:-|–|—|até|to)\\s*(" + END_TOKEN + ")",
            Pattern.CASE_INSENSITIVE);

    private enum Section { SUMMARY, EXPERIENCE, EDUCATION, SKILLS, OTHER }

    public ResumeAnalysisResponse analyze(String rawText) {
        String text = rawText == null ? "" : rawText.replace("\r\n", "\n").replace("\r", "\n");
        List<String> lines = text.lines().map(String::strip).toList();

        Map<Section, List<String>> sections = splitIntoSections(lines);

        List<ExperienceDto> experiences = parseExperiences(sections.getOrDefault(Section.EXPERIENCE, List.of()));
        List<EducationDto> education = parseEducation(sections.getOrDefault(Section.EDUCATION, List.of()));
        List<String> skills = extractSkills(text, sections.getOrDefault(Section.SKILLS, List.of()));

        return new ResumeAnalysisResponse(
                detectHeadline(lines, sections),
                firstMatch(EMAIL, text),
                extractPhone(text),
                normalizeUrl(firstMatch(LINKEDIN, text)),
                normalizeUrl(firstMatch(GITHUB, text)),
                estimateYearsOfExperience(experiences),
                skills,
                experiences,
                education
        );
    }

    // ---------------------------------------------------------------------
    // Skills
    // ---------------------------------------------------------------------

    public List<String> extractSkills(String fullText, List<String> skillSectionLines) {
        Set<String> found = new LinkedHashSet<>();
        String haystack = fullText == null ? "" : fullText;

        // 1) Dictionary scan over the whole document.
        for (Map.Entry<String, Pattern> entry : SKILL_PATTERNS.entrySet()) {
            if (entry.getValue().matcher(haystack).find()) {
                found.add(entry.getKey());
            }
        }

        // 2) Free tokens listed explicitly in the "Skills" section that the
        //    dictionary may not know about.
        for (String line : skillSectionLines) {
            for (String token : line.split("[,;•·|\\u2022\\t]| - |\\u2013")) {
                String candidate = cleanSkillToken(token);
                if (candidate.isEmpty()) {
                    continue;
                }
                String canonical = canonicalSkill(candidate);
                if (canonical != null) {
                    found.add(canonical);
                } else if (isPlausibleSkill(candidate) && !containsIgnoreCase(found, candidate)) {
                    found.add(candidate);
                }
            }
        }

        return found.stream().limit(MAX_SKILLS).toList();
    }

    private static String cleanSkillToken(String token) {
        return token.strip().replaceAll("^[-•·*\\s]+", "").replaceAll("[\\s.;:]+$", "").strip();
    }

    private static String canonicalSkill(String candidate) {
        for (String skill : SKILL_DICTIONARY) {
            if (skill.equalsIgnoreCase(candidate)) {
                return skill;
            }
        }
        return null;
    }

    private static boolean isPlausibleSkill(String candidate) {
        if (candidate.length() < 2 || candidate.length() > 25) {
            return false;
        }
        if (!candidate.matches("[A-Za-zÀ-ÿ0-9][A-Za-zÀ-ÿ0-9 .+#/-]*")) {
            return false;
        }
        // at most three words
        return candidate.split("\\s+").length <= 3;
    }

    private static boolean containsIgnoreCase(Set<String> set, String value) {
        return set.stream().anyMatch(s -> s.equalsIgnoreCase(value));
    }

    private static Map<String, Pattern> buildSkillPatterns() {
        // Longest skill names first to avoid a sub-skill shadowing a compound one.
        List<String> ordered = new ArrayList<>(SKILL_DICTIONARY);
        ordered.sort((a, b) -> Integer.compare(b.length(), a.length()));
        Map<String, Pattern> map = new LinkedHashMap<>();
        for (String skill : ordered) {
            String quoted = Pattern.quote(skill.toLowerCase());
            // Boundaries treat letters, digits and the symbols "+"/"#" as part of a
            // token, so "Java" is not found inside "JavaScript" and a bare "C" is not
            // found inside "C++"/"C#". "." and "/" are intentionally NOT boundary
            // characters (they are common trailing punctuation), yet skills that
            // contain them ("Node.js", "CI/CD") still match because those characters
            // are part of the quoted literal itself.
            Pattern p = Pattern.compile(
                    "(?<![\\p{L}\\p{N}+#])" + quoted + "(?![\\p{L}\\p{N}+#])",
                    Pattern.CASE_INSENSITIVE);
            map.put(skill, p);
        }
        return map;
    }

    // ---------------------------------------------------------------------
    // Contacts
    // ---------------------------------------------------------------------

    public String extractPhone(String text) {
        if (text == null) {
            return null;
        }
        Matcher m = PHONE.matcher(text);
        while (m.find()) {
            String candidate = m.group().strip();
            long digits = candidate.chars().filter(Character::isDigit).count();
            if (digits >= 10 && digits <= 13) {
                return candidate;
            }
        }
        return null;
    }

    private static String normalizeUrl(String url) {
        if (url == null) {
            return null;
        }
        String trimmed = url.strip().replaceAll("/+$", "");
        if (!trimmed.startsWith("http")) {
            return "https://" + trimmed;
        }
        return trimmed;
    }

    private static String firstMatch(Pattern pattern, String text) {
        Matcher m = pattern.matcher(text);
        return m.find() ? m.group() : null;
    }

    // ---------------------------------------------------------------------
    // Sections
    // ---------------------------------------------------------------------

    private Map<Section, List<String>> splitIntoSections(List<String> lines) {
        Map<Section, List<String>> result = new LinkedHashMap<>();
        for (Section s : Section.values()) {
            result.put(s, new ArrayList<>());
        }
        Section current = Section.SUMMARY;
        for (String line : lines) {
            Section header = matchSectionHeader(line);
            if (header != null) {
                current = header;
                continue;
            }
            if (!line.isBlank()) {
                result.get(current).add(line);
            } else {
                // preserve blank as separator inside experience/education blocks
                result.get(current).add("");
            }
        }
        return result;
    }

    private Section matchSectionHeader(String line) {
        String l = line.toLowerCase().replaceAll("[:#*\\-•\\s]+$", "").strip();
        if (l.isEmpty() || l.length() > 45) {
            return null;
        }
        if (matchesAny(l, "experiência profissional", "experiencia profissional", "experiência",
                "experiencia", "histórico profissional", "historico profissional",
                "professional experience", "work experience", "employment history", "experience")) {
            return Section.EXPERIENCE;
        }
        if (matchesAny(l, "formação acadêmica", "formacao academica", "formação", "formacao",
                "educação", "educacao", "education", "academic background", "escolaridade")) {
            return Section.EDUCATION;
        }
        if (matchesAny(l, "competências", "competencias", "habilidades", "skills",
                "technical skills", "tecnologias", "conhecimentos", "hard skills",
                "competências técnicas", "competencias tecnicas")) {
            return Section.SKILLS;
        }
        if (matchesAny(l, "resumo", "objetivo", "summary", "objective", "perfil",
                "perfil profissional", "about", "sobre")) {
            return Section.SUMMARY;
        }
        return null;
    }

    private static boolean matchesAny(String line, String... headers) {
        for (String h : headers) {
            if (line.equals(h)) {
                return true;
            }
        }
        return false;
    }

    // ---------------------------------------------------------------------
    // Experience
    // ---------------------------------------------------------------------

    public List<ExperienceDto> parseExperiences(List<String> lines) {
        List<ExperienceDto> result = new ArrayList<>();
        String title = null;
        String company = null;
        String startDate = null;
        String endDate = null;
        List<String> description = new ArrayList<>();

        for (String raw : lines) {
            String line = raw.strip();
            Matcher dateMatcher = DATE_RANGE.matcher(line);
            boolean hasDate = dateMatcher.find();

            if (hasDate) {
                // Starting a new entry: flush the previous one.
                if (title != null) {
                    result.add(buildExperience(title, company, startDate, endDate, description));
                    description = new ArrayList<>();
                }
                startDate = dateMatcher.group(1).strip();
                endDate = normalizeEndDate(dateMatcher.group(2).strip());

                String header = line.substring(0, dateMatcher.start()).strip();
                header = header.replaceAll("[|\\-–—]+$", "").strip();
                String[] roleCompany = splitRoleCompany(header);
                title = roleCompany[0];
                company = roleCompany[1];
                if (title == null || title.isBlank()) {
                    // title may be on the previous non-date line already captured as description
                    if (!description.isEmpty()) {
                        String[] rc = splitRoleCompany(description.remove(description.size() - 1));
                        title = rc[0];
                        if (company == null) {
                            company = rc[1];
                        }
                    }
                }
            } else if (line.isBlank()) {
                // blank line ends the current description block but keeps entry open
                continue;
            } else {
                if (title == null) {
                    // header line that precedes the date line
                    String[] rc = splitRoleCompany(line);
                    title = rc[0];
                    company = rc[1];
                } else {
                    description.add(line);
                }
            }
        }
        if (title != null) {
            result.add(buildExperience(title, company, startDate, endDate, description));
        }
        return result;
    }

    private ExperienceDto buildExperience(String title, String company, String start,
                                          String end, List<String> description) {
        String desc = String.join(" ", description).strip();
        return new ExperienceDto(
                emptyToNull(title),
                emptyToNull(company),
                emptyToNull(start),
                emptyToNull(end),
                desc.isEmpty() ? null : desc);
    }

    private static String[] splitRoleCompany(String header) {
        if (header == null || header.isBlank()) {
            return new String[]{null, null};
        }
        String[] separators = {" – ", " — ", " - ", " | ", " @ ", " na ", " at ", ", "};
        for (String sep : separators) {
            int idx = header.indexOf(sep);
            if (idx > 0) {
                String left = header.substring(0, idx).strip();
                String right = header.substring(idx + sep.length()).strip();
                return new String[]{left, right.isEmpty() ? null : right};
            }
        }
        return new String[]{header.strip(), null};
    }

    private static String normalizeEndDate(String end) {
        String lower = end.toLowerCase();
        if (lower.startsWith("atual") || lower.startsWith("present") || lower.startsWith("current")
                || lower.startsWith("hoje") || lower.contains("momento")) {
            return null; // ongoing
        }
        return end;
    }

    private Integer estimateYearsOfExperience(List<ExperienceDto> experiences) {
        int total = 0;
        int currentYear = Year.now().getValue();
        for (ExperienceDto exp : experiences) {
            Integer start = firstYear(exp.startDate());
            if (start == null) {
                continue;
            }
            Integer end = firstYear(exp.endDate());
            int endYear = end == null ? currentYear : end;
            total += Math.max(0, endYear - start);
        }
        return total > 0 ? total : null;
    }

    private static Integer firstYear(String value) {
        if (value == null) {
            return null;
        }
        Matcher m = YEAR.matcher(value);
        return m.find() ? Integer.parseInt(m.group()) : null;
    }

    // ---------------------------------------------------------------------
    // Education
    // ---------------------------------------------------------------------

    public List<EducationDto> parseEducation(List<String> lines) {
        List<EducationDto> result = new ArrayList<>();
        for (String raw : lines) {
            String line = raw.strip();
            if (line.isBlank()) {
                continue;
            }
            EducationDto edu = parseEducationLine(line);
            if (edu != null) {
                result.add(edu);
            }
        }
        return result;
    }

    private EducationDto parseEducationLine(String line) {
        // years
        List<Integer> years = new ArrayList<>();
        Matcher ym = YEAR.matcher(line);
        while (ym.find()) {
            years.add(Integer.parseInt(ym.group()));
        }
        Integer startYear = years.isEmpty() ? null : years.get(0);
        Integer endYear = years.size() >= 2 ? years.get(1) : null;
        if (years.size() == 1) {
            // single year is usually the conclusion year
            startYear = null;
            endYear = years.get(0);
        }

        // strip the date portion (everything from the first 4-digit year)
        String body = line.replaceAll("\\(?(19|20)\\d{2}.*$", "").strip();
        body = body.replaceAll("[|–—,\\-]+$", "").strip();

        String degree = null;
        String field = null;
        String institution = null;

        String[] parts = body.split("\\s[–—|]\\s|\\s-\\s|,\\s| na | at ");
        if (parts.length >= 2) {
            String degreeField = parts[0].strip();
            institution = parts[parts.length - 1].strip();
            int em = indexOfIgnoreCase(degreeField, " em ");
            int in = indexOfIgnoreCase(degreeField, " in ");
            int sep = em >= 0 ? em : in;
            if (sep >= 0) {
                degree = degreeField.substring(0, sep).strip();
                field = degreeField.substring(sep + 4).strip();
            } else {
                degree = degreeField;
            }
        } else if (!body.isBlank()) {
            // single chunk: treat as institution
            institution = body;
        }

        if (institution == null && degree == null && field == null && endYear == null) {
            return null;
        }
        if (institution == null) {
            institution = body.isBlank() ? "—" : body;
        }
        return new EducationDto(institution, emptyToNull(degree), emptyToNull(field), startYear, endYear);
    }

    private static int indexOfIgnoreCase(String haystack, String needle) {
        return haystack.toLowerCase().indexOf(needle.toLowerCase());
    }

    // ---------------------------------------------------------------------
    // Headline
    // ---------------------------------------------------------------------

    private String detectHeadline(List<String> lines, Map<Section, List<String>> sections) {
        List<String> summary = sections.getOrDefault(Section.SUMMARY, List.of());
        // The first line is usually the candidate name; the headline is the next
        // line that looks like a role.
        for (String line : summary) {
            if (line.isBlank()) {
                continue;
            }
            if (looksLikeRole(line) && line.length() <= 80) {
                return line;
            }
        }
        return null;
    }

    private static boolean looksLikeRole(String line) {
        String l = line.toLowerCase();
        String[] roleWords = {"desenvolvedor", "desenvolvedora", "developer", "engenheiro", "engenheira",
                "engineer", "analista", "analyst", "designer", "arquiteto", "architect",
                "gerente", "manager", "consultor", "consultant", "especialista", "specialist",
                "programador", "programmer", "tech lead", "fullstack", "full stack", "full-stack",
                "front-end", "frontend", "back-end", "backend", "devops", "qa", "scientist",
                "cientista", "estagiário", "estagiaria", "intern", "product owner", "po ", "dados",
                "data"};
        for (String w : roleWords) {
            if (l.contains(w)) {
                return true;
            }
        }
        return false;
    }

    private static String emptyToNull(String value) {
        if (value == null) {
            return null;
        }
        String s = value.strip();
        return s.isEmpty() ? null : s;
    }
}
