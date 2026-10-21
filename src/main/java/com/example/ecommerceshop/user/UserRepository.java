package com.example.ecommerceshop.user;

import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import java.util.Optional;

public interface UserRepository extends JpaRepository<User, Long> {
    Optional<User> findByEmail(String email);
    boolean existsByEmail(String email);

    @Query(value = """
            select u from User u
            where (:searchPattern = '%%'
                or lower(coalesce(u.fullName, '')) like :searchPattern
                or lower(coalesce(u.email, '')) like :searchPattern
                or (:idSearch is not null and u.id = :idSearch))
              and (:role is null or upper(coalesce(u.role, '')) = :role)
              and (:status is null
                or (:status = 'ACTIVE' and upper(coalesce(u.status, '')) = 'ACTIVE')
                or (:status = 'LOCKED' and upper(coalesce(u.status, '')) <> 'ACTIVE'))
            """,
            countQuery = """
            select count(u) from User u
            where (:searchPattern = '%%'
                or lower(coalesce(u.fullName, '')) like :searchPattern
                or lower(coalesce(u.email, '')) like :searchPattern
                or (:idSearch is not null and u.id = :idSearch))
              and (:role is null or upper(coalesce(u.role, '')) = :role)
              and (:status is null
                or (:status = 'ACTIVE' and upper(coalesce(u.status, '')) = 'ACTIVE')
                or (:status = 'LOCKED' and upper(coalesce(u.status, '')) <> 'ACTIVE'))
            """)
    Page<User> searchUsers(@Param("searchPattern") String searchPattern,
                           @Param("idSearch") Long idSearch,
                           @Param("role") String role,
                           @Param("status") String status,
                           Pageable pageable);

    long countByRoleIgnoreCaseAndStatusIgnoreCase(String role, String status);
}
