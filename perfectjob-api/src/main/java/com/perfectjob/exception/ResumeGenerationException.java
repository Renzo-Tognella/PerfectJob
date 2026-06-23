package com.perfectjob.exception;

/**
 * Base exception for the resume generation pipeline (LLM, LaTeX, tectonic, storage).
 */
public class ResumeGenerationException extends RuntimeException {
    public ResumeGenerationException(String message) {
        super(message);
    }

    public ResumeGenerationException(String message, Throwable cause) {
        super(message, cause);
    }
}
