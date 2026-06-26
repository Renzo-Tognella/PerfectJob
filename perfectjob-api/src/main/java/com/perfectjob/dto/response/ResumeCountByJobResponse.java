package com.perfectjob.dto.response;


public record ResumeCountByJobResponse(
        Long jobId,
        String jobTitle,
        long resumeCount
) {}
