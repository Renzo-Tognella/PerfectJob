package com.perfectjob.service.resume.generate;

import org.junit.jupiter.api.Test;

import java.io.IOException;
import java.io.InputStream;
import java.nio.charset.StandardCharsets;
import java.util.Locale;
import java.util.Set;
import java.util.regex.Pattern;
import java.util.stream.Collectors;

import static org.assertj.core.api.Assertions.assertThat;

class ResumeContentPromptTest {

    private static final String PROMPT_RESOURCE_PATH = "/prompts/resume-content-system-prompt.txt";

    private static final Pattern SUB_RULE_MARKER =
            Pattern.compile("(?m)^\\s+([a-z])\\.\\s+\\*\\*");

    @Test
    void promptFile_isLoadableAsClasspathResource() throws IOException {
        String prompt = loadPrompt();

        assertThat(prompt)
                .as("prompt resource %s must be non-blank", PROMPT_RESOURCE_PATH)
                .isNotBlank();
    }

    @Test
    void promptFile_containsAtLeastThreeDistinctTailoringRules() throws IOException {
        String prompt = loadPrompt();
        String lower = prompt.toLowerCase(Locale.ROOT);

        assertThat(prompt)
                .as("'Adaptação obrigatória à vaga' section header must be present")
                .contains("Adapta")
                .contains("vaga");

        Set<String> distinctSubRuleLabels = SUB_RULE_MARKER.matcher(prompt).results()
                .map(mr -> mr.group(1))
                .collect(Collectors.toSet());
        assertThat(distinctSubRuleLabels)
                .as("prompt must enumerate at least 3 distinct tailoring sub-rules "
                        + "(lettered bullets like 'a.', 'b.', 'c.' in the 'Adaptação' section)")
                .hasSizeGreaterThanOrEqualTo(3);

        long tailoringKeywordHits = java.util.stream.Stream.of("vaga", "reformul", "mencion")
                .filter(lower::contains)
                .count();
        assertThat(tailoringKeywordHits)
                .as("prompt body must mention at least two tailoring-related keywords "
                        + "('vaga', 'reformul', 'mencion') so the rules are visibly about "
                        + "adapting to the target job")
                .isGreaterThanOrEqualTo(2);
    }

    private static String loadPrompt() throws IOException {
        try (InputStream in = ResumeContentPromptTest.class.getResourceAsStream(PROMPT_RESOURCE_PATH)) {
            assertThat(in)
                    .as("classpath resource %s must be present", PROMPT_RESOURCE_PATH)
                    .isNotNull();
            return new String(in.readAllBytes(), StandardCharsets.UTF_8);
        }
    }
}
