package com.perfectjob.exception;

/**
 * The LLM provider (OpenRouter) is unreachable or returned an HTTP error.
 * Maps to HTTP 502 Bad Gateway.
 */
public class LlmServiceUnavailableException extends ResumeGenerationException {
    public LlmServiceUnavailableException(String message) {
        super(message);
    }

    public LlmServiceUnavailableException(String message, Throwable cause) {
        super(message, cause);
    }
}
