package com.perfectjob.exception;

/**
 * The tectonic binary was not found at the configured path. Maps to HTTP 500.
 */
public class TectonicNotFoundException extends ResumeGenerationException {
    public TectonicNotFoundException(String message) {
        super(message);
    }

    public TectonicNotFoundException(String message, Throwable cause) {
        super(message, cause);
    }
}
