package com.perfectjob.repository;

import com.perfectjob.model.Resume;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;

@Repository
public interface ResumeRepository extends JpaRepository<Resume, Long> {

    Page<Resume> findByUserIdOrderByCreatedAtDesc(Long userId, Pageable pageable);

    Optional<Resume> findByIdAndUserId(Long id, Long userId);

    /** Admin: every resume, newest first. */
    Page<Resume> findAllByOrderByCreatedAtDesc(Pageable pageable);

    /** Admin: how many resumes were generated since the given moment (e.g. start of today). */
    long countByCreatedAtAfter(java.time.LocalDateTime moment);

    /** Admin: resume counts grouped by job, most resumes first. Rows are [jobId, jobTitle, count]. */
    @Query(value = "SELECT j.id, j.title, COUNT(r.id) "
            + "FROM resumes r JOIN jobs j ON j.id = r.job_id "
            + "GROUP BY j.id, j.title "
            + "ORDER BY COUNT(r.id) DESC, j.title ASC",
            nativeQuery = true)
    List<Object[]> countResumesByJob();
}
