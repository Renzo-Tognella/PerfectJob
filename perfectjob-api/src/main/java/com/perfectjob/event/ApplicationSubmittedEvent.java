package com.perfectjob.event;

public record ApplicationSubmittedEvent(
        Long applicationId,
        Long jobId,
        Long candidateId,
        Long companyOwnerUserId,
        String jobTitle,
        String companyName
) {
}
