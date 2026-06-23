/**
 * Resume types — mirror the Java records from `ai-resume-generator`:
 *   GenerateResumeRequest(Long jobId)
 *   ResumeResponse(Long id, Long jobId, String jobTitle, String pdfStoragePath, LocalDateTime, LocalDateTime)
 *   ResumeDetailResponse(..., String jobDescription, String latexSource, ...)
 */

export interface GenerateResumeRequest {
  jobId: number;
}

export interface ResumeResponse {
  id: number;
  jobId: number;
  jobTitle: string;
  pdfStoragePath: string;
  createdAt: string;
  updatedAt: string;
}

export interface ResumeDetailResponse {
  id: number;
  jobId: number;
  jobTitle: string;
  jobDescription: string;
  pdfStoragePath: string;
  latexSource: string;
  createdAt: string;
  updatedAt: string;
}
