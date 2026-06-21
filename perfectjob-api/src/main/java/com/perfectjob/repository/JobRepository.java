package com.perfectjob.repository;

import com.perfectjob.model.Job;
import com.perfectjob.model.enums.JobStatus;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.domain.Specification;
import org.springframework.data.jpa.repository.EntityGraph;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.JpaSpecificationExecutor;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;

@Repository
public interface JobRepository extends JpaRepository<Job, Long>, JpaSpecificationExecutor<Job> {

    @EntityGraph(attributePaths = {"company"})
    Page<Job> findByStatus(JobStatus status, Pageable pageable);

    @EntityGraph(attributePaths = {"company"})
    Page<Job> findByCompanyId(Long companyId, Pageable pageable);

    @EntityGraph(attributePaths = {"company"})
    @Query("SELECT j FROM Job j WHERE j.id = :id")
    Optional<Job> findByIdWithCompany(@Param("id") Long id);

    @EntityGraph(attributePaths = {"company"})
    @Query("SELECT j FROM Job j WHERE j.slug = :slug")
    Optional<Job> findBySlugWithCompany(@Param("slug") String slug);

    Optional<Job> findBySlug(String slug);

    boolean existsBySlug(String slug);

    boolean existsBySourceAndExternalId(String source, String externalId);

    long countByStatus(JobStatus status);

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

    @EntityGraph(attributePaths = {"company"})
    @Query("SELECT j FROM Job j WHERE j.status = 'ACTIVE' AND (j.expiresAt IS NULL OR j.expiresAt > CURRENT_TIMESTAMP)")
    Page<Job> findActiveJobs(Pageable pageable);

    @Query(value = "SELECT js.skill AS skill, COUNT(*) AS cnt " +
            "FROM job_skills js JOIN jobs j ON j.id = js.job_id " +
            "WHERE j.status = 'ACTIVE' " +
            "GROUP BY js.skill " +
            "ORDER BY cnt DESC, js.skill ASC " +
            "LIMIT :limit",
            nativeQuery = true)
    List<Object[]> findTopSkills(@Param("limit") int limit);

    @Override
    @EntityGraph(attributePaths = {"company"})
    Page<Job> findAll(Specification<Job> spec, Pageable pageable);
}
