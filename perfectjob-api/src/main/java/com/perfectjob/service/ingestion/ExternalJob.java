package com.perfectjob.service.ingestion;

import java.util.List;


public record ExternalJob(
        String source,
        String externalId,
        String title,
        String companyName,
        String descriptionHtml,
        String location,
        boolean remote,
        String jobTypeHint,
        List<String> tags,
        String url
) {
}
