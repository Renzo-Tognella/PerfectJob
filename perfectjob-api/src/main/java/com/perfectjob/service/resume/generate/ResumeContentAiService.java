package com.perfectjob.service.resume.generate;

import dev.langchain4j.service.SystemMessage;
import dev.langchain4j.service.V;

/**
 * LangChain4j AiServices typed proxy for LLM structured output.
 * The system prompt is loaded from a classpath resource and instructs the
 * LLM to produce JSON matching the {@link TailoredResumeContent} schema.
 */
public interface ResumeContentAiService {

    @SystemMessage(fromResource = "prompts/resume-content-system-prompt.txt")
    TailoredResumeContent generateTailoredContent(
            @V("profile") String profileJson,
            @V("job") String jobContext
    );
}
