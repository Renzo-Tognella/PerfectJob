package com.perfectjob.service.resume;

import lombok.extern.slf4j.Slf4j;
import org.apache.pdfbox.Loader;
import org.apache.pdfbox.pdmodel.PDDocument;
import org.apache.pdfbox.text.PDFTextStripper;
import org.springframework.stereotype.Component;

import java.io.IOException;


@Slf4j
@Component
public class PdfTextExtractor {

    public String extract(byte[] pdfBytes) {
        if (pdfBytes == null || pdfBytes.length == 0) {
            throw new IllegalArgumentException("Arquivo PDF vazio");
        }
        try (PDDocument document = Loader.loadPDF(pdfBytes)) {
            PDFTextStripper stripper = new PDFTextStripper();
            stripper.setSortByPosition(true);
            return stripper.getText(document);
        } catch (IOException e) {
            log.warn("Failed to parse uploaded PDF: {}", e.getMessage());
            throw new IllegalArgumentException("Não foi possível ler o PDF enviado. Verifique o arquivo.", e);
        }
    }
}
