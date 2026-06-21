package com.perfectjob.dto.response;

/**
 * A skill and how many active jobs require it. Powers the "trending skills" chips
 * and the category grid on the mobile home screen (replacing hardcoded data).
 */
public record SkillCountResponse(
        String skill,
        long count
) {
}
