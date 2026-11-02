package com.hsbc.marketapi.model;

public record MarketSummary(
        int totalProperties,
        double averagePrice,
        double averageSquareFootage,
        double medianPrice,
        double monthlyGrowth,
        String marketHealth
) {}
