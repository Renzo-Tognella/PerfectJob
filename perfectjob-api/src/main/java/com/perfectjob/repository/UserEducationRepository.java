package com.perfectjob.repository;

import com.perfectjob.model.UserEducation;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface UserEducationRepository extends JpaRepository<UserEducation, Long> {

    List<UserEducation> findByUserIdOrderByDisplayOrderAsc(Long userId);

    void deleteByUserId(Long userId);
}
