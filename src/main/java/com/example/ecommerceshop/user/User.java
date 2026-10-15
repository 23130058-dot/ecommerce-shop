package com.example.ecommerceshop.user;

import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.GeneratedValue;
import jakarta.persistence.GenerationType;
import jakarta.persistence.Id;
import jakarta.persistence.Table;

import java.time.LocalDate;
import java.time.LocalDateTime;

@Entity
@Table(name = "users")
public class User {
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(name = "full_name")
    private String fullName;

    @Column(unique = true)
    private String email;

    @Column(name = "password_hash")
    private String passwordHash;

    private String phone;
    private LocalDate birthday;
    private String occupation;
    private String bio;
    @Column(name = "avatar_url")
    private String avatarUrl;
    private String address;
    private String district;
    private String city;
    private String role;
    private String status;

    @Column(name = "created_at")
    private LocalDateTime createdAt;

    protected User() {
    }

    public User(String fullName, String email, String passwordHash, String phone) {
        this.fullName = fullName;
        this.email = email;
        this.passwordHash = passwordHash;
        this.phone = phone;
        this.role = "RENTER";
        this.status = "ACTIVE";
        this.createdAt = LocalDateTime.now();
    }

    public Long getId() { return id; }
    public String getFullName() { return fullName; }
    public String getEmail() { return email; }
    public String getPasswordHash() { return passwordHash; }
    public String getPhone() { return phone; }
    public LocalDate getBirthday() { return birthday; }
    public String getOccupation() { return occupation; }
    public String getBio() { return bio; }
    public String getAvatarUrl() { return avatarUrl; }
    public String getAddress() { return address; }
    public String getDistrict() { return district; }
    public String getCity() { return city; }
    public String getRole() { return role; }
    public String getStatus() { return status; }
    public LocalDateTime getCreatedAt() { return createdAt; }

    public void setStatus(String status) { this.status = status; }

    public void updateProfile(String fullName, String email, String phone, LocalDate birthday,
                              String occupation, String bio, String address, String district, String city) {
        this.fullName = fullName;
        this.email = email;
        this.phone = phone;
        this.birthday = birthday;
        this.occupation = occupation;
        this.bio = bio;
        this.address = address;
        this.district = district;
        this.city = city;
    }

    public void setAvatarUrl(String avatarUrl) { this.avatarUrl = avatarUrl; }
    public void setPasswordHash(String passwordHash) { this.passwordHash = passwordHash; }
}
