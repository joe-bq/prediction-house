package com.hsbc.marketapi.service;

import com.hsbc.marketapi.model.MarketProperty;
import com.hsbc.marketapi.model.MarketSummary;
import com.hsbc.marketapi.model.WhatIfRequest;
import com.hsbc.marketapi.model.WhatIfResponse;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.boot.web.client.RestTemplateBuilder;
import org.springframework.http.HttpEntity;
import org.springframework.http.HttpHeaders;
import org.springframework.http.HttpMethod;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.stereotype.Service;
import org.springframework.web.client.RestClientException;
import org.springframework.web.client.RestTemplate;

import java.util.Comparator;
import java.util.HashMap;
import java.util.List;
import java.util.Locale;
import java.util.Map;
import java.util.concurrent.ConcurrentHashMap;
import java.util.stream.Collectors;

@Service
public class MarketDataService {
    private final Map<String, MarketSummary> summaryCache = new ConcurrentHashMap<>();
    private final RestTemplate restTemplate;
    private final String housePredictionUrl;

    public MarketDataService(RestTemplateBuilder restTemplateBuilder, @Value("${house.prediction.url:http://house-prediction:8000}") String housePredictionUrl) {
        this.restTemplate = restTemplateBuilder.build();
        this.housePredictionUrl = housePredictionUrl;
    }

    // simulated list of market properties
    private final List<MarketProperty> properties = List.of(
            new MarketProperty("PH-101", "Austin", "Downtown", "Premium", "Large", 642000, 1820, 3, 2, 8.4),
            new MarketProperty("PH-102", "Austin", "North Loop", "Mid", "Medium", 515000, 1640, 3, 2, 6.1),
            new MarketProperty("PH-103", "Seattle", "Capitol Hill", "Premium", "Large", 785000, 2100, 4, 3, 7.8),
            new MarketProperty("PH-104", "Seattle", "Ballard", "Mid", "Medium", 610000, 1750, 3, 2, 5.9),
            new MarketProperty("PH-105", "Boston", "Back Bay", "Luxury", "Large", 980000, 2350, 4, 3, 9.4),
            new MarketProperty("PH-106", "Boston", "Cambridge", "Premium", "Medium", 730000, 1980, 3, 2, 7.2),
            new MarketProperty("PH-107", "Denver", "LoDo", "Mid", "Medium", 560000, 1700, 3, 2, 6.9),
            new MarketProperty("PH-108", "Denver", "Highlands", "Premium", "Medium", 665000, 1880, 3, 2, 7.4),
            new MarketProperty("PH-109", "Miami", "Brickell", "Luxury", "Large", 1045000, 2450, 4, 3, 10.1),
            new MarketProperty("PH-110", "Miami", "Little Havana", "Mid", "Medium", 620000, 1710, 3, 2, 6.6)
    );

    public MarketSummary getSummary() {
        return summaryCache.computeIfAbsent("market-summary", key -> {
            double averagePrice = properties.stream().mapToDouble(MarketProperty::price).average().orElse(0.0);
            double averageSquareFootage = properties.stream().mapToDouble(MarketProperty::squareFootage).average().orElse(0.0);
            List<Double> prices = properties.stream().map(MarketProperty::price).sorted().toList();
            double medianPrice = prices.size() % 2 == 0
                    ? (prices.get(prices.size() / 2 - 1) + prices.get(prices.size() / 2)) / 2.0
                    : prices.get(prices.size() / 2);

            return new MarketSummary(
                    properties.size(),
                    round(averagePrice),
                    round(averageSquareFootage),
                    round(medianPrice),
                    6.8,
                    averagePrice > 700000 ? "Strong" : "Stable"
            );
        });
    }

    public List<MarketProperty> getProperties(String location, String priceTier, String size) {
        return properties.stream()
                .filter(property -> location == null || property.location().equalsIgnoreCase(location))
                .filter(property -> priceTier == null || property.priceTier().equalsIgnoreCase(priceTier))
                .filter(property -> size == null || property.size().equalsIgnoreCase(size))
                .sorted(Comparator.comparingDouble(MarketProperty::price))
                .collect(Collectors.toList());
    }

    public WhatIfResponse simulateWhatIf(WhatIfRequest request) {
        double currentAverage = properties.stream()
                .filter(property -> property.location().equalsIgnoreCase(request.location()))
                .mapToDouble(MarketProperty::price)
                .average()
                .orElse(0.0);

        Map<String, Object> payload = buildHousePredictionPayload(request, currentAverage);

        // call the house prediction service with the constructed payload
        try {
            HttpHeaders headers = new HttpHeaders();
            headers.setContentType(MediaType.APPLICATION_JSON);
            HttpEntity<Map<String, Object>> entity = new HttpEntity<>(payload, headers);
            ResponseEntity<Map> response = restTemplate.exchange(
                    housePredictionUrl + "/predict",
                    HttpMethod.POST,
                    entity,
                    Map.class
            );

            if (response.getStatusCode().is2xxSuccessful() && response.getBody() != null) {
                Object predictionValue = response.getBody().get("prediction");
                if (predictionValue instanceof Number number) {
                    double projectedPrice = number.doubleValue();
                    double delta = projectedPrice - currentAverage;
                    String recommendation = delta > 0
                            ? "Accelerate pricing and highlight premium finishes."
                            : "Consider competitive concessions to improve absorption.";
                    return new WhatIfResponse(request.location(), round(currentAverage), round(projectedPrice), round(delta), recommendation);
                }
            }
        } catch (RestClientException ignored) {
            // fall back to a simulated calculation if the model service is unavailable
        }

        double projectedPrice = currentAverage * (1 + request.priceDeltaPct() / 100.0);
        double delta = projectedPrice - currentAverage;
        String recommendation = delta > 0 ? "Accelerate pricing and highlight premium finishes." : "Consider competitive concessions to improve absorption.";
        return new WhatIfResponse(request.location(), round(currentAverage), round(projectedPrice), round(delta), recommendation);
    }

    // build the payload for the house prediction service based on the request and current average price
    // NOTE: hard-coded values for certain property attributes based on location and current average price
    private Map<String, Object> buildHousePredictionPayload(WhatIfRequest request, double currentAverage) {
        Map<String, Object> payload = new HashMap<>();
        payload.put("square_footage", request.squareFootage());
        payload.put("bedrooms", request.bedrooms());
        payload.put("bathrooms", request.bathrooms());
        payload.put("year_built", determineYearBuilt(request.location(), currentAverage));
        payload.put("lot_size", determineLotSize(request.location(), request.squareFootage()));
        payload.put("distance_to_city_center", determineDistanceToCityCenter(request.location()));
        payload.put("school_rating", determineSchoolRating(request.location(), request.priceTier()));
        return payload;
    }

    private int determineYearBuilt(String location, double currentAverage) {
        if (location.equalsIgnoreCase("Austin")) return 2012;
        if (location.equalsIgnoreCase("Seattle")) return 2009;
        if (location.equalsIgnoreCase("Boston")) return 2006;
        if (location.equalsIgnoreCase("Denver")) return 2014;
        if (location.equalsIgnoreCase("Miami")) return 2011;
        return currentAverage > 700000 ? 2008 : 2015;
    }

    private double determineLotSize(String location, double squareFootage) {
        double base = squareFootage * 2.2;
        if (location.equalsIgnoreCase("Boston")) return base * 2.1;
        if (location.equalsIgnoreCase("Miami")) return base * 1.8;
        return base;
    }

    private double determineDistanceToCityCenter(String location) {
        if (location.equalsIgnoreCase("Austin")) return 8.5;
        if (location.equalsIgnoreCase("Seattle")) return 10.2;
        if (location.equalsIgnoreCase("Boston")) return 6.4;
        if (location.equalsIgnoreCase("Denver")) return 9.7;
        if (location.equalsIgnoreCase("Miami")) return 7.8;
        return 9.0;
    }

    private double determineSchoolRating(String location, String priceTier) {
        if (location.equalsIgnoreCase("Boston")) return 9.2;
        if (location.equalsIgnoreCase("Seattle")) return 8.8;
        if (location.equalsIgnoreCase("Austin")) return 8.4;
        if (location.equalsIgnoreCase("Miami")) return 8.1;
        if (location.equalsIgnoreCase("Denver")) return 8.6;
        return priceTier != null && priceTier.equalsIgnoreCase("Luxury") ? 9.6 : 8.2;
    }

    public String exportCsv() {
        StringBuilder csv = new StringBuilder();
        csv.append("id,location,neighborhood,priceTier,size,price,squareFootage,bedrooms,bathrooms,ytdGrowth\n");
        for (MarketProperty property : properties) {
            csv.append(String.format(Locale.US,
                    "%s,%s,%s,%s,%s,%.2f,%.2f,%d,%d,%.2f\n",
                    property.id(), property.location(), property.neighborhood(), property.priceTier(), property.size(),
                    property.price(), property.squareFootage(), property.bedrooms(), property.bathrooms(), property.ytdGrowth()));
        }
        return csv.toString();
    }

    public String exportPdf() {
        return "%%PDF-1.4\n1 0 obj\n<< /Type /Catalog /Pages 2 0 R >>\nendobj\n2 0 obj\n<< /Type /Pages /Kids [3 0 R] /Count 1 >>\nendobj\n3 0 obj\n<< /Type /Page /Parent 2 0 R /MediaBox [0 0 300 144] /Contents 4 0 R /Resources << /Font << /F1 5 0 R >> >> >>\nendobj\n4 0 obj\n<< /Length 82 >>\nstream\nBT\n/F1 12 Tf\n50 100 Td\n(Market Analysis Export) Tj\nET\nendstream\nendobj\n5 0 obj\n<< /Type /Font /Subtype /Type1 /BaseFont /Helvetica >>\nendobj\nxref\n0 6\n0000000000 65535 f\n0000000010 00000 n\n0000000062 00000 n\n0000000123 00000 n\n0000000248 00000 n\n0000000615 00000 n\ntrailer\n<< /Root 1 0 R /Size 6 >>\nstartxref\n698\n%%EOF";
    }

    private double round(double value) {
        return Math.round(value * 100.0) / 100.0;
    }
}
