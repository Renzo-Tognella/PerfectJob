package com.perfectjob.event;

public record JobPostedEvent(Long jobId, Long companyId, String title) {
}
