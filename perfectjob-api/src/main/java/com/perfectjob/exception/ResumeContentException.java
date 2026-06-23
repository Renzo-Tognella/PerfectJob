package com.perfectjob.exception;

/**
 * The LLM returned a response that could not be parsed into the structured content record
 * even after a retry. Maps to HTTP 500.
 */
public class ResumeContentException extends ResumeGenerationException {
    public ResumeContentException(String message) {
        super(message);
    }

    public ResumeContentException(String message, Throwable cause) {
        super(message, cause);
    }
}
