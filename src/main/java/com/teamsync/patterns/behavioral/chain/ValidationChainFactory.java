package com.teamsync.patterns.behavioral.chain;

import com.teamsync.repository.UserRepository;
import org.springframework.stereotype.Component;

@Component
public class ValidationChainFactory {

    private final UserRepository userRepository;

    public ValidationChainFactory(UserRepository userRepository) {
        this.userRepository = userRepository;
    }

    public TaskValidator buildChain() {
        TitleValidator title = new TitleValidator();
        DeadlineValidator deadline = new DeadlineValidator();
        AssigneeValidator assignee = new AssigneeValidator(userRepository);
        PriorityValidator priority = new PriorityValidator();

        title.setNext(deadline).setNext(assignee).setNext(priority);
        return title;
    }
}
