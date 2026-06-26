package com.perfectjob.service.ingestion;

import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.boot.autoconfigure.condition.ConditionalOnProperty;
import org.springframework.scheduling.annotation.Scheduled;
import org.springframework.stereotype.Component;


@Slf4j
@Component
@RequiredArgsConstructor
@ConditionalOnProperty(prefix = "perfectjob.ingestion", name = "enabled", havingValue = "true")
public class JobIngestionScheduler {

    private final JobIngestionService ingestionService;

    @Value("${perfectjob.ingestion.limit-per-source:50}")
    private int limitPerSource;

    @Scheduled(cron = "${perfectjob.ingestion.cron:0 0 */6 * * *}")
    public void scheduledIngest() {
        log.info("Starting scheduled job ingestion (limit per source = {})", limitPerSource);
        ingestionService.ingestAll(limitPerSource);
    }
}
