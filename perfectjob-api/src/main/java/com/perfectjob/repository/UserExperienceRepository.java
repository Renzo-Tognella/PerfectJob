package com.perfectjob.repository;

import com.perfectjob.model.UserExperience;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface UserExperienceRepository extends JpaRepository<UserExperience, Long> {

    List<UserExperience> findByUserIdOrderByDisplayOrderAsc(Long userId);

    void deleteByUserId(Long userId);
}
