package com.perfectjob;

import org.springframework.boot.SpringApplication;
import org.springframework.boot.autoconfigure.SpringBootApplication;
import org.springframework.cache.annotation.EnableCaching;
import org.springframework.data.web.config.EnableSpringDataWebSupport;
import org.springframework.data.web.config.EnableSpringDataWebSupport.PageSerializationMode;
import org.springframework.scheduling.annotation.EnableAsync;
import org.springframework.scheduling.annotation.EnableScheduling;

@SpringBootApplication
@EnableCaching
@EnableAsync
@EnableScheduling
// DIRECT (flat Page JSON: top-level totalElements/totalPages/number) is the contract the
// mobile app and admin panel consume. VIA_DTO nests these under a "page" object and silently
// breaks every paginated list in the clients (counts read 0, infinite scroll stalls).
// Pinned by PageSerializationTest. See .kiro/steering if migrating clients to the nested format.
@EnableSpringDataWebSupport(pageSerializationMode = PageSerializationMode.DIRECT)
public class PerfectJobApplication {

    public static void main(String[] args) {
        SpringApplication.run(PerfectJobApplication.class, args);
    }

}