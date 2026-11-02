package com.hsbc.marketapi.model;

public record WhatIfRequest(
        String location,
        String priceTier,
        double squareFootage,
        int bedrooms,
        int bathrooms,
        double priceDeltaPct
) {}
