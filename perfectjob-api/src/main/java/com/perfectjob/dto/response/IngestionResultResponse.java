package com.perfectjob.dto.response;

import java.util.Map;

/**
 * Summary of a job-ingestion run.
 *
 * @param fetched  total jobs returned by all sources
 * @param created  new jobs persisted
 * @param skipped  jobs ignored (duplicates or invalid)
 * @param bySource number of jobs created per source name
 */
public record IngestionResultResponse(
        int fetched,
        int created,
        int skipped,
        Map<String, Integer> bySource
) {
}
