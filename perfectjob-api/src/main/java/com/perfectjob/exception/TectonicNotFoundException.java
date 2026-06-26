package com.perfectjob.exception;


public class TectonicNotFoundException extends ResumeGenerationException {
    public TectonicNotFoundException(String message) {
        super(message);
    }

    public TectonicNotFoundException(String message, Throwable cause) {
        super(message, cause);
    }
}
