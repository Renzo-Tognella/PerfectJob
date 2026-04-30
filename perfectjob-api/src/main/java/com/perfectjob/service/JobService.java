package com.perfectjob.service;

import com.perfectjob.dto.request.CreateJobRequest;
import com.perfectjob.dto.request.SearchJobRequest;
import com.perfectjob.dto.response.JobResponse;
import com.perfectjob.event.JobPostedEvent;
import com.perfectjob.model.Company;
import com.perfectjob.model.Job;
import com.perfectjob.model.enums.ExperienceLevel;
import com.perfectjob.model.enums.JobStatus;
import com.perfectjob.model.enums.WorkModel;
import jakarta.persistence.criteria.Predicate;
import com.perfectjob.repository.CompanyRepository;
import com.perfectjob.repository.JobRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.context.ApplicationEventPublisher;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.domain.Specification;
import org.springframework.stereotype.Service;

import java.time.LocalDateTime;
import java.util.List;

@Service
@RequiredArgsConstructor
public class JobService {

    private final JobRepository jobRepository;
    private final CompanyRepository companyRepository;
    private final ApplicationEventPublisher eventPublisher;

    public JobResponse create(CreateJobRequest request) {
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
                .slug(generateSlug(request.title()))
                .status(JobStatus.ACTIVE)
                .build();

        Job saved = jobRepository.save(job);
        eventPublisher.publishEvent(new JobPostedEvent(saved.getId(), saved.getCompanyId(), saved.getTitle()));
        return toResponse(saved);
    }

    public JobResponse findBySlug(String slug) {
        Job job = jobRepository.findBySlug(slug)
                .orElseThrow(() -> new RuntimeException("Job not found"));
        return toResponse(job);
    }

    public Page<JobResponse> search(SearchJobRequest request, Pageable pageable) {
        Page<Job> jobs;

        if (request.keyword().isPresent()) {
            jobs = jobRepository.fullTextSearch(request.keyword().get(), pageable);
        } else {
            Specification<Job> spec = Specification.<Job>where(null)
                    .and(JobSpecification.byWorkModel(request.workModel().orElse(null)))
                    .and(JobSpecification.byExperienceLevel(request.experienceLevel().orElse(null)))
                    .and(JobSpecification.salaryAtLeast(request.minSalary().orElse(null)))
                    .and(JobSpecification.hasSkills(request.skills().orElse(null)));
            jobs = jobRepository.findAll(spec, pageable);
        }

        return jobs.map(this::toResponse);
    }

    public Page<JobResponse> findByCompany(Long companyId, Pageable pageable) {
        return jobRepository.findByCompanyId(companyId, pageable)
                .map(this::toResponse);
    }

    public JobResponse update(Long id, CreateJobRequest request) {
        Job job = jobRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("Job not found"));

        job.setTitle(request.title());
        job.setCompanyId(request.companyId());
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

        Job updated = jobRepository.save(job);
        return toResponse(updated);
    }

    public JobResponse closeJob(Long id) {
        Job job = jobRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("Job not found"));
        job.setStatus(JobStatus.CLOSED);
        Job updated = jobRepository.save(job);
        return toResponse(updated);
    }

    public Page<JobResponse> searchFullText(String keyword, Pageable pageable) {
        return jobRepository.searchFullText(keyword, pageable).map(this::toResponse);
    }

    public List<String> suggestTitles(String prefix) {
        return jobRepository.suggestTitles(prefix);
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

        return jobRepository.findAll(spec, pageable).map(this::toResponse);
    }

    private String generateSlug(String title) {
        String base = title.toLowerCase()
                .replaceAll("[^a-z0-9\\s-]", "")
                .trim()
                .replaceAll("\\s+", "-");
        return base + "-" + System.currentTimeMillis();
    }

    private JobResponse toResponse(Job job) {
        String companyName = companyRepository.findById(job.getCompanyId())
                .map(Company::getName)
                .orElse("Unknown");

        return new JobResponse(
                job.getId(),
                job.getCompanyId(),
                companyName,
                job.getTitle(),
                job.getSlug(),
                job.getDescription(),
                job.getRequirements(),
                job.getBenefits(),
                job.getSalaryMin(),
                job.getSalaryMax(),
                job.getSalaryCurrency(),
                job.getWorkModel(),
                job.getExperienceLevel(),
                job.getJobType(),
                job.getContractType(),
                job.getLocationCity(),
                job.getLocationState(),
                job.getLocationCountry(),
                job.getSkills(),
                job.getStatus(),
                job.getViews(),
                job.getApplicationsCount(),
                job.getCreatedAt(),
                job.getUpdatedAt(),
                job.getExpiresAt()
        );
    }
}
