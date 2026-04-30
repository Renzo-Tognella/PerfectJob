package com.perfectjob.dto.response;

import java.util.List;

public record JobSearchResponse(
    List<JobResponse> content,
    int page,
    int size,
    long totalElements
) {}
