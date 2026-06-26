package com.perfectjob.exception;


public class LlmServiceUnavailableException extends ResumeGenerationException {
    public LlmServiceUnavailableException(String message) {
        super(message);
    }

    public LlmServiceUnavailableException(String message, Throwable cause) {
        super(message, cause);
    }
}
