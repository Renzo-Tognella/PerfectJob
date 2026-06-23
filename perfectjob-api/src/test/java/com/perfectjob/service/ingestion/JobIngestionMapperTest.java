package com.perfectjob.service.ingestion;

import com.perfectjob.model.Job;
import com.perfectjob.model.enums.ContractType;
import com.perfectjob.model.enums.ExperienceLevel;
import com.perfectjob.model.enums.JobStatus;
import com.perfectjob.model.enums.JobType;
import com.perfectjob.model.enums.WorkModel;
import org.junit.jupiter.api.Test;

import java.util.List;

import static org.assertj.core.api.Assertions.assertThat;

class JobIngestionMapperTest {

    private ExternalJob remoteJob() {
        return new ExternalJob("remotive", "123", "Senior Java Developer", "TechCorp",
                "<p>Great <b>role</b></p>", "Worldwide", true, "contract",
                List.of("Java", "Spring", "java"), "http://x");
    }

    @Test
    void toJob_mapsAllFieldsOntoJobSchema() {
        Job job = JobIngestionMapper.toJob(remoteJob(), 7L);

        assertThat(job.getCompanyId()).isEqualTo(7L);
        assertThat(job.getTitle()).isEqualTo("Senior Java Developer");
        assertThat(job.getWorkModel()).isEqualTo(WorkModel.REMOTE);
        assertThat(job.getExperienceLevel()).isEqualTo(ExperienceLevel.SENIOR);
        assertThat(job.getJobType()).isEqualTo(JobType.CONTRACT);
        assertThat(job.getContractType()).isEqualTo(ContractType.PJ);
        assertThat(job.getLocationCity()).isEqualTo("Worldwide");
        assertThat(job.getLocationCountry()).isEqualTo("Remoto");
        assertThat(job.getStatus()).isEqualTo(JobStatus.ACTIVE);
        assertThat(job.getSource()).isEqualTo("remotive");
        assertThat(job.getExternalId()).isEqualTo("123");
        assertThat(job.getExternalUrl()).isEqualTo("http://x");
        assertThat(job.getDescription()).isEqualTo("Great role");
        assertThat(job.getSkills()).containsExactly("Java", "Spring"); // case-insensitive dedupe
        assertThat(job.getSlug()).startsWith("senior-java-developer-remotive-123");
    }

    @Test
    void toJob_nullUrlProducesNullExternalUrl() {
        ExternalJob ext = new ExternalJob("remotive", "456", "Dev", "Corp",
                "desc", "Remote", true, "full_time", List.of(), null);

        Job job = JobIngestionMapper.toJob(ext, 1L);

        assertThat(job.getExternalUrl()).isNull();
    }

    @Test
    void toJob_nonRemoteUsesOnSiteAndBrasil() {
        ExternalJob ext = new ExternalJob("arbeitnow", "slug-1", "Analista", "Acme",
                "desc", "São Paulo", false, "full_time", List.of(), "http://x");

        Job job = JobIngestionMapper.toJob(ext, 1L);

        assertThat(job.getWorkModel()).isEqualTo(WorkModel.ON_SITE);
        assertThat(job.getLocationCountry()).isEqualTo("Brasil");
        assertThat(job.getJobType()).isEqualTo(JobType.FULL_TIME);
    }

    @Test
    void inferExperienceLevel_detectsSeniority() {
        assertThat(JobIngestionMapper.inferExperienceLevel("Senior Backend Engineer")).isEqualTo(ExperienceLevel.SENIOR);
        assertThat(JobIngestionMapper.inferExperienceLevel("Sr. Data Scientist")).isEqualTo(ExperienceLevel.SENIOR);
        assertThat(JobIngestionMapper.inferExperienceLevel("Junior Developer")).isEqualTo(ExperienceLevel.JUNIOR);
        assertThat(JobIngestionMapper.inferExperienceLevel("Software Engineer Intern")).isEqualTo(ExperienceLevel.INTERN);
        assertThat(JobIngestionMapper.inferExperienceLevel("Estágio em Dados")).isEqualTo(ExperienceLevel.INTERN);
        assertThat(JobIngestionMapper.inferExperienceLevel("Tech Lead")).isEqualTo(ExperienceLevel.LEAD);
        assertThat(JobIngestionMapper.inferExperienceLevel("Backend Developer")).isEqualTo(ExperienceLevel.MID);
        assertThat(JobIngestionMapper.inferExperienceLevel(null)).isEqualTo(ExperienceLevel.MID);
    }

    @Test
    void mapJobType_normalisesHints() {
        assertThat(JobIngestionMapper.mapJobType("full_time")).isEqualTo(JobType.FULL_TIME);
        assertThat(JobIngestionMapper.mapJobType("part-time")).isEqualTo(JobType.PART_TIME);
        assertThat(JobIngestionMapper.mapJobType("Contract")).isEqualTo(JobType.CONTRACT);
        assertThat(JobIngestionMapper.mapJobType("freelance")).isEqualTo(JobType.FREELANCE);
        assertThat(JobIngestionMapper.mapJobType("internship")).isEqualTo(JobType.FULL_TIME);
        assertThat(JobIngestionMapper.mapJobType(null)).isEqualTo(JobType.FULL_TIME);
    }

    @Test
    void stripHtml_removesTagsAndDecodesEntities() {
        assertThat(JobIngestionMapper.stripHtml("<p>Hello <b>World</b>&amp; more</p>"))
                .isEqualTo("Hello World & more");
        assertThat(JobIngestionMapper.stripHtml(null)).isNull();
    }

    @Test
    void slugify_normalisesAccentsAndSymbols() {
        assertThat(JobIngestionMapper.slugify("Sênior Developer (Remote)!"))
                .isEqualTo("senior-developer-remote");
    }
}
