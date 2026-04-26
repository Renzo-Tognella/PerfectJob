package com.perfectjob.service;

import com.perfectjob.dto.request.CreateCompanyRequest;
import com.perfectjob.dto.response.CompanyResponse;
import com.perfectjob.exception.DuplicateResourceException;
import com.perfectjob.exception.ResourceNotFoundException;
import com.perfectjob.model.Company;
import com.perfectjob.repository.CompanyRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.stereotype.Service;

@Service
@RequiredArgsConstructor
public class CompanyService {

    private final CompanyRepository companyRepository;

    public CompanyResponse create(CreateCompanyRequest request) {
        String normalizedSlug = normalizeSlug(request.slug());

        if (companyRepository.existsBySlug(normalizedSlug)) {
            throw new DuplicateResourceException("Company with slug '" + normalizedSlug + "' already exists");
        }

        Company company = Company.builder()
                .name(request.name())
                .slug(normalizedSlug)
                .description(request.description())
                .logoUrl(request.logoUrl())
                .website(request.website())
                .size(request.size())
                .industry(request.industry())
                .foundedYear(request.foundedYear())
                .rating(0.0)
                .ratingCount(0)
                .build();

        Company saved = companyRepository.save(company);
        return toResponse(saved);
    }

    public CompanyResponse findBySlug(String slug) {
        Company company = companyRepository.findBySlug(slug)
                .orElseThrow(() -> new ResourceNotFoundException("Company not found with slug: " + slug));
        return toResponse(company);
    }

    public Page<CompanyResponse> findAll(Pageable pageable) {
        return companyRepository.findAll(pageable).map(this::toResponse);
    }

    public CompanyResponse update(Long id, CreateCompanyRequest request) {
        Company company = companyRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Company not found with id: " + id));

        String normalizedSlug = normalizeSlug(request.slug());

        if (!company.getSlug().equals(normalizedSlug) && companyRepository.existsBySlug(normalizedSlug)) {
            throw new DuplicateResourceException("Company with slug '" + normalizedSlug + "' already exists");
        }

        company.setName(request.name());
        company.setSlug(normalizedSlug);
        company.setDescription(request.description());
        company.setLogoUrl(request.logoUrl());
        company.setWebsite(request.website());
        company.setSize(request.size());
        company.setIndustry(request.industry());
        company.setFoundedYear(request.foundedYear());

        Company updated = companyRepository.save(company);
        return toResponse(updated);
    }

    public void delete(Long id) {
        if (!companyRepository.existsById(id)) {
            throw new ResourceNotFoundException("Company not found with id: " + id);
        }
        companyRepository.deleteById(id);
    }

    private String normalizeSlug(String slug) {
        return slug.toLowerCase().trim().replace(" ", "-");
    }

    private CompanyResponse toResponse(Company company) {
        return new CompanyResponse(
                company.getId(),
                company.getName(),
                company.getSlug(),
                company.getDescription(),
                company.getLogoUrl(),
                company.getWebsite(),
                company.getSize(),
                company.getIndustry(),
                company.getFoundedYear(),
                company.getRating(),
                company.getRatingCount()
        );
    }
}
