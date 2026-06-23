package com.perfectjob.exception;

/**
 * Tectonic compilation failed (non-zero exit code) or exceeded the configured timeout.
 * Maps to HTTP 500 with the LaTeX error excerpt.
 */
public class PdfCompilationException extends ResumeGenerationException {
    public PdfCompilationException(String message) {
        super(message);
    }

    public PdfCompilationException(String message, Throwable cause) {
        super(message, cause);
    }
}
