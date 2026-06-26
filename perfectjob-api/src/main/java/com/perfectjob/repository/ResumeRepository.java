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

    
    Page<Resume> findAllByOrderByCreatedAtDesc(Pageable pageable);

    
    long countByCreatedAtAfter(java.time.LocalDateTime moment);

    
    @Query(value = "SELECT j.id, j.title, COUNT(r.id) "
            + "FROM resumes r JOIN jobs j ON j.id = r.job_id "
            + "GROUP BY j.id, j.title "
            + "ORDER BY COUNT(r.id) DESC, j.title ASC",
            nativeQuery = true)
    List<Object[]> countResumesByJob();
}
