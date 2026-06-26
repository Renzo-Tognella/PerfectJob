package com.perfectjob.service.ingestion;

import com.perfectjob.dto.response.IngestionResultResponse;
import com.perfectjob.model.Company;
import com.perfectjob.model.Job;
import com.perfectjob.repository.CompanyRepository;
import com.perfectjob.repository.JobRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.cache.annotation.CacheEvict;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.LinkedHashMap;
import java.util.List;
import java.util.Map;


@Slf4j
@Service
@RequiredArgsConstructor
public class JobIngestionService {

    private final List<JobSource> sources;
    private final JobRepository jobRepository;
    private final CompanyRepository companyRepository;

    @CacheEvict(value = "jobs", allEntries = true)
    @Transactional
    public IngestionResultResponse ingestAll(int limitPerSource) {
        int fetched = 0;
        int created = 0;
        int skipped = 0;
        Map<String, Integer> bySource = new LinkedHashMap<>();

        for (JobSource source : sources) {
            List<ExternalJob> external;
            try {
                external = source.fetch(limitPerSource);
            } catch (Exception e) {
                log.warn("Ingestion source '{}' failed: {}", source.name(), e.getMessage());
                bySource.put(source.name(), 0);
                continue;
            }

            int createdForSource = 0;
            for (ExternalJob ext : external) {
                fetched++;
                if (ext.externalId() == null || ext.title() == null) {
                    skipped++;
                    continue;
                }
                if (jobRepository.existsBySourceAndExternalId(ext.source(), ext.externalId())) {
                    skipped++;
                    continue;
                }
                Long companyId = resolveCompany(ext.companyName());
                Job job = JobIngestionMapper.toJob(ext, companyId);
                jobRepository.save(job);
                created++;
                createdForSource++;
            }
            bySource.put(source.name(), createdForSource);
        }

        log.info("AUDIT: job ingestion finished fetched={} created={} skipped={} bySource={}",
                fetched, created, skipped, bySource);
        return new IngestionResultResponse(fetched, created, skipped, bySource);
    }

    private Long resolveCompany(String name) {
        String companyName = (name == null || name.isBlank()) ? "Empresa Desconhecida" : name.strip();
        String slug = JobIngestionMapper.slugify(companyName);
        if (slug.isEmpty()) {
            slug = "empresa";
        }
        final String finalSlug = slug;
        return companyRepository.findBySlug(finalSlug)
                .map(Company::getId)
                .orElseGet(() -> companyRepository.save(Company.builder()
                        .name(companyName)
                        .slug(finalSlug)
                        .rating(0.0)
                        .ratingCount(0)
                        .build()).getId());
    }
}
