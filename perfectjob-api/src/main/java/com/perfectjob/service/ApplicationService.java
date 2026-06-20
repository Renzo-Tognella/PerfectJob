package com.perfectjob.service;

import com.perfectjob.dto.request.SubmitApplicationRequest;
import com.perfectjob.dto.response.ApplicationResponse;
import com.perfectjob.event.ApplicationSubmittedEvent;
import com.perfectjob.exception.ResourceNotFoundException;
import com.perfectjob.model.Application;
import com.perfectjob.model.Company;
import com.perfectjob.model.Job;
import com.perfectjob.model.enums.ApplicationStatus;
import com.perfectjob.repository.ApplicationRepository;
import com.perfectjob.repository.CompanyRepository;
import com.perfectjob.repository.JobRepository;
import com.perfectjob.security.CurrentUser;
import com.perfectjob.service.mapper.ApplicationMapper;
import lombok.RequiredArgsConstructor;
import org.springframework.context.ApplicationEventPublisher;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.security.access.AccessDeniedException;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

@Service
@RequiredArgsConstructor
public class ApplicationService {

    private final ApplicationRepository applicationRepository;
    private final JobRepository jobRepository;
    private final CompanyRepository companyRepository;
    private final ApplicationEventPublisher eventPublisher;
    private final NotificationService notificationService;

    @Transactional
    public Application submitApplication(Long candidateId, SubmitApplicationRequest request) {
        Job job = jobRepository.findById(request.jobId())
                .orElseThrow(() -> new ResourceNotFoundException("Job not found with id: " + request.jobId()));

        Company company = companyRepository.findById(job.getCompanyId())
                .orElseThrow(() -> new ResourceNotFoundException("Company not found with id: " + job.getCompanyId()));

        Application application = Application.builder()
                .jobId(request.jobId())
                .candidateId(candidateId)
                .status(ApplicationStatus.PENDING.name())
                .coverLetter(request.coverLetter())
                .resumeUrl(request.resumeUrl())
                .build();

        Application saved = applicationRepository.save(application);

        notificationService.createForCandidate(
                candidateId,
                "Candidatura enviada",
                "Sua candidatura para a vaga '" + job.getTitle() + "' foi enviada com sucesso.",
                "APPLICATION_SUBMITTED"
        );

        eventPublisher.publishEvent(
                new ApplicationSubmittedEvent(
                        saved.getId(),
                        saved.getJobId(),
                        saved.getCandidateId(),
                        company.getOwnerUserId(),
                        job.getTitle(),
                        company.getName()));

        return saved;
    }

    public Page<ApplicationResponse> getMyApplications(Long candidateId, Pageable pageable) {
        return applicationRepository.findByCandidateIdWithDetails(candidateId, pageable)
                .map(ApplicationMapper::toResponse);
    }

    public Page<ApplicationResponse> getMyApplications(Long candidateId, Pageable pageable, CurrentUser currentUser) {
        if (!currentUser.isAdmin() && !candidateId.equals(currentUser.id())) {
            throw new AccessDeniedException("You can only view your own applications");
        }
        return getMyApplications(candidateId, pageable);
    }

    public Page<ApplicationResponse> getRecentApplications(Pageable pageable) {
        return applicationRepository.findAllByOrderByCreatedAtDesc(pageable)
                .map(ApplicationMapper::toResponse);
    }

    public Page<ApplicationResponse> getApplicationsByJob(Long jobId, Pageable pageable, CurrentUser currentUser) {
        Job job = jobRepository.findById(jobId)
                .orElseThrow(() -> new ResourceNotFoundException("Job not found with id: " + jobId));
        Company company = companyRepository.findById(job.getCompanyId())
                .orElseThrow(() -> new ResourceNotFoundException("Company not found with id: " + job.getCompanyId()));
        if (!currentUser.isAdmin() && (company.getOwnerUserId() == null
                || !company.getOwnerUserId().equals(currentUser.id()))) {
            throw new AccessDeniedException("You do not own the company for this job");
        }
        return applicationRepository.findByJobIdWithDetails(jobId, pageable)
                .map(ApplicationMapper::toResponse);
    }

    @Transactional
    public ApplicationResponse updateStatus(Long applicationId, ApplicationStatus newStatus, CurrentUser currentUser) {
        Application application = applicationRepository.findById(applicationId)
                .orElseThrow(() -> new ResourceNotFoundException("Application not found with id: " + applicationId));

        Job job = jobRepository.findById(application.getJobId())
                .orElseThrow(() -> new ResourceNotFoundException("Job not found with id: " + application.getJobId()));

        Company company = companyRepository.findById(job.getCompanyId())
                .orElseThrow(() -> new ResourceNotFoundException("Company not found with id: " + job.getCompanyId()));

        if (!currentUser.isAdmin() && (company.getOwnerUserId() == null
                || !company.getOwnerUserId().equals(currentUser.id()))) {
            throw new AccessDeniedException("You do not own the company for this application");
        }

        application.setStatus(newStatus.name());
        Application saved = applicationRepository.save(application);

        notificationService.notifyApplicationStatusChange(
                application.getCandidateId(),
                job.getTitle(),
                newStatus);

        return ApplicationMapper.toResponse(saved);
    }
}
