package com.perfectjob.service.ingestion;

import java.util.List;


public interface JobSource {

    
    String name();

    
    List<ExternalJob> fetch(int limit);
}
