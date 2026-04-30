package com.perfectjob.event;

public record ApplicationSubmittedEvent(Long applicationId, Long jobId, Long candidateId) {
}
