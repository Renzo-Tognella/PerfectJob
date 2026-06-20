package com.perfectjob.service;

import com.perfectjob.dto.response.JobResponse;
import com.perfectjob.dto.response.SavedJobResponse;
import com.perfectjob.exception.ResourceNotFoundException;
import com.perfectjob.model.Job;
import com.perfectjob.model.SavedJob;
import com.perfectjob.repository.JobRepository;
import com.perfectjob.repository.SavedJobRepository;
import com.perfectjob.security.CurrentUser;
import com.perfectjob.service.mapper.JobMapper;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

@Service
@RequiredArgsConstructor
@Slf4j
public class SavedJobService {

    private final SavedJobRepository savedJobRepository;
    private final JobRepository jobRepository;

    @Transactional
    public SavedJobResponse saveJob(Long jobId, CurrentUser currentUser) {
        Job job = jobRepository.findById(jobId)
                .orElseThrow(() -> new ResourceNotFoundException("Job", "id", jobId));

        SavedJob saved = savedJobRepository.findByUserIdAndJobId(currentUser.id(), jobId)
                .orElseGet(() -> savedJobRepository.save(SavedJob.builder()
                        .userId(currentUser.id())
                        .jobId(jobId)
                        .build()));

        return new SavedJobResponse(
                saved.getId(),
                saved.getUserId(),
                saved.getJobId(),
                job.getSlug(),
                saved.getCreatedAt()
        );
    }

    @Transactional
    public void unsaveJob(Long jobId, CurrentUser currentUser) {
        savedJobRepository.deleteByUserIdAndJobId(currentUser.id(), jobId);
    }

    @Transactional(readOnly = true)
    public Page<JobResponse> getMySavedJobs(CurrentUser currentUser, Pageable pageable) {
        Page<SavedJob> saved = savedJobRepository.findByUserId(currentUser.id(), pageable);
        return saved.map(s -> {
            Job job = jobRepository.findByIdWithCompany(s.getJobId())
                    .orElseThrow(() -> new ResourceNotFoundException("Job", "id", s.getJobId()));
            return JobMapper.toResponse(job);
        });
    }

    @Transactional(readOnly = true)
    public boolean isSaved(Long jobId, CurrentUser currentUser) {
        return savedJobRepository.existsByUserIdAndJobId(currentUser.id(), jobId);
    }
}
