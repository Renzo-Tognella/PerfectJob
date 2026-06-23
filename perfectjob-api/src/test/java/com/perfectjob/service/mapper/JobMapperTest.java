package com.perfectjob.service.mapper;

import com.fasterxml.jackson.annotation.JsonAutoDetect;
import com.fasterxml.jackson.annotation.JsonTypeInfo;
import com.fasterxml.jackson.annotation.PropertyAccessor;
import com.fasterxml.jackson.databind.ObjectMapper;
import com.fasterxml.jackson.databind.jsontype.BasicPolymorphicTypeValidator;
import com.fasterxml.jackson.datatype.jsr310.JavaTimeModule;
import com.perfectjob.model.Company;
import com.perfectjob.model.Job;
import com.perfectjob.model.enums.ContractType;
import com.perfectjob.model.enums.ExperienceLevel;
import com.perfectjob.model.enums.JobStatus;
import com.perfectjob.model.enums.JobType;
import com.perfectjob.model.enums.WorkModel;
import com.perfectjob.repository.CompanyRepository;
import com.perfectjob.repository.JobRepository;
import org.hibernate.collection.spi.PersistentCollection;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.test.context.ActiveProfiles;
import org.springframework.transaction.annotation.Transactional;

import java.math.BigDecimal;
import java.util.ArrayList;
import java.util.List;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatCode;

@SpringBootTest
@ActiveProfiles("test")
class JobMapperTest {

    @Autowired
    private JobRepository jobRepository;

    @Autowired
    private CompanyRepository companyRepository;

    @Test
    @Transactional
    void toResponse_shouldNotLeakHibernatePersistentCollectionForSkills() {
        Job job = persistJobWithSkills("tech-lead-rails-123",
                List.of("Ruby", "Rails", "PostgreSQL"));

        Job reloaded = jobRepository.findById(job.getId()).orElseThrow();
        assertThat(reloaded.getSkills())
                .as("precondition: skills loaded via JPA must be a Hibernate PersistentCollection")
                .isInstanceOf(PersistentCollection.class);

        var response = JobMapper.toResponse(reloaded);

        assertThat(response.skills())
                .as("JobMapper must materialize the lazy skills collection into a plain List, "
                        + "otherwise downstream cache serialization stashes a Hibernate proxy "
                        + "and subsequent deserialization fails with LazyInitializationException.")
                .isNotInstanceOf(PersistentCollection.class)
                .containsExactlyInAnyOrderElementsOf(List.of("Ruby", "Rails", "PostgreSQL"));
    }

    @Test
    @Transactional
    void toResponse_shouldSurviveCacheSerializerRoundTrip() {
        Job job = persistJobWithSkills("staff-engineer-456",
                List.of("Go", "Kubernetes", "Redis"));

        Job reloaded = jobRepository.findById(job.getId()).orElseThrow();
        var response = JobMapper.toResponse(reloaded);

        ObjectMapper cacheObjectMapper = buildRedisCacheObjectMapper();

        assertThatCode(() -> {
            byte[] bytes = cacheObjectMapper.writeValueAsBytes(response);
            Object roundTripped = cacheObjectMapper.readValue(bytes, Object.class);
            assertThat(roundTripped).isNotNull();
        }).doesNotThrowAnyException();
    }

    private static ObjectMapper buildRedisCacheObjectMapper() {
        ObjectMapper objectMapper = new ObjectMapper();
        objectMapper.registerModule(new JavaTimeModule());
        objectMapper.setVisibility(PropertyAccessor.ALL, JsonAutoDetect.Visibility.ANY);
        objectMapper.activateDefaultTyping(
                BasicPolymorphicTypeValidator.builder().allowIfBaseType(Object.class).build(),
                ObjectMapper.DefaultTyping.EVERYTHING,
                JsonTypeInfo.As.PROPERTY);
        return objectMapper;
    }

    private Job persistJobWithSkills(String slug, List<String> skills) {
        Company company = companyRepository.saveAndFlush(Company.builder()
                .name("TestCo")
                .slug(slug + "-co")
                .build());

        Job job = Job.builder()
                .companyId(company.getId())
                .title("Test Job")
                .slug(slug)
                .description("desc")
                .requirements("reqs")
                .benefits("benefits")
                .salaryMin(BigDecimal.valueOf(5000))
                .salaryMax(BigDecimal.valueOf(10000))
                .workModel(WorkModel.REMOTE)
                .experienceLevel(ExperienceLevel.SENIOR)
                .jobType(JobType.FULL_TIME)
                .contractType(ContractType.CLT)
                .locationCity("Remote")
                .locationState("Remote")
                .locationCountry("BR")
                .status(JobStatus.ACTIVE)
                .skills(new ArrayList<>(skills))
                .build();

        return jobRepository.saveAndFlush(job);
    }
}
