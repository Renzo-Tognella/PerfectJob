package com.perfectjob.service.ingestion;

import java.util.List;

/**
 * A source of external jobs (e.g. a public jobs API). Implementations are Spring
 * beans; {@link JobIngestionService} receives all of them via constructor
 * injection and ingests from each.
 */
public interface JobSource {

    /** Stable identifier persisted on {@code Job.source} (e.g. "remotive"). */
    String name();

    /**
     * Fetches up to {@code limit} jobs. Implementations should never throw for
     * recoverable network issues silently — the orchestrator handles exceptions
     * per-source so one failing provider does not abort the whole run.
     */
    List<ExternalJob> fetch(int limit);
}
