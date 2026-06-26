package com.perfectjob.controller;

import com.perfectjob.dto.response.JobResponse;
import com.perfectjob.model.enums.ContractType;
import com.perfectjob.model.enums.ExperienceLevel;
import com.perfectjob.model.enums.JobStatus;
import com.perfectjob.model.enums.JobType;
import com.perfectjob.model.enums.WorkModel;
import com.perfectjob.service.JobService;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.autoconfigure.web.servlet.AutoConfigureMockMvc;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.boot.test.mock.mockito.MockBean;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageImpl;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Pageable;
import org.springframework.test.context.ActiveProfiles;
import org.springframework.test.web.servlet.MockMvc;

import java.math.BigDecimal;
import java.time.LocalDateTime;
import java.util.Collections;
import java.util.List;

import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.when;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.jsonPath;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;


@SpringBootTest
@ActiveProfiles("test")
@AutoConfigureMockMvc(addFilters = false)
class PageSerializationTest {

    @Autowired
    private MockMvc mockMvc;

    @MockBean
    private JobService jobService;

    @Test
    void pageResponse_serializesPaginationMetadataFlat_notNestedUnderPageObject() throws Exception {



        Pageable pageable = PageRequest.of(0, 5);
        Page<JobResponse> page = new PageImpl<>(Collections.nCopies(5, sampleJob()), pageable, 12L);
        when(jobService.findActiveJobs(any(Pageable.class))).thenReturn(page);

        mockMvc.perform(get("/v1/jobs/featured"))
                .andExpect(status().isOk())

                .andExpect(jsonPath("$.totalElements").value(12))
                .andExpect(jsonPath("$.totalPages").value(3))
                .andExpect(jsonPath("$.number").value(0))

                .andExpect(jsonPath("$.page").doesNotExist());
    }

    private static JobResponse sampleJob() {
        return new JobResponse(
                1L, 1L, "TechCorp", "Dev Job", "dev-job-123",
                "Description", "Requirements", "Benefits",
                BigDecimal.valueOf(5000), BigDecimal.valueOf(10000), "BRL",
                WorkModel.REMOTE, ExperienceLevel.MID, JobType.FULL_TIME, ContractType.CLT,
                "São Paulo", "SP", "BR",
                List.of("Java", "Spring"),
                JobStatus.ACTIVE, 10, 3,
                LocalDateTime.now(), LocalDateTime.now(), null,
                "https://remotive.com/job/123"
        );
    }
}
