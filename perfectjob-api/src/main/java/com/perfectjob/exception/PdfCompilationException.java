package com.perfectjob.exception;


public class PdfCompilationException extends ResumeGenerationException {
    public PdfCompilationException(String message) {
        super(message);
    }

    public PdfCompilationException(String message, Throwable cause) {
        super(message, cause);
    }
}
