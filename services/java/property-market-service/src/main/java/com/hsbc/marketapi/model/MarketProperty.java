package com.hsbc.marketapi.model;

public record MarketProperty(
        String id,
        String location,
        String neighborhood,
        String priceTier,
        String size,
        double price,
        double squareFootage,
        int bedrooms,
        int bathrooms,
        double ytdGrowth
) {}
