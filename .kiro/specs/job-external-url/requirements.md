# Requirements: job-external-url

## Project Description

PerfectJob candidates cannot reach the original job posting. The ingestion pipeline (Remotive, Arbeitnow) already fetches the source URL into `ExternalJob.url`, but `JobIngestionMapper.toJob()` discards it; the `Job` entity has no URL column, the API does not expose one, and the mobile app has no "open original posting" action. This is critical now that candidates generate tailored resumes instead of applying in-platform — they must apply directly on the source site.

This feature threads the external URL through the entire stack — database, ingestion mapper, entity, API DTO, mobile types, mobile detail screen, and admin job form — so every ingested job carries its original link and candidates can open it with a single tap.

## Requirements

### Requirement 1: External URL persistence on ingestion

**1.1** WHEN an external job source (Remotive or Arbeitnow) provides a URL for a job being ingested, THE system SHALL persist that URL on the corresponding job record.

**1.2** THE system SHALL store the external URL in a nullable column capable of holding values up to 2048 characters.

**1.3** WHEN a job that was previously ingested without a URL is re-ingested and the source now provides one, THE system SHALL NOT overwrite the existing job record's URL field during dedup-update.

### Requirement 2: Manual job URL support

**2.1** WHEN a recruiter creates a job via the admin, THE system SHALL accept an optional URL value.

**2.2** WHEN no URL is provided for a manually-created job, THE system SHALL store a null value for the URL field.

**2.3** WHEN the recruiter submits a URL that is not a well-formed HTTP or HTTPS URL, THE system SHALL reject the submission with a validation error.

### Requirement 3: API exposure

**3.1** WHEN the API returns a single job or a list of jobs, THE response SHALL include the external URL field for every job.

**3.2** WHEN a job has no URL, THE response SHALL represent the external URL field as null.

### Requirement 4: Mobile job detail display

**4.1** WHEN a job detail screen is displayed and the job has a non-null external URL, THE mobile application SHALL show a clearly labeled action ("Ver vaga original") that opens the URL in the device's default browser.

**4.2** WHEN a job detail screen is displayed and the job has a null external URL, THE mobile application SHALL NOT display the "Ver vaga original" action.

**4.3** WHEN the user activates the "Ver vaga original" action, THE mobile application SHALL open the URL externally (in the system browser) and SHALL NOT navigate within the application.

### Requirement 5: Admin job form URL field

**5.1** THE admin job form SHALL provide an input field for the external URL.

**5.2** WHEN an existing job with a URL is opened for editing, THE admin form SHALL pre-populate the URL field with the stored value.

**5.3** WHEN the recruiter submits a URL that is not a well-formed HTTP or HTTPS URL, THE admin form SHALL display a validation error and SHALL NOT submit.

### Requirement 6: Untrusted content handling

**6.1** THE system SHALL treat all external URLs as untrusted display-only values; the server SHALL NOT fetch, proxy, embed, or preview the content at any external URL.

**6.2** THE system SHALL NOT track clicks, analytics, or telemetry on external URL navigation.

## Out of Scope

- URL shortening or proxying.
- Click tracking / analytics on the external link.
- Changes to the full-text search index or search ranking.
- URL availability checking or health monitoring.
- Resume generation (Spec: `ai-resume-generator`).
- Mobile tab rename or broader mobile UI rework (Spec: `mobile-resume-experience`).
- Changes to ingestion scheduling, dedup logic, or source connectors beyond passing the URL through.
