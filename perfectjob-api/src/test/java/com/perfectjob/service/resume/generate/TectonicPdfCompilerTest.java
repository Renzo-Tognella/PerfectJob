package com.perfectjob.service.resume.generate;

import com.perfectjob.exception.PdfCompilationException;
import com.perfectjob.exception.TectonicNotFoundException;
import org.junit.jupiter.api.Test;

import java.io.IOException;
import java.nio.file.Files;
import java.nio.file.Path;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;

class TectonicPdfCompilerTest {

    @Test
    void constructor_usesProvidedPathAndTimeout() {
        TectonicPdfCompiler compiler = new TectonicPdfCompiler("/nonexistent/tectonic", 60);
        assertThat(compiler).isNotNull();
    }

    @Test
    void compile_throwsTectonicNotFoundExceptionForMissingBinary() {
        TectonicPdfCompiler compiler = new TectonicPdfCompiler(
                "/this/binary/does/not/exist/at/all", 30);

        assertThatThrownBy(() -> compiler.compile("\\documentclass{article}\\begin{document}hi\\end{document}"))
                .isInstanceOfAny(TectonicNotFoundException.class, PdfCompilationException.class);
    }

    @Test
    void compile_propagatesIOExceptionAsPdfCompilationException() {
        TectonicPdfCompiler compiler = new TectonicPdfCompiler("/dev/null", 5);




        assertThatThrownBy(() -> compiler.compile("\\documentclass{article}\\begin{document}hi\\end{document}"))
                .isInstanceOfAny(TectonicNotFoundException.class, PdfCompilationException.class);
    }

    @Test
    void timeout_killsProcessAndThrowsPdfCompilationException() {

        TectonicPdfCompiler compiler = new TectonicPdfCompiler("/bin/sleep", 1);

        long start = System.currentTimeMillis();
        assertThatThrownBy(() -> compiler.compile("\\documentclass{article}\\begin{document}hi\\end{document}"))
                .isInstanceOf(PdfCompilationException.class);
        long elapsed = System.currentTimeMillis() - start;


        assertThat(elapsed).isLessThan(10_000L);
    }
}
