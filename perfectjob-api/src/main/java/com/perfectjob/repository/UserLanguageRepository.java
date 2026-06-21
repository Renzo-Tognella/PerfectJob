package com.perfectjob.repository;

import com.perfectjob.model.UserLanguage;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface UserLanguageRepository extends JpaRepository<UserLanguage, Long> {

    List<UserLanguage> findByUserIdOrderByDisplayOrderAsc(Long userId);

    void deleteByUserId(Long userId);
}
