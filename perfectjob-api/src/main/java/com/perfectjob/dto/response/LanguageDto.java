package com.perfectjob.dto.response;

/**
 * A spoken language and proficiency level (e.g. "Inglês" / "Avançado").
 * Levels are free-form strings but the UI/analyzer use:
 * Básico, Intermediário, Avançado, Fluente, Nativo.
 */
public record LanguageDto(
        String name,
        String level
) {
}
