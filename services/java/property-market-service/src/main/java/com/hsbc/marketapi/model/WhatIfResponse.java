package com.hsbc.marketapi.model;

public record WhatIfResponse(
        String location,
        double currentAveragePrice,
        double projectedPrice,
        double delta,
        String recommendation
) {}
