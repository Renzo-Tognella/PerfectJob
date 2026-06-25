package com.perfectjob.service;

import com.perfectjob.dto.request.CreateJobRequest;
import com.perfectjob.dto.request.SearchJobRequest;
import com.perfectjob.dto.response.JobResponse;
import com.perfectjob.dto.response.JobStatsResponse;
import com.perfectjob.dto.response.SkillCountResponse;
import com.perfectjob.event.JobPostedEvent;
import com.perfectjob.exception.ResourceNotFoundException;
import com.perfectjob.model.Company;
import com.perfectjob.model.Job;
import com.perfectjob.model.enums.ExperienceLevel;
import com.perfectjob.model.enums.JobStatus;
import com.perfectjob.model.enums.WorkModel;
import jakarta.persistence.criteria.Predicate;
import com.perfectjob.repository.CompanyRepository;
import com.perfectjob.repository.JobRepository;
import com.perfectjob.security.CurrentUser;
import com.perfectjob.service.mapper.JobMapper;
import lombok.RequiredArgsConstructor;
import org.springframework.cache.annotation.CacheEvict;
import org.springframework.cache.annotation.Cacheable;
import org.springframework.context.ApplicationEventPublisher;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.domain.Specification;
import org.springframework.security.access.AccessDeniedException;
import org.springframework.stereotype.Service;

import java.time.LocalDateTime;
import java.util.List;
import org.springframework.transaction.annotation.Transactional;

@Service
@Transactional
@RequiredArgsConstructor
public class JobService {

    private final JobRepository jobRepository;
    private final CompanyRepository companyRepository;
    private final ApplicationEventPublisher eventPublisher;

    @CacheEvict(value = "jobs", allEntries = true)
    public JobResponse create(CreateJobRequest request, CurrentUser currentUser) {
        Company company = companyRepository.findById(request.companyId())
                .orElseThrow(() -> new ResourceNotFoundException("Company not found with id: " + request.companyId()));

        if (!currentUser.isAdmin() && (company.getOwnerUserId() == null
                || !company.getOwnerUserId().equals(currentUser.id()))) {
            throw new AccessDeniedException("You do not own this company");
        }

        Job job = Job.builder()
                .title(request.title())
                .companyId(request.companyId())
                .description(request.description())
                .requirements(request.requirements())
                .benefits(request.benefits())
                .salaryMin(request.salaryMin())
                .salaryMax(request.salaryMax())
                .workModel(request.workModel())
                .experienceLevel(request.experienceLevel())
                .jobType(request.jobType())
                .contractType(request.contractType())
                .locationCity(request.locationCity())
                .locationState(request.locationState())
                .skills(request.skills() != null ? request.skills() : new java.util.ArrayList<>())
                .expiresAt(request.expiresAt())
                .externalUrl(request.externalUrl())
                .slug(generateSlug(request.title()))
                .status(JobStatus.ACTIVE)
                .build();

        Job saved = jobRepository.save(job);
        eventPublisher.publishEvent(new JobPostedEvent(saved.getId(), saved.getCompanyId(), saved.getTitle()));
        return JobMapper.toResponse(saved);
    }

    @Cacheable(value = "jobs", key = "#slug")
    public JobResponse findBySlug(String slug) {
        Job job = jobRepository.findBySlugWithCompany(slug)
                .orElseThrow(() -> new ResourceNotFoundException("Job", "slug", slug));
        return JobMapper.toResponse(job);
    }

    public Page<JobResponse> search(SearchJobRequest request, Pageable pageable) {
        Page<Job> jobs;

        if (request.keyword().isPresent()) {
            // searchFullText uses the indexed search_vector column and declares an explicit
            // countQuery, so totalElements is correct. The legacy fullTextSearch has no countQuery,
            // which made Spring derive a broken count (0) — the "0 vagas encontradas" bug.
            jobs = jobRepository.searchFullText(request.keyword().get(), pageable);
        } else {
            Specification<Job> spec = Specification.<Job>where(null)
                    .and(JobSpecification.byWorkModel(request.workModel().orElse(null)))
                    .and(JobSpecification.byExperienceLevel(request.experienceLevel().orElse(null)))
                    .and(JobSpecification.salaryAtLeast(request.minSalary().orElse(null)))
                    .and(JobSpecification.hasSkills(request.skills().orElse(null)));
            jobs = jobRepository.findAll(spec, pageable);
        }

        return jobs.map(JobMapper::toResponse);
    }

    public Page<JobResponse> findByCompany(Long companyId, Pageable pageable) {
        return jobRepository.findByCompanyId(companyId, pageable)
                .map(JobMapper::toResponse);
    }

    @CacheEvict(value = "jobs", allEntries = true)
    public JobResponse update(Long id, CreateJobRequest request, CurrentUser currentUser) {
        Job job = jobRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("Job not found"));

        assertCanModifyJob(job, currentUser);

        if (request.companyId() != null && !request.companyId().equals(job.getCompanyId())) {
            Company newCompany = companyRepository.findById(request.companyId())
                    .orElseThrow(() -> new ResourceNotFoundException("Company not found with id: " + request.companyId()));
            if (!currentUser.isAdmin() && (newCompany.getOwnerUserId() == null
                    || !newCompany.getOwnerUserId().equals(currentUser.id()))) {
                throw new AccessDeniedException("You do not own the target company");
            }
            job.setCompanyId(request.companyId());
        }

        job.setTitle(request.title());
        job.setDescription(request.description());
        job.setRequirements(request.requirements());
        job.setBenefits(request.benefits());
        job.setSalaryMin(request.salaryMin());
        job.setSalaryMax(request.salaryMax());
        job.setWorkModel(request.workModel());
        job.setExperienceLevel(request.experienceLevel());
        job.setJobType(request.jobType());
        job.setContractType(request.contractType());
        job.setLocationCity(request.locationCity());
        job.setLocationState(request.locationState());
        job.setSkills(request.skills() != null ? request.skills() : new java.util.ArrayList<>());
        job.setExpiresAt(request.expiresAt());
        job.setExternalUrl(request.externalUrl());

        Job updated = jobRepository.save(job);
        return JobMapper.toResponse(updated);
    }

    @CacheEvict(value = "jobs", allEntries = true)
    public JobResponse closeJob(Long id, CurrentUser currentUser) {
        Job job = jobRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("Job not found"));

        assertCanModifyJob(job, currentUser);

        job.setStatus(JobStatus.CLOSED);
        Job updated = jobRepository.save(job);
        return JobMapper.toResponse(updated);
    }

    public Page<JobResponse> searchFullText(String keyword, Pageable pageable) {
        return jobRepository.searchFullText(keyword, pageable).map(JobMapper::toResponse);
    }

    public List<String> suggestTitles(String prefix) {
        return jobRepository.suggestTitles(prefix);
    }

    public List<SkillCountResponse> getTrendingSkills(int limit) {
        int bounded = Math.min(Math.max(limit, 1), 50);
        return jobRepository.findTopSkills(bounded).stream()
                .map(row -> new SkillCountResponse((String) row[0], ((Number) row[1]).longValue()))
                .toList();
    }

    public Page<JobResponse> findActiveJobs(Pageable pageable) {
        return findActiveJobs(null, null, pageable);
    }

    public Page<JobResponse> findActiveJobs(WorkModel workModel, ExperienceLevel experienceLevel, Pageable pageable) {
        Specification<Job> spec = Specification.<Job>where((root, query, cb) -> {
            Predicate active = cb.equal(root.get("status"), JobStatus.ACTIVE);
            Predicate notExpired = cb.or(
                    cb.isNull(root.get("expiresAt")),
                    cb.greaterThan(root.get("expiresAt"), LocalDateTime.now())
            );
            return cb.and(active, notExpired);
        })
        .and(JobSpecification.byWorkModel(workModel))
        .and(JobSpecification.byExperienceLevel(experienceLevel));

        return jobRepository.findAll(spec, pageable).map(JobMapper::toResponse);
    }

    @Cacheable(value = "stats", key = "'global'")
    public JobStatsResponse getStats() {
        long activeJobs = jobRepository.countByStatus(JobStatus.ACTIVE);
        long totalCompanies = companyRepository.count();
        return new JobStatsResponse(activeJobs, totalCompanies);
    }

    private void assertCanModifyJob(Job job, CurrentUser currentUser) {
        if (currentUser.isAdmin()) {
            return;
        }
        Company company = companyRepository.findById(job.getCompanyId()).orElse(null);
        if (company == null || company.getOwnerUserId() == null
                || !company.getOwnerUserId().equals(currentUser.id())) {
            throw new AccessDeniedException("You do not own the company that owns this job");
        }
    }

    private String generateSlug(String title) {
        String base = title.toLowerCase()
                .replaceAll("[^a-z0-9\\s-]", "")
                .trim()
                .replaceAll("\\s+", "-");
        return base + "-" + System.currentTimeMillis();
    }
}
