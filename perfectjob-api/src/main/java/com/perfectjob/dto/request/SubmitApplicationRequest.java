package com.perfectjob.dto.request;

import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Pattern;
import jakarta.validation.constraints.Size;

public record SubmitApplicationRequest(
    @NotNull Long jobId,
    @Size(max = 5000) String coverLetter,
    @Size(max = 2048)
    @Pattern(regexp = "^(https?://).*", message = "resumeUrl deve ser uma URL válida") String resumeUrl
) {}
