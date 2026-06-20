package com.perfectjob.service;

import com.perfectjob.dto.request.CreateCompanyRequest;
import com.perfectjob.dto.response.CompanyResponse;
import com.perfectjob.exception.DuplicateResourceException;
import com.perfectjob.exception.ResourceNotFoundException;
import com.perfectjob.model.Company;
import com.perfectjob.repository.CompanyRepository;
import com.perfectjob.security.CurrentUser;
import lombok.RequiredArgsConstructor;
import org.springframework.cache.annotation.CacheEvict;
import org.springframework.cache.annotation.Cacheable;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.security.access.AccessDeniedException;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

@Service
@Transactional
@RequiredArgsConstructor
public class CompanyService {

    private final CompanyRepository companyRepository;

    @CacheEvict(value = "companies", allEntries = true)
    public CompanyResponse create(CreateCompanyRequest request, CurrentUser currentUser) {
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
                .ownerUserId(currentUser.id())
                .build();

        Company saved = companyRepository.save(company);
        return toResponse(saved);
    }

    @Cacheable(value = "companies", key = "#slug")
    public CompanyResponse findBySlug(String slug) {
        Company company = companyRepository.findBySlug(slug)
                .orElseThrow(() -> new ResourceNotFoundException("Company not found with slug: " + slug));
        return toResponse(company);
    }

    public Page<CompanyResponse> findAll(Pageable pageable) {
        return companyRepository.findAll(pageable).map(this::toResponse);
    }

    @CacheEvict(value = "companies", allEntries = true)
    public CompanyResponse update(Long id, CreateCompanyRequest request, CurrentUser currentUser) {
        Company company = companyRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Company not found with id: " + id));

        assertCanModify(company, currentUser);

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

    @CacheEvict(value = "companies", allEntries = true)
    public void delete(Long id, CurrentUser currentUser) {
        Company company = companyRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Company not found with id: " + id));

        assertCanModify(company, currentUser);
        companyRepository.delete(company);
    }

    private void assertCanModify(Company company, CurrentUser currentUser) {
        if (currentUser.isAdmin()) {
            return;
        }
        if (company.getOwnerUserId() == null || !company.getOwnerUserId().equals(currentUser.id())) {
            throw new AccessDeniedException("You do not own this company");
        }
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
                company.getRatingCount(),
                company.getOwnerUserId()
        );
    }
}
