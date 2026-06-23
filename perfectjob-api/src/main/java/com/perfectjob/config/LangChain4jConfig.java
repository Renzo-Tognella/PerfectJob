package com.perfectjob.config;

import com.perfectjob.service.resume.generate.ResumeContentAiService;
import dev.langchain4j.model.openai.OpenAiChatModel;
import dev.langchain4j.service.AiServices;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;

import java.time.Duration;

/**
 * Manual bean wiring for LangChain4j OpenAI-compatible chat model + AiServices proxy.
 * We use core deps (NOT the Spring Boot starter) because the starter requires
 * Spring Boot 3.5+ and this project is on 3.3.5.
 *
 * <p>Default base URL is OpenRouter (https://openrouter.ai/api/v1) which exposes
 * an OpenAI-compatible API. The model name defaults to DeepSeek and is overridable
 * via environment variables.
 */
@Configuration
public class LangChain4jConfig {

    @Value("${perfectjob.resume.openrouter.base-url:https://openrouter.ai/api/v1}")
    private String baseUrl;

    @Value("${perfectjob.resume.openrouter.api-key:}")
    private String apiKey;

    @Value("${perfectjob.resume.openrouter.model:deepseek/deepseek-chat}")
    private String modelName;

    @Bean
    public OpenAiChatModel openAiChatModel() {
        return OpenAiChatModel.builder()
                .baseUrl(baseUrl)
                .apiKey(apiKey == null ? "" : apiKey)
                .modelName(modelName)
                .temperature(0.7)
                .timeout(Duration.ofSeconds(60))
                .build();
    }

    @Bean
    public ResumeContentAiService resumeContentAiService(OpenAiChatModel openAiChatModel) {
        return AiServices.builder(ResumeContentAiService.class)
                .chatModel(openAiChatModel)
                .build();
    }
}
