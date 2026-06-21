package com.perfectjob.repository;

import com.perfectjob.model.Application;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.EntityGraph;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.time.LocalDateTime;
import java.util.List;

@Repository
public interface ApplicationRepository extends JpaRepository<Application, Long> {
    List<Application> findByJobId(Long jobId);
    List<Application> findByCandidateId(Long candidateId);

    @EntityGraph(attributePaths = {"job", "job.company", "candidate"})
    @Query("SELECT a FROM Application a WHERE a.candidateId = :candidateId")
    Page<Application> findByCandidateIdWithDetails(@Param("candidateId") Long candidateId, Pageable pageable);

    @EntityGraph(attributePaths = {"job", "job.company", "candidate"})
    @Query("SELECT a FROM Application a WHERE a.jobId = :jobId")
    Page<Application> findByJobIdWithDetails(@Param("jobId") Long jobId, Pageable pageable);

    Page<Application> findAllByOrderByCreatedAtDesc(Pageable pageable);

    long countByCreatedAtAfter(LocalDateTime date);
    long countByCandidateId(Long candidateId);
    long count();
}
