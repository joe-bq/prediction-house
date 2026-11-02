package com.hsbc.marketapi.controller;

import com.hsbc.marketapi.model.MarketProperty;
import com.hsbc.marketapi.model.MarketSummary;
import com.hsbc.marketapi.model.WhatIfRequest;
import com.hsbc.marketapi.model.WhatIfResponse;
import com.hsbc.marketapi.service.MarketDataService;
import org.springframework.http.HttpHeaders;
import org.springframework.http.HttpStatus;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.Map;
@RestController
@RequestMapping("/api")
@CrossOrigin(origins = "http://localhost:3000", allowedHeaders = "*", methods = {RequestMethod.GET, RequestMethod.POST, RequestMethod.OPTIONS})
public class MarketAnalysisController {
    private final MarketDataService marketDataService;

    public MarketAnalysisController(MarketDataService marketDataService) {
        this.marketDataService = marketDataService;
    }

    @GetMapping("/health")
    public Map<String, Object> health() {
        return Map.of("status", "ok", "service", "property-market-service");
    }

    @GetMapping("/market/summary")
    public MarketSummary summary() {
        return marketDataService.getSummary();
    }

    @GetMapping("/market/properties")
    public List<MarketProperty> properties(
            @RequestParam(required = false) String location,
            @RequestParam(required = false) String priceTier,
            @RequestParam(required = false) String size) {
        return marketDataService.getProperties(location, priceTier, size);
    }

    @PostMapping("/market/what-if")
    public WhatIfResponse whatIf(@RequestBody WhatIfRequest request) {
        return marketDataService.simulateWhatIf(request);
    }

    @GetMapping("/market/export/csv")
    public ResponseEntity<String> exportCsv() {
        String csv = marketDataService.exportCsv();
        HttpHeaders headers = new HttpHeaders();
        headers.setContentType(MediaType.TEXT_PLAIN);
        headers.setContentDispositionFormData("attachment", "market-data.csv");
        return new ResponseEntity<>(csv, headers, HttpStatus.OK);
    }

    @GetMapping("/market/export/pdf")
    public ResponseEntity<String> exportPdf() {
        String pdf = marketDataService.exportPdf();
        HttpHeaders headers = new HttpHeaders();
        headers.setContentType(MediaType.APPLICATION_PDF);
        headers.setContentDispositionFormData("attachment", "market-data.pdf");
        return new ResponseEntity<>(pdf, headers, HttpStatus.OK);
    }
}
