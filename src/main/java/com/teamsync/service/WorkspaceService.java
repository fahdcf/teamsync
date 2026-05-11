package com.teamsync.service;

import com.teamsync.domain.entity.User;
import com.teamsync.domain.entity.Workspace;
import com.teamsync.patterns.creational.singleton.AppLogger;
import com.teamsync.presentation.dto.UserResponseDTO;
import com.teamsync.presentation.dto.WorkspaceRequestDTO;
import com.teamsync.presentation.dto.WorkspaceResponseDTO;
import com.teamsync.repository.UserRepository;
import com.teamsync.repository.WorkspaceRepository;
import com.teamsync.repository.WorkspaceSpecification;
import org.springframework.data.jpa.domain.Specification;
import org.springframework.security.core.userdetails.UsernameNotFoundException;
import org.springframework.stereotype.Service;

import java.util.ArrayList;
import java.util.LinkedHashSet;
import java.util.List;
import java.util.NoSuchElementException;
import java.util.Set;
import java.util.UUID;
import java.util.stream.Collectors;
import java.util.stream.Stream;

@Service
public class WorkspaceService {

    private final WorkspaceRepository workspaceRepository;
    private final UserRepository userRepository;

    public WorkspaceService(WorkspaceRepository workspaceRepository, UserRepository userRepository) {
        this.workspaceRepository = workspaceRepository;
        this.userRepository = userRepository;
    }

    public WorkspaceResponseDTO create(WorkspaceRequestDTO request, String ownerEmail) {
        User owner = findUserByEmail(ownerEmail);
        Workspace workspace = Workspace.builder()
                .name(request.getName())
                .description(request.getDescription())
                .owner(owner)
                .build();
        WorkspaceResponseDTO dto = toDTO(workspaceRepository.save(workspace));
        AppLogger.getInstance().info("Workspace created: " + workspace.getName());
        return dto;
    }

    public WorkspaceResponseDTO findById(UUID id) {
        return toDTO(getWorkspace(id));
    }

    public List<WorkspaceResponseDTO> getMyWorkspaces(String email, String keyword) {
        User user = findUserByEmail(email);
        List<Workspace> owned = workspaceRepository.findByOwner(user);
        List<Workspace> member = workspaceRepository.findByMembersContaining(user);
        Set<UUID> myIds = Stream.concat(owned.stream(), member.stream())
                .map(Workspace::getId)
                .collect(Collectors.toCollection(LinkedHashSet::new));

        if (keyword == null || keyword.isBlank()) {
            return Stream.concat(owned.stream(), member.stream())
                    .distinct()
                    .map(this::toDTO)
                    .collect(Collectors.toList());
        }

        Specification<Workspace> inMyIds = (root, query, cb) -> root.get("id").in(myIds);
        Specification<Workspace> spec = Specification.where(inMyIds)
                .and(WorkspaceSpecification.hasKeyword(keyword));
        return workspaceRepository.findAll(spec).stream().map(this::toDTO).collect(Collectors.toList());
    }

    public WorkspaceResponseDTO addMember(UUID workspaceId, String memberEmail, String requesterEmail) {
        Workspace workspace = getWorkspace(workspaceId);
        User member = findUserByEmail(memberEmail);
        workspace.getMembers().add(member);
        return toDTO(workspaceRepository.save(workspace));
    }

    public void removeMember(UUID workspaceId, UUID userId, String requesterEmail) {
        Workspace workspace = getWorkspace(workspaceId);
        workspace.getMembers().removeIf(u -> u.getId().equals(userId));
        workspaceRepository.save(workspace);
    }

    public Workspace getWorkspace(UUID id) {
        return workspaceRepository.findById(id)
                .orElseThrow(() -> new NoSuchElementException("Workspace not found: " + id));
    }

    private User findUserByEmail(String email) {
        return userRepository.findByEmail(email)
                .orElseThrow(() -> new UsernameNotFoundException("User not found: " + email));
    }

    private UserResponseDTO userToDTO(User u) {
        return UserResponseDTO.builder()
                .id(u.getId())
                .username(u.getUsername())
                .email(u.getEmail())
                .role(u.getRole())
                .createdAt(u.getCreatedAt())
                .build();
    }

    private WorkspaceResponseDTO toDTO(Workspace w) {
        return WorkspaceResponseDTO.builder()
                .id(w.getId())
                .name(w.getName())
                .description(w.getDescription())
                .owner(userToDTO(w.getOwner()))
                .members(new ArrayList<>(w.getMembers().stream().map(this::userToDTO).collect(Collectors.toList())))
                .createdAt(w.getCreatedAt())
                .build();
    }
}
