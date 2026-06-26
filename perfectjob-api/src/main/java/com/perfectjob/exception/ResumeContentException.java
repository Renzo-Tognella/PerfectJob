package com.perfectjob.exception;


public class ResumeContentException extends ResumeGenerationException {
    public ResumeContentException(String message) {
        super(message);
    }

    public ResumeContentException(String message, Throwable cause) {
        super(message, cause);
    }
}
