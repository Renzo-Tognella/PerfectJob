package com.perfectjob.service;

import com.perfectjob.dto.request.SearchJobRequest;
import com.perfectjob.dto.response.JobResponse;
import com.perfectjob.repository.CompanyRepository;
import com.perfectjob.repository.JobRepository;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageImpl;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Pageable;

import java.util.List;
import java.util.Optional;

import static org.assertj.core.api.Assertions.assertThat;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.lenient;
import static org.mockito.Mockito.never;
import static org.mockito.Mockito.verify;

@ExtendWith(MockitoExtension.class)
class JobServiceSearchTest {

    @Mock
    private JobRepository jobRepository;

    @Mock
    private CompanyRepository companyRepository;

    @InjectMocks
    private JobService jobService;

    
    @Test
    void search_withKeyword_usesIndexedSearchAndPropagatesRealTotalCount() {
        Pageable pageable = PageRequest.of(0, 20);
        SearchJobRequest request = keywordRequest("github");


        lenient().when(jobRepository.fullTextSearch(any(), any()))
                .thenReturn(new PageImpl<>(List.of(), pageable, 0L));

        lenient().when(jobRepository.searchFullText("github", pageable))
                .thenReturn(new PageImpl<>(List.of(), pageable, 5L));

        Page<JobResponse> result = jobService.search(request, pageable);

        assertThat(result.getTotalElements()).isEqualTo(5L);
        verify(jobRepository).searchFullText("github", pageable);
        verify(jobRepository, never()).fullTextSearch(any(), any());
    }

    private static SearchJobRequest keywordRequest(String keyword) {
        return new SearchJobRequest(
                Optional.of(keyword),
                Optional.empty(),
                Optional.empty(),
                Optional.empty(),
                Optional.empty()
        );
    }
}
