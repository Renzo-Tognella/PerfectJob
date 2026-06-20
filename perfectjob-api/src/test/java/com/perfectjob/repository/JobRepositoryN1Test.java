package com.perfectjob.repository;

import com.perfectjob.model.Company;
import com.perfectjob.model.Job;
import com.perfectjob.model.enums.JobStatus;
import org.hibernate.Session;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.autoconfigure.jdbc.AutoConfigureTestDatabase;
import org.springframework.boot.test.autoconfigure.orm.jpa.DataJpaTest;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Pageable;
import org.springframework.test.context.ActiveProfiles;

import java.util.ArrayList;
import java.util.List;

import static org.assertj.core.api.Assertions.assertThat;

@DataJpaTest
@AutoConfigureTestDatabase(replace = AutoConfigureTestDatabase.Replace.NONE)
@ActiveProfiles("test")
class JobRepositoryN1Test {

    @Autowired
    private JobRepository jobRepository;

    @Autowired
    private CompanyRepository companyRepository;

    @Autowired
    private jakarta.persistence.EntityManager entityManager;

    private static final int N = 20;

    @BeforeEach
    void seed() {
        Session session = entityManager.unwrap(Session.class);
        session.getSessionFactory().getStatistics().setStatisticsEnabled(true);
        session.getSessionFactory().getStatistics().clear();

        for (int i = 0; i < N; i++) {
            Company company = Company.builder()
                    .name("Company " + i)
                    .slug("company-" + i)
                    .build();
            companyRepository.saveAndFlush(company);

            Job job = Job.builder()
                    .title("Job " + i)
                    .slug("job-" + i)
                    .description("Description " + i)
                    .companyId(company.getId())
                    .status(JobStatus.ACTIVE)
                    .skills(new ArrayList<>())
                    .build();
            jobRepository.saveAndFlush(job);
        }
        entityManager.clear();
        session.getSessionFactory().getStatistics().clear();
    }

    @Test
    void findByStatus_executesAtMostTwoQueriesForNJobs() {
        Pageable pageable = PageRequest.of(0, N);
        Page<Job> page = jobRepository.findByStatus(JobStatus.ACTIVE, pageable);

        assertThat(page.getTotalElements()).isEqualTo(N);

        page.getContent().forEach(j -> j.getCompany().getName());

        long queries = entityManager.unwrap(Session.class)
                .getSessionFactory().getStatistics().getQueryExecutionCount();

        assertThat(queries)
                .as("Expected at most 2 queries (count + content) with EntityGraph")
                .isLessThanOrEqualTo(2);
    }

    @Test
    void findByCompanyId_executesAtMostTwoQueriesForNJobs() {
        Company company = companyRepository.findAll().get(0);

        Pageable pageable = PageRequest.of(0, N);
        Page<Job> page = jobRepository.findByCompanyId(company.getId(), pageable);

        page.getContent().forEach(j -> j.getCompany().getName());

        long queries = entityManager.unwrap(Session.class)
                .getSessionFactory().getStatistics().getQueryExecutionCount();

        assertThat(queries)
                .as("Expected at most 2 queries with EntityGraph")
                .isLessThanOrEqualTo(2);
    }

    @Test
    void findBySlugWithCompany_executesSingleQuery() {
        Job job = jobRepository.findAll().get(0);
        entityManager.clear();
        resetQueryCount();

        Job found = jobRepository.findBySlugWithCompany(job.getSlug()).orElseThrow();
        found.getCompany().getName();

        long queries = entityManager.unwrap(Session.class)
                .getSessionFactory().getStatistics().getQueryExecutionCount();

        assertThat(queries).isEqualTo(1);
    }

    @Test
    void findByIdWithCompany_executesSingleQuery() {
        Job job = jobRepository.findAll().get(0);
        entityManager.clear();
        resetQueryCount();

        Job found = jobRepository.findByIdWithCompany(job.getId()).orElseThrow();
        found.getCompany().getName();

        long queries = entityManager.unwrap(Session.class)
                .getSessionFactory().getStatistics().getQueryExecutionCount();

        assertThat(queries).isEqualTo(1);
    }

    @Test
    void findAllWithSpecification_executesAtMostTwoQueriesWithEntityGraph() {
        Pageable pageable = PageRequest.of(0, N);
        Page<Job> page = jobRepository.findAll(
                (root, query, cb) -> cb.equal(root.get("status"), JobStatus.ACTIVE),
                pageable);

        page.getContent().forEach(j -> j.getCompany().getName());

        long queries = entityManager.unwrap(Session.class)
                .getSessionFactory().getStatistics().getQueryExecutionCount();

        assertThat(queries)
                .as("Expected at most 2 queries with @EntityGraph on findAll(Specification)")
                .isLessThanOrEqualTo(2);
    }

    private void resetQueryCount() {
        entityManager.unwrap(Session.class)
                .getSessionFactory().getStatistics().clear();
    }
}
