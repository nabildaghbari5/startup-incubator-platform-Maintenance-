package com.pfe.startup.service;

import org.springframework.messaging.simp.SimpMessagingTemplate;
import org.springframework.stereotype.Service;

@Service
public class NotificationService {

    private final SimpMessagingTemplate messagingTemplate;

    public NotificationService(SimpMessagingTemplate messagingTemplate) {
        this.messagingTemplate = messagingTemplate;
    }

    public void notifyPorteur(String message) {
        messagingTemplate.convertAndSend(
                "/topic/notifications/porteur",
                message);
    }

    public void notifyExpert(String message) {
        messagingTemplate.convertAndSend(
                "/topic/notifications/expert",
                message);
    }

    public void notifyIncubateur(String message) {
        messagingTemplate.convertAndSend(
                "/topic/notifications/incubateur",
                message);
    }
}
