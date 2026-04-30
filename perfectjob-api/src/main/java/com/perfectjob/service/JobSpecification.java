package com.perfectjob.service;

import com.perfectjob.model.Job;
import com.perfectjob.model.enums.ExperienceLevel;
import com.perfectjob.model.enums.WorkModel;
import jakarta.persistence.criteria.Join;
import jakarta.persistence.criteria.Predicate;
import org.springframework.data.jpa.domain.Specification;

import java.math.BigDecimal;
import java.util.List;

public class JobSpecification {

    public static Specification<Job> byWorkModel(WorkModel workModel) {
        return (root, query, cb) -> {
            if (workModel == null) {
                return cb.conjunction();
            }
            return cb.equal(root.get("workModel"), workModel);
        };
    }

    public static Specification<Job> byExperienceLevel(ExperienceLevel experienceLevel) {
        return (root, query, cb) -> {
            if (experienceLevel == null) {
                return cb.conjunction();
            }
            return cb.equal(root.get("experienceLevel"), experienceLevel);
        };
    }

    public static Specification<Job> salaryAtLeast(BigDecimal minSalary) {
        return (root, query, cb) -> {
            if (minSalary == null) {
                return cb.conjunction();
            }
            Predicate maxNotNullAndGe = cb.and(
                    cb.isNotNull(root.get("salaryMax")),
                    cb.greaterThanOrEqualTo(root.get("salaryMax"), minSalary)
            );
            Predicate minNotNullAndGe = cb.and(
                    cb.isNotNull(root.get("salaryMin")),
                    cb.greaterThanOrEqualTo(root.get("salaryMin"), minSalary)
            );
            return cb.or(maxNotNullAndGe, minNotNullAndGe);
        };
    }

    public static Specification<Job> hasSkills(List<String> skills) {
        return (root, query, cb) -> {
            if (skills == null || skills.isEmpty()) {
                return cb.conjunction();
            }
            query.distinct(true);
            Join<Job, String> skillJoin = root.join("skills");
            return skillJoin.in(skills);
        };
    }
}
