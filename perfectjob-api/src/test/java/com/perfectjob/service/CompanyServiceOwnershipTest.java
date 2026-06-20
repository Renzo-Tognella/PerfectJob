package com.perfectjob.service;

import com.perfectjob.dto.request.CreateCompanyRequest;
import com.perfectjob.dto.response.CompanyResponse;
import com.perfectjob.exception.ResourceNotFoundException;
import com.perfectjob.model.Company;
import com.perfectjob.model.enums.Role;
import com.perfectjob.repository.CompanyRepository;
import com.perfectjob.security.CurrentUser;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.security.access.AccessDeniedException;

import java.util.Optional;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.*;

@ExtendWith(MockitoExtension.class)
class CompanyServiceOwnershipTest {

    @Mock
    private CompanyRepository companyRepository;

    @InjectMocks
    private CompanyService companyService;

    private CurrentUser admin;
    private CurrentUser owner;
    private CurrentUser other;

    @BeforeEach
    void setUp() {
        admin = new CurrentUser(1L, "admin@test.com", Role.ADMIN);
        owner = new CurrentUser(2L, "owner@test.com", Role.RECRUITER);
        other = new CurrentUser(3L, "other@test.com", Role.RECRUITER);
    }

    @Test
    void update_adminCanUpdateAnyCompany() {
        Company existing = Company.builder()
                .id(10L).name("Acme").slug("acme").ownerUserId(2L)
                .build();
        when(companyRepository.findById(10L)).thenReturn(Optional.of(existing));
        when(companyRepository.existsBySlug("acme-renamed")).thenReturn(false);
        when(companyRepository.save(any(Company.class))).thenAnswer(inv -> inv.getArgument(0));

        CreateCompanyRequest request = new CreateCompanyRequest(
                "Acme Renamed", "acme-renamed", "desc", null, null, null, null, 2020);

        CompanyResponse response = companyService.update(10L, request, admin);
        assertThat(response.name()).isEqualTo("Acme Renamed");
    }

    @Test
    void update_ownerCanUpdateOwnCompany() {
        Company existing = Company.builder()
                .id(10L).name("Acme").slug("acme").ownerUserId(owner.id())
                .build();
        when(companyRepository.findById(10L)).thenReturn(Optional.of(existing));
        when(companyRepository.existsBySlug("acme-renamed")).thenReturn(false);
        when(companyRepository.save(any(Company.class))).thenAnswer(inv -> inv.getArgument(0));

        CreateCompanyRequest request = new CreateCompanyRequest(
                "Acme Renamed", "acme-renamed", "desc", null, null, null, null, 2020);

        CompanyResponse response = companyService.update(10L, request, owner);
        assertThat(response.name()).isEqualTo("Acme Renamed");
    }

    @Test
    void update_otherRecruiterIsDenied() {
        Company existing = Company.builder()
                .id(10L).name("Acme").slug("acme").ownerUserId(owner.id())
                .build();
        when(companyRepository.findById(10L)).thenReturn(Optional.of(existing));

        CreateCompanyRequest request = new CreateCompanyRequest(
                "Acme Renamed", "acme-renamed", "desc", null, null, null, null, 2020);

        assertThatThrownBy(() -> companyService.update(10L, request, other))
                .isInstanceOf(AccessDeniedException.class);

        verify(companyRepository, never()).save(any());
    }

    @Test
    void update_companyWithoutOwnerOnlyAdminCanModify() {
        Company existing = Company.builder()
                .id(10L).name("Acme").slug("acme").ownerUserId(null)
                .build();
        when(companyRepository.findById(10L)).thenReturn(Optional.of(existing));

        CreateCompanyRequest request = new CreateCompanyRequest(
                "Acme Renamed", "acme-renamed", "desc", null, null, null, null, 2020);

        assertThatThrownBy(() -> companyService.update(10L, request, other))
                .isInstanceOf(AccessDeniedException.class);
    }

    @Test
    void delete_adminCanDeleteAnyCompany() {
        Company existing = Company.builder()
                .id(10L).name("Acme").slug("acme").ownerUserId(owner.id())
                .build();
        when(companyRepository.findById(10L)).thenReturn(Optional.of(existing));

        companyService.delete(10L, admin);
        verify(companyRepository).delete(existing);
    }

    @Test
    void delete_ownerCanDeleteOwnCompany() {
        Company existing = Company.builder()
                .id(10L).name("Acme").slug("acme").ownerUserId(owner.id())
                .build();
        when(companyRepository.findById(10L)).thenReturn(Optional.of(existing));

        companyService.delete(10L, owner);
        verify(companyRepository).delete(existing);
    }

    @Test
    void delete_otherRecruiterIsDenied() {
        Company existing = Company.builder()
                .id(10L).name("Acme").slug("acme").ownerUserId(owner.id())
                .build();
        when(companyRepository.findById(10L)).thenReturn(Optional.of(existing));

        assertThatThrownBy(() -> companyService.delete(10L, other))
                .isInstanceOf(AccessDeniedException.class);
        verify(companyRepository, never()).delete(any());
    }

    @Test
    void create_setsOwnerToCurrentUser() {
        when(companyRepository.existsBySlug("new-co")).thenReturn(false);
        when(companyRepository.save(any(Company.class))).thenAnswer(inv -> {
            Company c = inv.getArgument(0);
            c.setId(99L);
            return c;
        });

        CreateCompanyRequest request = new CreateCompanyRequest(
                "New Co", "new-co", "desc", null, null, null, null, 2024);

        CompanyResponse response = companyService.create(request, owner);
        assertThat(response.ownerUserId()).isEqualTo(owner.id());
    }

    @Test
    void update_throwsNotFoundWhenCompanyMissing() {
        when(companyRepository.findById(404L)).thenReturn(Optional.empty());
        CreateCompanyRequest request = new CreateCompanyRequest(
                "X", "x", null, null, null, null, null, null);

        assertThatThrownBy(() -> companyService.update(404L, request, admin))
                .isInstanceOf(ResourceNotFoundException.class);
    }
}
