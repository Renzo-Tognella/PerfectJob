package com.perfectjob.service.resume.generate;

import com.perfectjob.exception.PdfCompilationException;
import com.perfectjob.exception.TectonicNotFoundException;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Component;

import java.io.IOException;
import java.nio.charset.StandardCharsets;
import java.nio.file.Files;
import java.nio.file.Path;
import java.util.concurrent.TimeUnit;

/**
 * Invokes the tectonic binary via ProcessBuilder to compile `.tex` source to PDF.
 * Reads binary path and timeout from the {@code perfectjob.resume.tectonic.*} config namespace.
 */
@Component
public class TectonicPdfCompiler {

    private final String tectonicPath;
    private final int timeoutSeconds;

    public TectonicPdfCompiler(
            @Value("${perfectjob.resume.tectonic.path:/usr/local/bin/tectonic}") String tectonicPath,
            @Value("${perfectjob.resume.tectonic.compile-timeout-seconds:120}") int timeoutSeconds) {
        this.tectonicPath = tectonicPath;
        this.timeoutSeconds = timeoutSeconds;
    }

    /**
     * Writes the LaTeX source to a temp file, invokes tectonic, and returns the resulting PDF bytes.
     *
     * @throws TectonicNotFoundException if the binary is not present at the configured path
     * @throws PdfCompilationException  on non-zero exit code, timeout, or other I/O error
     */
    public byte[] compile(String latexSource) {
        Path tempDir;
        Path texFile;
        try {
            tempDir = Files.createTempDirectory("tectonic-");
            texFile = tempDir.resolve("resume.tex");
            Files.writeString(texFile, latexSource, StandardCharsets.UTF_8);
        } catch (IOException e) {
            throw new PdfCompilationException("Failed to write temporary .tex file: " + e.getMessage(), e);
        }

        try {
            ProcessBuilder pb = new ProcessBuilder(tectonicPath, "--outdir", tempDir.toString(), texFile.toString())
                    .redirectErrorStream(true);
            Process process;
            try {
                process = pb.start();
            } catch (IOException e) {
                throw new TectonicNotFoundException(
                        "Tectonic binary not found at '" + tectonicPath + "'. Install tectonic and ensure it is on the PATH or configure TECTONIC_PATH.",
                        e);
            }

            boolean finished = process.waitFor(timeoutSeconds, TimeUnit.SECONDS);
            if (!finished) {
                process.destroyForcibly();
                throw new PdfCompilationException("Tectonic compilation timed out after " + timeoutSeconds + "s");
            }

            String output = new String(process.getInputStream().readAllBytes(), StandardCharsets.UTF_8);
            if (process.exitValue() != 0) {
                throw new PdfCompilationException("Tectonic compilation failed (exit "
                        + process.exitValue() + "): "
                        + output.lines().limit(20).reduce((a, b) -> a + "\n" + b).orElse(output));
            }

            Path pdfFile = texFile.toAbsolutePath().getParent()
                    .resolve("resume.pdf");
            byte[] pdfBytes = Files.readAllBytes(pdfFile);
            if (pdfBytes.length == 0) {
                throw new PdfCompilationException("Tectonic produced an empty PDF");
            }
            return pdfBytes;
        } catch (InterruptedException e) {
            Thread.currentThread().interrupt();
            throw new PdfCompilationException("Tectonic compilation interrupted", e);
        } catch (IOException e) {
            throw new PdfCompilationException("Failed to read compiled PDF: " + e.getMessage(), e);
        } finally {
            try {
                Files.walk(tempDir)
                        .sorted((a, b) -> b.compareTo(a))
                        .forEach(p -> { try { Files.deleteIfExists(p); } catch (IOException ignored) {} });
            } catch (IOException ignored) {}
        }
    }
}
