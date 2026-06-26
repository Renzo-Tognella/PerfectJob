package com.perfectjob.dto.response;

import java.util.Map;


public record IngestionResultResponse(
        int fetched,
        int created,
        int skipped,
        Map<String, Integer> bySource
) {
}
