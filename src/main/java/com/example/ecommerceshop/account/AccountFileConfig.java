package com.example.ecommerceshop.account;

import org.springframework.beans.factory.annotation.Value;
import org.springframework.context.annotation.Configuration;
import org.springframework.web.servlet.config.annotation.ResourceHandlerRegistry;
import org.springframework.web.servlet.config.annotation.WebMvcConfigurer;

import java.nio.file.Path;

@Configuration
public class AccountFileConfig implements WebMvcConfigurer {
    private final String uploadDirectory;

    public AccountFileConfig(@Value("${app.upload-dir:uploads}") String uploadDirectory) {
        this.uploadDirectory = uploadDirectory;
    }

    @Override
    public void addResourceHandlers(ResourceHandlerRegistry registry) {
        Path avatarDirectory = Path.of(uploadDirectory, "avatars").toAbsolutePath().normalize();
        String location = avatarDirectory.toUri().toString();
        if (!location.endsWith("/")) location += "/";
        registry.addResourceHandler("/uploads/avatars/**")
                .addResourceLocations(location);

        Path storefrontDirectory = Path.of(uploadDirectory, "storefront").toAbsolutePath().normalize();
        String storefrontLocation = storefrontDirectory.toUri().toString();
        if (!storefrontLocation.endsWith("/")) storefrontLocation += "/";
        registry.addResourceHandler("/uploads/storefront/**")
                .addResourceLocations(storefrontLocation);
    }
}
