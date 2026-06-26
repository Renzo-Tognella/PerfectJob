package com.perfectjob.config;

import com.perfectjob.service.resume.generate.ResumeContentAiService;
import dev.langchain4j.model.openai.OpenAiChatModel;
import dev.langchain4j.service.AiServices;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;

import java.time.Duration;


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
