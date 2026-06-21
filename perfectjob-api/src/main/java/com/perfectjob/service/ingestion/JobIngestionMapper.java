package com.perfectjob.service.ingestion;

import com.perfectjob.model.Job;
import com.perfectjob.model.enums.ContractType;
import com.perfectjob.model.enums.ExperienceLevel;
import com.perfectjob.model.enums.JobStatus;
import com.perfectjob.model.enums.JobType;
import com.perfectjob.model.enums.WorkModel;

import java.util.ArrayList;
import java.util.LinkedHashSet;
import java.util.List;
import java.util.Set;
import java.util.regex.Pattern;

/**
 * Converts a normalized {@link ExternalJob} into a {@code Job} entity that maps
 * one-to-one onto the PerfectJob {@code jobs} table (and {@code job_skills}),
 * inferring the enum fields that external sources don't provide. Pure/static so
 * the mapping rules can be unit-tested without a Spring context.
 */
public final class JobIngestionMapper {

    private static final int MAX_DESCRIPTION = 8000;
    private static final int MAX_SKILLS = 20;
    private static final Pattern HTML_TAG = Pattern.compile("<[^>]+>");
    private static final Pattern WORD = Pattern.compile("[a-z0-9+#]+");

    private JobIngestionMapper() {
    }

    public static Job toJob(ExternalJob ext, Long companyId) {
        return Job.builder()
                .companyId(companyId)
                .title(truncate(ext.title(), 255))
                .slug(buildSlug(ext))
                .description(truncate(stripHtml(ext.descriptionHtml()), MAX_DESCRIPTION))
                .workModel(ext.remote() ? WorkModel.REMOTE : WorkModel.ON_SITE)
                .experienceLevel(inferExperienceLevel(ext.title()))
                .jobType(mapJobType(ext.jobTypeHint()))
                .contractType(ContractType.PJ)
                .locationCity(emptyToNull(ext.location()))
                .locationCountry(ext.remote() ? "Remoto" : "Brasil")
                .skills(cleanTags(ext.tags()))
                .status(JobStatus.ACTIVE)
                .source(ext.source())
                .externalId(ext.externalId())
                .build();
    }

    public static String buildSlug(ExternalJob ext) {
        String base = slugify(ext.title());
        if (base.length() > 150) {
            base = base.substring(0, 150);
        }
        String suffix = slugify(ext.source() + "-" + ext.externalId());
        if (suffix.length() > 90) {
            suffix = suffix.substring(0, 90);
        }
        String slug = (base.isEmpty() ? "vaga" : base) + "-" + suffix;
        return slug.length() > 255 ? slug.substring(0, 255) : slug;
    }

    public static String slugify(String value) {
        if (value == null) {
            return "";
        }
        String normalized = java.text.Normalizer.normalize(value, java.text.Normalizer.Form.NFD)
                .replaceAll("\\p{M}", "");
        return normalized.toLowerCase()
                .replaceAll("[^a-z0-9\\s-]", "")
                .strip()
                .replaceAll("\\s+", "-")
                .replaceAll("-+", "-")
                .replaceAll("^-|-$", "");
    }

    public static String stripHtml(String html) {
        if (html == null) {
            return null;
        }
        String text = HTML_TAG.matcher(html).replaceAll(" ");
        text = text
                .replace("&nbsp;", " ")
                .replace("&amp;", "&")
                .replace("&lt;", "<")
                .replace("&gt;", ">")
                .replace("&quot;", "\"")
                .replace("&#39;", "'")
                .replace("&rsquo;", "'");
        text = text.replaceAll("[ \\t]+", " ").replaceAll("\\s*\\n\\s*", "\n").strip();
        return text.isEmpty() ? null : text;
    }

    public static ExperienceLevel inferExperienceLevel(String title) {
        if (title == null) {
            return ExperienceLevel.MID;
        }
        Set<String> words = new LinkedHashSet<>();
        var m = WORD.matcher(title.toLowerCase());
        while (m.find()) {
            words.add(m.group());
        }
        String lower = title.toLowerCase();
        if (containsAny(words, "intern", "internship", "trainee", "estagio", "estagiario") || lower.contains("estág")) {
            return ExperienceLevel.INTERN;
        }
        if (containsAny(words, "junior", "jr") || lower.contains("júnior")) {
            return ExperienceLevel.JUNIOR;
        }
        if (containsAny(words, "lead", "principal", "staff", "head")) {
            return ExperienceLevel.LEAD;
        }
        if (containsAny(words, "specialist", "especialista")) {
            return ExperienceLevel.SPECIALIST;
        }
        if (containsAny(words, "senior", "sr") || lower.contains("sênior") || lower.contains("senior")) {
            return ExperienceLevel.SENIOR;
        }
        return ExperienceLevel.MID;
    }

    public static JobType mapJobType(String hint) {
        if (hint == null) {
            return JobType.FULL_TIME;
        }
        String normalized = hint.toLowerCase().replaceAll("[^a-z]", "");
        if (normalized.contains("parttime")) {
            return JobType.PART_TIME;
        }
        if (normalized.contains("contract")) {
            return JobType.CONTRACT;
        }
        if (normalized.contains("freelance")) {
            return JobType.FREELANCE;
        }
        return JobType.FULL_TIME;
    }

    private static List<String> cleanTags(List<String> tags) {
        List<String> result = new ArrayList<>();
        Set<String> seen = new LinkedHashSet<>();
        if (tags == null) {
            return result;
        }
        for (String tag : tags) {
            if (tag == null) {
                continue;
            }
            String clean = tag.strip();
            if (clean.length() > 100) {
                clean = clean.substring(0, 100);
            }
            String key = clean.toLowerCase();
            if (!clean.isEmpty() && seen.add(key)) {
                result.add(clean);
            }
            if (result.size() >= MAX_SKILLS) {
                break;
            }
        }
        return result;
    }

    private static boolean containsAny(Set<String> words, String... candidates) {
        for (String c : candidates) {
            if (words.contains(c)) {
                return true;
            }
        }
        return false;
    }

    private static String truncate(String value, int max) {
        if (value == null) {
            return null;
        }
        return value.length() > max ? value.substring(0, max) : value;
    }

    private static String emptyToNull(String value) {
        if (value == null) {
            return null;
        }
        String s = value.strip();
        return s.isEmpty() ? null : s;
    }
}
