package com.perfectjob.service.ingestion;

import java.util.List;

/**
 * Provider-agnostic representation of a job fetched from an external API. Each
 * {@link JobSource} maps its own JSON shape into this record; the
 * {@link JobIngestionMapper} then converts it into a {@code Job} entity that
 * matches the PerfectJob schema exactly.
 */
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
