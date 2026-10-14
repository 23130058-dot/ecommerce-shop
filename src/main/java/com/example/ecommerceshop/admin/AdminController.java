package com.example.ecommerceshop.admin;

import com.example.ecommerceshop.admin.AdminDtos.DashboardResponse;
import com.example.ecommerceshop.admin.AdminDtos.UpdateUserStatusRequest;
import com.example.ecommerceshop.admin.AdminDtos.UserPageResponse;
import com.example.ecommerceshop.admin.AdminDtos.UserResponse;
import jakarta.validation.Valid;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.security.oauth2.jwt.Jwt;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PatchMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("/api/admin")
public class AdminController {
    private final AdminService adminService;

    public AdminController(AdminService adminService) {
        this.adminService = adminService;
    }

    @GetMapping("/dashboard")
    public DashboardResponse dashboard() {
        return adminService.getDashboard();
    }

    @GetMapping("/users")
    public UserPageResponse users(
            @RequestParam(required = false) String search,
            @RequestParam(required = false) String role,
            @RequestParam(required = false) String status,
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "10") int size
    ) {
        return adminService.getUsers(search, role, status, page, size);
    }

    @PatchMapping("/users/{id}/status")
    public UserResponse updateUserStatus(@PathVariable long id,
                                         @Valid @RequestBody UpdateUserStatusRequest request,
                                         @AuthenticationPrincipal Jwt jwt) {
        return adminService.updateUserStatus(id, request.status(), jwt.getSubject());
    }
}
