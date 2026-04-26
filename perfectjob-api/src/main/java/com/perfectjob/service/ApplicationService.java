package com.perfectjob.service;

import com.perfectjob.dto.request.SubmitApplicationRequest;
import com.perfectjob.event.ApplicationSubmittedEvent;
import com.perfectjob.model.Application;
import com.perfectjob.repository.ApplicationRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.context.ApplicationEventPublisher;
import org.springframework.stereotype.Service;

@Service
@RequiredArgsConstructor
public class ApplicationService {

    private final ApplicationRepository applicationRepository;
    private final ApplicationEventPublisher eventPublisher;

    public Application submitApplication(Long candidateId, SubmitApplicationRequest request) {
        Application application = Application.builder()
                .jobId(request.jobId())
                .candidateId(candidateId)
                .coverLetter(request.coverLetter())
                .resumeUrl(request.resumeUrl())
                .build();

        Application saved = applicationRepository.save(application);

        eventPublisher.publishEvent(
                new ApplicationSubmittedEvent(saved.getId(), saved.getJobId(), saved.getCandidateId()));

        return saved;
    }
}
