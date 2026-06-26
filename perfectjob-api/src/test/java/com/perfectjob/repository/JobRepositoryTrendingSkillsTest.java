package com.perfectjob.repository;

import com.perfectjob.model.Company;
import com.perfectjob.model.Job;
import com.perfectjob.model.enums.JobStatus;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.autoconfigure.jdbc.AutoConfigureTestDatabase;
import org.springframework.boot.test.autoconfigure.orm.jpa.DataJpaTest;
import org.springframework.test.context.ActiveProfiles;

import java.util.List;

import static org.assertj.core.api.Assertions.assertThat;

@DataJpaTest
@AutoConfigureTestDatabase(replace = AutoConfigureTestDatabase.Replace.NONE)
@ActiveProfiles("test")
class JobRepositoryTrendingSkillsTest {

    @Autowired
    private JobRepository jobRepository;

    @Autowired
    private CompanyRepository companyRepository;

    @BeforeEach
    void seed() {
        Company company = companyRepository.saveAndFlush(
                Company.builder().name("Acme").slug("acme").build());

        saveJob(company.getId(), "job-1", JobStatus.ACTIVE, List.of("Java", "Spring"));
        saveJob(company.getId(), "job-2", JobStatus.ACTIVE, List.of("Java", "React"));
        saveJob(company.getId(), "job-3", JobStatus.ACTIVE, List.of("Java"));

        saveJob(company.getId(), "job-4", JobStatus.CLOSED, List.of("Python", "Java"));
    }

    private void saveJob(Long companyId, String slug, JobStatus status, List<String> skills) {
        jobRepository.saveAndFlush(Job.builder()
                .title("Title " + slug)
                .slug(slug)
                .companyId(companyId)
                .status(status)
                .skills(new java.util.ArrayList<>(skills))
                .build());
    }

    @Test
    void findTopSkills_countsOnlyActiveJobsOrderedByFrequency() {
        List<Object[]> rows = jobRepository.findTopSkills(10);

        assertThat(rows).isNotEmpty();

        assertThat((String) rows.get(0)[0]).isEqualTo("Java");
        assertThat(((Number) rows.get(0)[1]).longValue()).isEqualTo(3L);


        boolean hasPython = rows.stream().anyMatch(r -> "Python".equals(r[0]));
        assertThat(hasPython).isFalse();
    }

    @Test
    void findTopSkills_respectsLimit() {
        List<Object[]> rows = jobRepository.findTopSkills(1);
        assertThat(rows).hasSize(1);
        assertThat((String) rows.get(0)[0]).isEqualTo("Java");
    }
}
