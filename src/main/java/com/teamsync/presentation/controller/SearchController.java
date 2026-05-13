package com.teamsync.presentation.controller;

import com.teamsync.presentation.dto.SearchResultResponseDTO;
import com.teamsync.service.SearchService;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.responses.ApiResponse;
import io.swagger.v3.oas.annotations.tags.Tag;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

import java.util.List;

@Tag(name = "Search", description = "Global search across visible TeamSync entities")
@RestController
public class SearchController {

    private final SearchService searchService;

    public SearchController(SearchService searchService) {
        this.searchService = searchService;
    }

    @Operation(summary = "Search visible workspaces, projects, tasks, and people")
    @ApiResponse(responseCode = "200", description = "Search results returned")
    @GetMapping("/search")
    public List<SearchResultResponseDTO> search(@RequestParam(name = "keyword", required = false) String keyword,
                                                Authentication auth) {
        return searchService.search(auth.getName(), keyword);
    }
}
