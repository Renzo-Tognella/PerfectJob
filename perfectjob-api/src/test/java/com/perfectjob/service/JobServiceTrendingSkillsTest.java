package com.perfectjob.service;

import com.perfectjob.dto.response.SkillCountResponse;
import com.perfectjob.repository.ApplicationRepository;
import com.perfectjob.repository.CompanyRepository;
import com.perfectjob.repository.JobRepository;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;

import java.util.List;

import static org.assertj.core.api.Assertions.assertThat;
import static org.mockito.Mockito.when;

@ExtendWith(MockitoExtension.class)
class JobServiceTrendingSkillsTest {

    @Mock private JobRepository jobRepository;
    @Mock private CompanyRepository companyRepository;
    @Mock private ApplicationRepository applicationRepository;

    @InjectMocks private JobService jobService;

    @Test
    void getTrendingSkills_mapsRowsToResponses() {
        when(jobRepository.findTopSkills(10)).thenReturn(List.of(
                new Object[]{"Java", 5L},
                new Object[]{"React", 3L}));

        List<SkillCountResponse> skills = jobService.getTrendingSkills(10);

        assertThat(skills).containsExactly(
                new SkillCountResponse("Java", 5L),
                new SkillCountResponse("React", 3L));
    }

    @Test
    void getTrendingSkills_boundsLimit() {
        when(jobRepository.findTopSkills(50)).thenReturn(List.of());

        jobService.getTrendingSkills(9999); // should be clamped to 50

        // verified implicitly: stub matches only when called with 50
        assertThat(jobService.getTrendingSkills(9999)).isEmpty();
    }
}
