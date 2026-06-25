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

/**
 * The mobile app ({@code PageResponse} in perfectjob-mobile) and the admin panel both consume
 * Spring's <b>flat</b> Page JSON — top-level {@code totalElements}, {@code totalPages}, {@code number}.
 *
 * <p>{@code @EnableSpringDataWebSupport(pageSerializationMode = VIA_DTO)} nests those fields under a
 * {@code "page"} object, which silently breaks every paginated list in the clients (counts render 0,
 * infinite scroll never advances). This is a full-context test (not {@code @WebMvcTest}) so it exercises
 * the real serialization mode declared on the application class, pinning the flat contract.
 */
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
        // pageSize (5) <= totalElements (12) keeps PageImpl from re-deriving the total down to the
        // content size; content size (5) intentionally differs from total (12) so the assertion
        // proves the *total* count is serialized, not the page's content length.
        Pageable pageable = PageRequest.of(0, 5);
        Page<JobResponse> page = new PageImpl<>(Collections.nCopies(5, sampleJob()), pageable, 12L);
        when(jobService.findActiveJobs(any(Pageable.class))).thenReturn(page);

        mockMvc.perform(get("/v1/jobs/featured"))
                .andExpect(status().isOk())
                // Flat contract that the mobile + admin clients read:
                .andExpect(jsonPath("$.totalElements").value(12))
                .andExpect(jsonPath("$.totalPages").value(3))
                .andExpect(jsonPath("$.number").value(0))
                // Pagination metadata must NOT be nested under a "page" object (VIA_DTO):
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
