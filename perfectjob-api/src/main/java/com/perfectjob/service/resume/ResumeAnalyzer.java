package com.perfectjob.service.resume;

import com.perfectjob.dto.response.EducationDto;
import com.perfectjob.dto.response.ExperienceDto;
import com.perfectjob.dto.response.LanguageDto;
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


@Component
public class ResumeAnalyzer {

    private static final int MAX_SKILLS = 40;

    
    private static final List<String> SKILL_DICTIONARY = List.of(

            "Java", "Kotlin", "Scala", "Groovy", "Python", "JavaScript", "TypeScript",
            "C++", "C#", "C", "Go", "Rust", "Ruby", "PHP", "Swift", "Objective-C",
            "Dart", "R", "MATLAB", "Perl", "Elixir",

            "Spring Boot", "Spring", "Hibernate", "JPA", "Maven", "Gradle", "Quarkus",

            "Node.js", "Express", "NestJS", "React Native", "React", "Next.js",
            "Angular", "Vue.js", "Vue", "Redux", "jQuery", "Svelte",
            "HTML", "CSS", "Sass", "Tailwind CSS", "Tailwind", "Bootstrap",

            ".NET", "ASP.NET", "Django", "Flask", "FastAPI", "Laravel",
            "Ruby on Rails", "Rails", "Flutter", "Spring Cloud",

            "Pandas", "NumPy", "scikit-learn", "TensorFlow", "PyTorch", "Spark", "Hadoop",
            "SQL", "PostgreSQL", "MySQL", "MariaDB", "Oracle", "SQL Server", "SQLite",
            "MongoDB", "Redis", "Cassandra", "Elasticsearch", "DynamoDB", "Firebase",
            "Kafka", "RabbitMQ", "GraphQL", "gRPC", "REST", "Microservices",

            "AWS", "Azure", "GCP", "Google Cloud", "Docker", "Kubernetes", "Terraform",
            "Ansible", "Jenkins", "CI/CD", "GitHub Actions", "GitLab CI",
            "Git", "GitHub", "GitLab", "Bitbucket", "Linux", "Unix", "Bash", "Shell",

            "Scrum", "Agile", "Kanban", "Jira", "Confluence", "TDD",

            "Figma", "Sketch", "Adobe XD", "Photoshop", "Illustrator", "UX/UI", "UX", "UI",

            "Excel", "Power BI", "Tableau", "Looker",

            "Machine Learning", "Deep Learning", "Data Science", "NLP", "Computer Vision"

    );

    
    private static final Map<String, Pattern> SKILL_PATTERNS = buildSkillPatterns();

    
    private static final Map<String, List<String>> LANGUAGE_ALIASES = Map.ofEntries(
            Map.entry("Inglês", List.of("inglês", "ingles", "english")),
            Map.entry("Espanhol", List.of("espanhol", "spanish", "español", "espanol")),
            Map.entry("Português", List.of("português", "portugues", "portuguese")),
            Map.entry("Francês", List.of("francês", "frances", "french", "français", "francais")),
            Map.entry("Alemão", List.of("alemão", "alemao", "german", "deutsch")),
            Map.entry("Italiano", List.of("italiano", "italian")),
            Map.entry("Mandarim", List.of("mandarim", "mandarin", "chinês", "chines", "chinese")),
            Map.entry("Japonês", List.of("japonês", "japones", "japanese"))
    );

    
    private static final List<Map.Entry<String, String>> LEVEL_KEYWORDS = List.of(
            Map.entry("nativo", "Nativo"), Map.entry("native", "Nativo"), Map.entry("materna", "Nativo"),
            Map.entry("fluente", "Fluente"), Map.entry("fluent", "Fluente"), Map.entry("fluência", "Fluente"),
            Map.entry("avançado", "Avançado"), Map.entry("avancado", "Avançado"), Map.entry("advanced", "Avançado"),
            Map.entry("intermediário", "Intermediário"), Map.entry("intermediario", "Intermediário"),
            Map.entry("intermediate", "Intermediário"),
            Map.entry("básico", "Básico"), Map.entry("basico", "Básico"), Map.entry("basic", "Básico"),
            Map.entry("iniciante", "Básico"), Map.entry("beginner", "Básico")
    );

    private static final Map<String, Pattern> LANGUAGE_PATTERNS = buildLanguagePatterns();

    private static final Pattern EMAIL =
            Pattern.compile("[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\\.[A-Za-z]{2,}");
    private static final Pattern PHONE =
            Pattern.compile("[+(]?\\d[\\d()\\s-]{8,}\\d");
    private static final Pattern LINKEDIN =
            Pattern.compile("(?:https?://)?(?:www\\.)?linkedin\\.com/in/[A-Za-z0-9_-]+/?", Pattern.CASE_INSENSITIVE);
    private static final Pattern GITHUB =
            Pattern.compile("(?:https?://)?(?:www\\.)?github\\.com/[A-Za-z0-9_-]+/?", Pattern.CASE_INSENSITIVE);
    private static final Pattern YEAR = Pattern.compile("(19|20)\\d{2}");

    
    private static final String TOKEN =
            "(?:[A-Za-zçÇãÃéÉêÊáÁóÓ.]+\\.?\\s*)?(?:\\d{1,2}/)?(?:19|20)\\d{2}";
    private static final String END_TOKEN =
            "(?:" + TOKEN + "|atual|present|presente|current|hoje|o\\s*momento)";
    private static final Pattern DATE_RANGE = Pattern.compile(
            "(" + TOKEN + ")\\s*(?:-|–|—|até|to)\\s*(" + END_TOKEN + ")",
            Pattern.CASE_INSENSITIVE);

    private enum Section { SUMMARY, EXPERIENCE, EDUCATION, SKILLS, LANGUAGES, OTHER }

    public ResumeAnalysisResponse analyze(String rawText) {
        String text = rawText == null ? "" : rawText.replace("\r\n", "\n").replace("\r", "\n");
        List<String> lines = text.lines().map(String::strip).toList();

        Map<Section, List<String>> sections = splitIntoSections(lines);

        List<ExperienceDto> experiences = parseExperiences(sections.getOrDefault(Section.EXPERIENCE, List.of()));
        List<EducationDto> education = parseEducation(sections.getOrDefault(Section.EDUCATION, List.of()));
        List<String> skills = extractSkills(text, sections.getOrDefault(Section.SKILLS, List.of()));
        List<LanguageDto> languages = extractLanguages(text);


        if (!languages.isEmpty()) {
            Set<String> langNames = new java.util.HashSet<>();
            for (LanguageDto l : languages) {
                langNames.add(l.name().toLowerCase());
            }
            skills = skills.stream().filter(s -> !langNames.contains(s.toLowerCase())).toList();
        }

        return new ResumeAnalysisResponse(
                detectHeadline(lines, sections),
                firstMatch(EMAIL, text),
                extractPhone(text),
                normalizeUrl(firstMatch(LINKEDIN, text)),
                normalizeUrl(firstMatch(GITHUB, text)),
                estimateYearsOfExperience(experiences),
                skills,
                experiences,
                education,
                languages
        );
    }





    public List<String> extractSkills(String fullText, List<String> skillSectionLines) {
        Set<String> found = new LinkedHashSet<>();
        String haystack = fullText == null ? "" : fullText;


        for (Map.Entry<String, Pattern> entry : SKILL_PATTERNS.entrySet()) {
            if (entry.getValue().matcher(haystack).find()) {
                found.add(entry.getKey());
            }
        }



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

        return candidate.split("\\s+").length <= 3;
    }

    private static boolean containsIgnoreCase(Set<String> set, String value) {
        return set.stream().anyMatch(s -> s.equalsIgnoreCase(value));
    }

    private static Map<String, Pattern> buildSkillPatterns() {

        List<String> ordered = new ArrayList<>(SKILL_DICTIONARY);
        ordered.sort((a, b) -> Integer.compare(b.length(), a.length()));
        Map<String, Pattern> map = new LinkedHashMap<>();
        for (String skill : ordered) {
            String quoted = Pattern.quote(skill.toLowerCase());






            Pattern p = Pattern.compile(
                    "(?<![\\p{L}\\p{N}+#])" + quoted + "(?![\\p{L}\\p{N}+#])",
                    Pattern.CASE_INSENSITIVE);
            map.put(skill, p);
        }
        return map;
    }





    public List<LanguageDto> extractLanguages(String rawText) {
        List<LanguageDto> result = new ArrayList<>();
        if (rawText == null || rawText.isBlank()) {
            return result;
        }
        Map<String, String> byLanguage = new LinkedHashMap<>();
        for (String line : rawText.lines().toList()) {
            if (line.isBlank()) {
                continue;
            }
            String level = detectLevel(line);
            for (Map.Entry<String, Pattern> entry : LANGUAGE_PATTERNS.entrySet()) {
                if (entry.getValue().matcher(line).find()) {
                    String lang = entry.getKey();
                    if (!byLanguage.containsKey(lang)) {
                        byLanguage.put(lang, level);
                    } else if (byLanguage.get(lang) == null && level != null) {
                        byLanguage.put(lang, level);
                    }
                }
            }
        }
        for (Map.Entry<String, String> e : byLanguage.entrySet()) {
            result.add(new LanguageDto(e.getKey(), e.getValue()));
        }
        return result;
    }

    private static String detectLevel(String line) {
        String l = line.toLowerCase();
        for (Map.Entry<String, String> keyword : LEVEL_KEYWORDS) {
            if (l.contains(keyword.getKey())) {
                return keyword.getValue();
            }
        }
        return null;
    }

    private static Map<String, Pattern> buildLanguagePatterns() {
        Map<String, Pattern> map = new LinkedHashMap<>();
        for (Map.Entry<String, List<String>> e : LANGUAGE_ALIASES.entrySet()) {
            StringBuilder alt = new StringBuilder();
            for (String alias : e.getValue()) {
                if (alt.length() > 0) {
                    alt.append("|");
                }
                alt.append(Pattern.quote(alias));
            }
            map.put(e.getKey(), Pattern.compile(
                    "(?<![\\p{L}])(?:" + alt + ")(?![\\p{L}])", Pattern.CASE_INSENSITIVE));
        }
        return map;
    }





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
        if (matchesAny(l, "idiomas", "languages", "línguas", "linguas", "language")) {
            return Section.LANGUAGES;
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

                    if (!description.isEmpty()) {
                        String[] rc = splitRoleCompany(description.remove(description.size() - 1));
                        title = rc[0];
                        if (company == null) {
                            company = rc[1];
                        }
                    }
                }
            } else if (line.isBlank()) {

                continue;
            } else {
                if (title == null) {

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
            return null;
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

        List<Integer> years = new ArrayList<>();
        Matcher ym = YEAR.matcher(line);
        while (ym.find()) {
            years.add(Integer.parseInt(ym.group()));
        }
        Integer startYear = years.isEmpty() ? null : years.get(0);
        Integer endYear = years.size() >= 2 ? years.get(1) : null;
        if (years.size() == 1) {

            startYear = null;
            endYear = years.get(0);
        }


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





    private String detectHeadline(List<String> lines, Map<Section, List<String>> sections) {
        List<String> summary = sections.getOrDefault(Section.SUMMARY, List.of());


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
