package com.perfectjob.repository;

import com.perfectjob.model.Resume;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.Optional;

@Repository
public interface ResumeRepository extends JpaRepository<Resume, Long> {

    Page<Resume> findByUserIdOrderByCreatedAtDesc(Long userId, Pageable pageable);

    Optional<Resume> findByIdAndUserId(Long id, Long userId);
}
