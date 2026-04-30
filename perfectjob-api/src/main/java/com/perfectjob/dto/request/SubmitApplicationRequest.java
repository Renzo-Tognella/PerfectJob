package com.perfectjob.dto.request;

import jakarta.validation.constraints.NotNull;

public record SubmitApplicationRequest(
    @NotNull Long jobId,
    String coverLetter,
    String resumeUrl
) {}
