package com.pfe.startup.controller;

import org.springframework.messaging.handler.annotation.MessageMapping;
import org.springframework.messaging.handler.annotation.SendTo;
import org.springframework.stereotype.Controller;

@Controller
public class NotificationController {

    @MessageMapping("/send")
    @SendTo("/topic/notifications")
    public String sendMessage(String message) {

        return message;
    }
}