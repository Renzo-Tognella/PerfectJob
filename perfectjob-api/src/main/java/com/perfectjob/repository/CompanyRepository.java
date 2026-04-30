package com.perfectjob.repository;

import com.perfectjob.model.Company;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.Optional;

@Repository
public interface CompanyRepository extends JpaRepository<Company, Long> {

    Optional<Company> findById(Long id);

    Optional<Company> findBySlug(String slug);

    boolean existsBySlug(String slug);
}
