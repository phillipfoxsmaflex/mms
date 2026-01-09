package com.grash.service;

import com.grash.model.ContractorEmployee;
import com.grash.model.Notification;
import com.grash.model.OwnUser;
import com.grash.model.SafetyInstruction;
import com.grash.model.enums.NotificationType;
import com.grash.repository.ContractorEmployeeRepository;
import com.grash.repository.SafetyInstructionRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.scheduling.annotation.Scheduled;
import org.springframework.stereotype.Service;

import java.time.LocalDateTime;
import java.time.temporal.ChronoUnit;
import java.util.Collection;
import java.util.List;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
public class SafetyInstructionExpirationJob {

    private final SafetyInstructionRepository safetyInstructionRepository;
    private final ContractorEmployeeRepository contractorEmployeeRepository;
    private final NotificationService notificationService;
    private final UserService userService;
    private final EmailService2 emailService2;

    @Scheduled(cron = "0 0 8 * * ?") // Täglich um 8 Uhr morgens
    public void checkExpiringSafetyInstructions() {
        LocalDateTime now = LocalDateTime.now();
        LocalDateTime in30Days = now.plusDays(30);
        LocalDateTime in15Days = now.plusDays(15);
        LocalDateTime in7Days = now.plusDays(7);
        
        // Find instructions that are about to expire
        List<SafetyInstruction> instructionsExpiringIn30Days = safetyInstructionRepository
            .findByExpirationDateBetweenAndCompletedTrue(now, in30Days);
        
        List<SafetyInstruction> instructionsExpiringIn15Days = safetyInstructionRepository
            .findByExpirationDateBetweenAndCompletedTrue(now, in15Days);
        
        List<SafetyInstruction> instructionsExpiringIn7Days = safetyInstructionRepository
            .findByExpirationDateBetweenAndCompletedTrue(now, in7Days);
        
        List<SafetyInstruction> expiredInstructions = safetyInstructionRepository
            .findByExpirationDateBeforeAndCompletedTrue(now);
        
        // Process 30 days warning
        processExpiringInstructions(instructionsExpiringIn30Days, 30, "30 Tage");
        
        // Process 15 days warning
        processExpiringInstructions(instructionsExpiringIn15Days, 15, "15 Tage");
        
        // Process 7 days warning
        processExpiringInstructions(instructionsExpiringIn7Days, 7, "7 Tage");
        
        // Process expired instructions
        processExpiredInstructions(expiredInstructions);
    }

    private void processExpiringInstructions(List<SafetyInstruction> instructions, int days, String period) {
        for (SafetyInstruction instruction : instructions) {
            // Only send notification if it hasn't been sent before for this period
            boolean notificationSent = notificationService.wasNotificationSentForSafetyInstruction(
                instruction.getId(), days);
            
            if (!notificationSent) {
                sendExpirationWarning(instruction, days, period);
                notificationService.markSafetyInstructionNotificationSent(instruction.getId(), days);
            }
        }
    }

    private void processExpiredInstructions(List<SafetyInstruction> instructions) {
        for (SafetyInstruction instruction : instructions) {
            // Only send notification if it hasn't been sent before for expiration
            boolean notificationSent = notificationService.wasNotificationSentForSafetyInstruction(
                instruction.getId(), 0);
            
            if (!notificationSent) {
                sendExpirationWarning(instruction, 0, "abgelaufen");
                notificationService.markSafetyInstructionNotificationSent(instruction.getId(), 0);
            }
        }
    }

    private void sendExpirationWarning(SafetyInstruction instruction, int days, String period) {
        ContractorEmployee employee = instruction.getEmployee();
        if (employee == null) return;
        
        String message;
        if (days == 0) {
            message = String.format("Die Sicherheitsunterweisung für %s %s ist %s!", 
                employee.getFirstName(), employee.getLastName(), period);
        } else {
            message = String.format("Die Sicherheitsunterweisung für %s %s läuft in %s %s ab!", 
                employee.getFirstName(), employee.getLastName(), days, period);
        }
        
        // Find admins and managers to notify
        Collection<OwnUser> admins = userService.findAdminsForCompany(employee.getVendor().getCompany().getId());
        
        for (OwnUser admin : admins) {
            Notification notification = new Notification(
                message,
                admin,
                NotificationType.SAFETY_INSTRUCTION_EXPIRATION,
                instruction.getId()
            );
            notificationService.create(notification, true, "Sicherheitsunterweisung Warnung");
            
            // Send email notification
            String emailSubject = String.format("Sicherheitsunterweisung Warnung: %s", period);
            String emailBody = String.format(
                "Hallo %s %s,%n%n" +
                "Dies ist eine automatische Benachrichtigung, dass die Sicherheitsunterweisung für %s %s %s.%n%n" +
                "Unterweisung: %s%n" +
                "Ablaufdatum: %s%n%n" +
                "Bitte ergreifen Sie die notwendigen Maßnahmen.%n%n" +
                "Mit freundlichen Grüßen,%n" +
                "Ihr MMS Team",
                admin.getFirstName(), admin.getLastName(),
                employee.getFirstName(), employee.getLastName(),
                days == 0 ? "abgelaufen ist" : String.format("in %s Tagen abläuft", days),
                instruction.getTitle(),
                instruction.getExpirationDate().toString()
            );
            
            emailService2.sendEmail(admin.getEmail(), emailSubject, emailBody);
        }
    }
}