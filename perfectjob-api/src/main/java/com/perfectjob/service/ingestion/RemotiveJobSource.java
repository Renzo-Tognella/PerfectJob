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


@Slf4j
@Component
public class RemotiveJobSource implements JobSource {

    private final RestClient restClient;

    public RemotiveJobSource(
            @Value("${perfectjob.ingestion.sources.remotive.url:https://remotive.com/api/remote-jobs}") String url) {
        SimpleClientHttpRequestFactory factory = new SimpleClientHttpRequestFactory();
        factory.setConnectTimeout(8000);
        factory.setReadTimeout(20000);
        this.restClient = RestClient.builder().requestFactory(factory).baseUrl(url).build();
    }

    @Override
    public String name() {
        return "remotive";
    }

    @Override
    public List<ExternalJob> fetch(int limit) {
        RemotiveResponse response = restClient.get()
                .uri(uriBuilder -> uriBuilder.queryParam("limit", limit).build())
                .retrieve()
                .body(RemotiveResponse.class);
        List<ExternalJob> jobs = toExternalJobs(response);
        log.info("Remotive returned {} jobs", jobs.size());
        return jobs;
    }

    static List<ExternalJob> toExternalJobs(RemotiveResponse response) {
        List<ExternalJob> jobs = new ArrayList<>();
        if (response == null || response.jobs() == null) {
            return jobs;
        }
        for (RemotiveJob j : response.jobs()) {
            if (j == null || j.title() == null) {
                continue;
            }
            jobs.add(new ExternalJob(
                    "remotive",
                    String.valueOf(j.id()),
                    j.title(),
                    j.companyName(),
                    j.description(),
                    j.location(),
                    true,
                    j.jobType(),
                    j.tags(),
                    j.url()
            ));
        }
        return jobs;
    }

    @JsonIgnoreProperties(ignoreUnknown = true)
    record RemotiveResponse(List<RemotiveJob> jobs) {
    }

    @JsonIgnoreProperties(ignoreUnknown = true)
    record RemotiveJob(
            long id,
            String url,
            String title,
            @JsonProperty("company_name") String companyName,
            @JsonProperty("job_type") String jobType,
            @JsonProperty("candidate_required_location") String location,
            String description,
            List<String> tags
    ) {
    }
}
