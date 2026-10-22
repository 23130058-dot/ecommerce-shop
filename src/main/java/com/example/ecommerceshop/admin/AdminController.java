package com.example.ecommerceshop.admin;

import com.example.ecommerceshop.admin.AdminDtos.DashboardResponse;
import com.example.ecommerceshop.admin.AdminDtos.PageResponse;
import com.example.ecommerceshop.admin.AdminDtos.ProductAdminResponse;
import com.example.ecommerceshop.admin.AdminDtos.RentalAdminDetail;
import com.example.ecommerceshop.admin.AdminDtos.RentalAdminResponse;
import com.example.ecommerceshop.admin.AdminDtos.UpdateProductStatusRequest;
import com.example.ecommerceshop.admin.AdminDtos.UpdateProductRequest;
import com.example.ecommerceshop.admin.AdminDtos.RevenueTrendResponse;
import com.example.ecommerceshop.admin.AdminDtos.UpdateUserRoleRequest;
import com.example.ecommerceshop.admin.AdminDtos.UpdateUserStatusRequest;
import com.example.ecommerceshop.admin.AdminDtos.UserPageResponse;
import com.example.ecommerceshop.admin.AdminDtos.UserResponse;
import jakarta.validation.Valid;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.security.oauth2.jwt.Jwt;
import org.springframework.http.HttpStatus;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PatchMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;
import org.springframework.web.bind.annotation.ResponseStatus;
import org.springframework.web.bind.annotation.PutMapping;
import org.springframework.format.annotation.DateTimeFormat;
import java.time.LocalDate;

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

    @GetMapping("/dashboard/revenue")
    public RevenueTrendResponse revenueTrend(
            @RequestParam @DateTimeFormat(iso=DateTimeFormat.ISO.DATE) LocalDate from,
            @RequestParam @DateTimeFormat(iso=DateTimeFormat.ISO.DATE) LocalDate to) {
        return adminService.getRevenueTrend(from,to);
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

    @PatchMapping("/users/{id}/role")
    public UserResponse updateUserRole(@PathVariable long id,
                                       @Valid @RequestBody UpdateUserRoleRequest request,
                                       @AuthenticationPrincipal Jwt jwt) {
        return adminService.updateUserRole(id, request.role(), jwt.getSubject());
    }

    @GetMapping("/products")
    public PageResponse<ProductAdminResponse> products(
            @RequestParam(required = false) String search,
            @RequestParam(required = false) String status,
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "10") int size
    ) {
        return adminService.getProducts(search, status, page, size);
    }

    @PatchMapping("/products/{id}/status")
    @ResponseStatus(HttpStatus.NO_CONTENT)
    public void updateProductStatus(@PathVariable long id,
                                    @Valid @RequestBody UpdateProductStatusRequest request) {
        adminService.updateProductStatus(id, request.status());
    }

    @PutMapping("/products/{id}")
    @ResponseStatus(HttpStatus.NO_CONTENT)
    public void updateProduct(@PathVariable long id,@Valid @RequestBody UpdateProductRequest request) {
        adminService.updateProduct(id,request);
    }

    @GetMapping("/orders")
    public PageResponse<RentalAdminResponse> orders(
            @RequestParam(required = false) String search,
            @RequestParam(required = false) String status,
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "10") int size
    ) {
        return adminService.getOrders(search, status, page, size);
    }

    @GetMapping("/orders/{id}")
    public RentalAdminDetail order(@PathVariable long id) {
        return adminService.getOrder(id);
    }

    @PatchMapping("/orders/{id}/cancel")
    @ResponseStatus(HttpStatus.NO_CONTENT)
    public void cancelOrder(@PathVariable long id) {
        adminService.cancelPendingOrder(id);
    }
}
