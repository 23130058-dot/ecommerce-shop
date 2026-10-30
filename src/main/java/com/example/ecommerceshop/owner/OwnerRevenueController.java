package com.example.ecommerceshop.owner;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

import java.util.ArrayList;
import java.util.LinkedHashMap;
import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/api/owner")
public class OwnerRevenueController {

    @GetMapping("/revenue")
    public Map<String, Object> getRevenue(
            @RequestParam(defaultValue = "2026") int year) {

        int[] revenue2026 = {
                1_200_000,
                0,
                3_500_000,
                0,
                0,
                0,
                0,
                0,
                0,
                0,
                0,
                0
        };

        List<Map<String, Object>> monthlyRevenue = new ArrayList<>();
        long totalRevenue = 0;

        for (int month = 1; month <= 12; month++) {
            long revenue = year == 2026
                    ? revenue2026[month - 1]
                    : 0;

            Map<String, Object> item = new LinkedHashMap<>();
            item.put("month", month);
            item.put("revenue", revenue);

            monthlyRevenue.add(item);
            totalRevenue += revenue;
        }

        Map<String, Object> result = new LinkedHashMap<>();
        result.put("year", year);
        result.put("totalRevenue", totalRevenue);
        result.put("monthlyRevenue", monthlyRevenue);

        return result;
    }
}
