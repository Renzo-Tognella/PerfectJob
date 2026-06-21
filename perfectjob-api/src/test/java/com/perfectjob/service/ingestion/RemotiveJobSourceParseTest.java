package com.perfectjob.service.ingestion;

import org.junit.jupiter.api.Test;

import java.util.List;

import static org.assertj.core.api.Assertions.assertThat;

class RemotiveJobSourceParseTest {

    @Test
    void toExternalJobs_mapsProviderFields() {
        RemotiveJobSource.RemotiveJob job = new RemotiveJobSource.RemotiveJob(
                123L, "http://remotive/x", "Senior Dev", "TechCorp", "full_time",
                "Worldwide", "<p>desc</p>", List.of("Java", "Spring"));
        RemotiveJobSource.RemotiveResponse response =
                new RemotiveJobSource.RemotiveResponse(List.of(job));

        List<ExternalJob> result = RemotiveJobSource.toExternalJobs(response);

        assertThat(result).hasSize(1);
        ExternalJob ext = result.get(0);
        assertThat(ext.source()).isEqualTo("remotive");
        assertThat(ext.externalId()).isEqualTo("123");
        assertThat(ext.title()).isEqualTo("Senior Dev");
        assertThat(ext.companyName()).isEqualTo("TechCorp");
        assertThat(ext.remote()).isTrue();
        assertThat(ext.jobTypeHint()).isEqualTo("full_time");
        assertThat(ext.tags()).containsExactly("Java", "Spring");
    }

    @Test
    void toExternalJobs_handlesNullResponse() {
        assertThat(RemotiveJobSource.toExternalJobs(null)).isEmpty();
    }
}
