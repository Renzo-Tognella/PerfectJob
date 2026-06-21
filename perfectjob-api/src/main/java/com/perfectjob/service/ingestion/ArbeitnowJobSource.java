package com.perfectjob.service.ingestion;

import com.fasterxml.jackson.annotation.JsonIgnoreProperties;
import com.fasterxml.jackson.annotation.JsonProperty;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.http.client.SimpleClientHttpRequestFactory;
import org.springframework.stereotype.Component;
import org.springframework.web.client.RestClient;

import java.util.ArrayList;
import java.util.List;

/**
 * Imports jobs from the free Arbeitnow job board API (no API key required).
 * Docs: https://www.arbeitnow.com/api/job-board-api
 */
@Slf4j
@Component
public class ArbeitnowJobSource implements JobSource {

    private final RestClient restClient;

    public ArbeitnowJobSource(
            @Value("${perfectjob.ingestion.sources.arbeitnow.url:https://www.arbeitnow.com/api/job-board-api}") String url) {
        SimpleClientHttpRequestFactory factory = new SimpleClientHttpRequestFactory();
        factory.setConnectTimeout(8000);
        factory.setReadTimeout(20000);
        this.restClient = RestClient.builder().requestFactory(factory).baseUrl(url).build();
    }

    @Override
    public String name() {
        return "arbeitnow";
    }

    @Override
    public List<ExternalJob> fetch(int limit) {
        ArbeitnowResponse response = restClient.get()
                .retrieve()
                .body(ArbeitnowResponse.class);
        List<ExternalJob> jobs = toExternalJobs(response, limit);
        log.info("Arbeitnow returned {} jobs", jobs.size());
        return jobs;
    }

    static List<ExternalJob> toExternalJobs(ArbeitnowResponse response, int limit) {
        List<ExternalJob> jobs = new ArrayList<>();
        if (response == null || response.data() == null) {
            return jobs;
        }
        for (ArbeitnowJob j : response.data()) {
            if (jobs.size() >= limit) {
                break;
            }
            if (j == null || j.title() == null || j.slug() == null) {
                continue;
            }
            String jobType = (j.jobTypes() != null && !j.jobTypes().isEmpty()) ? j.jobTypes().get(0) : null;
            jobs.add(new ExternalJob(
                    "arbeitnow",
                    j.slug(),
                    j.title(),
                    j.companyName(),
                    j.description(),
                    j.location(),
                    j.remote(),
                    jobType,
                    j.tags(),
                    j.url()
            ));
        }
        return jobs;
    }

    @JsonIgnoreProperties(ignoreUnknown = true)
    record ArbeitnowResponse(List<ArbeitnowJob> data) {
    }

    @JsonIgnoreProperties(ignoreUnknown = true)
    record ArbeitnowJob(
            String slug,
            @JsonProperty("company_name") String companyName,
            String title,
            String description,
            boolean remote,
            String location,
            List<String> tags,
            @JsonProperty("job_types") List<String> jobTypes,
            String url
    ) {
    }
}
