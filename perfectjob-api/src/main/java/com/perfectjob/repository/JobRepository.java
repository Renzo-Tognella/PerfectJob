package com.perfectjob.repository;

import com.perfectjob.model.Job;
import com.perfectjob.model.enums.JobStatus;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.domain.Specification;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.JpaSpecificationExecutor;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;

@Repository
public interface JobRepository extends JpaRepository<Job, Long>, JpaSpecificationExecutor<Job> {

    Page<Job> findByStatus(JobStatus status, Pageable pageable);

    Page<Job> findByCompanyId(Long companyId, Pageable pageable);

    Optional<Job> findBySlug(String slug);

    boolean existsBySlug(String slug);

    @Query(value = "SELECT * FROM jobs j " +
            "WHERE to_tsvector('portuguese', j.title || ' ' || COALESCE(j.description, '')) " +
            "@@ plainto_tsquery('portuguese', :keyword) " +
            "ORDER BY ts_rank(to_tsvector('portuguese', j.title || ' ' || COALESCE(j.description, '')), " +
            "plainto_tsquery('portuguese', :keyword)) DESC",
            nativeQuery = true)
    Page<Job> fullTextSearch(@Param("keyword") String keyword, Pageable pageable);

    @Query(value = "SELECT * FROM jobs j " +
            "WHERE j.search_vector @@ plainto_tsquery('portuguese', :keyword) " +
            "ORDER BY ts_rank(j.search_vector, plainto_tsquery('portuguese', :keyword)) DESC",
            countQuery = "SELECT COUNT(*) FROM jobs j " +
            "WHERE j.search_vector @@ plainto_tsquery('portuguese', :keyword)",
            nativeQuery = true)
    Page<Job> searchFullText(@Param("keyword") String keyword, Pageable pageable);

    @Query(value = "SELECT j.title FROM jobs j " +
            "WHERE j.title ILIKE CONCAT('%', :prefix, '%') " +
            "OR j.title % :prefix " +
            "GROUP BY j.title " +
            "ORDER BY similarity(j.title, :prefix) DESC " +
            "LIMIT 10",
            nativeQuery = true)
    List<String> suggestTitles(@Param("prefix") String prefix);

    @Query("SELECT j FROM Job j WHERE j.status = 'ACTIVE' AND (j.expiresAt IS NULL OR j.expiresAt > CURRENT_TIMESTAMP)")
    Page<Job> findActiveJobs(Pageable pageable);
}
