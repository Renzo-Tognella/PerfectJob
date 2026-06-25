package com.perfectjob.dto.response;

/** How many resumes (currículos) were generated for a given job. Admin dashboard breakdown. */
public record ResumeCountByJobResponse(
        Long jobId,
        String jobTitle,
        long resumeCount
) {}
