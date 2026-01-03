package com.grash.service;

import com.grash.advancedsearch.SearchCriteria;
import com.grash.advancedsearch.SpecificationBuilder;
import com.grash.dto.PermitPatchDTO;
import com.grash.exception.CustomException;
import com.grash.mapper.PermitMapper;
import com.grash.model.*;
import com.grash.model.enums.NotificationType;
import com.grash.model.enums.PermitStatus;
import com.grash.repository.PermitRepository;
import com.grash.utils.Helper;
import lombok.RequiredArgsConstructor;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.context.MessageSource;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Pageable;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;

import javax.persistence.EntityManager;
import javax.transaction.Transactional;
import java.util.*;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
public class PermitService {
    private final PermitRepository permitRepository;
    private final NotificationService notificationService;
    private final PermitMapper permitMapper;
    private final EntityManager em;
    private final EmailService2 emailService2;
    private final MessageSource messageSource;
    private final CustomSequenceService customSequenceService;

    @Value("${frontend.url}")
    private String frontendUrl;

    @Transactional
    public Permit create(Permit permit, Company company) {
        permit.setPermitId(getPermitNumber(company));
        permit.setStatus(PermitStatus.DRAFT);
        
        Permit savedPermit = permitRepository.saveAndFlush(permit);
        em.refresh(savedPermit);
        
        return savedPermit;
    }

    public String getPermitNumber(Company company) {
        Long nextSequence = customSequenceService.getNextPermitSequence(company);
        return "PTW" + String.format("%06d", nextSequence);
    }

    @Transactional
    public Permit update(Long id, PermitPatchDTO permitPatchDTO, OwnUser user) {
        if (permitRepository.existsById(id)) {
            Permit savedPermit = permitRepository.findById(id).get();
            Permit updatedPermit = permitRepository.saveAndFlush(permitMapper.updatePermit(savedPermit, permitPatchDTO));
            em.refresh(updatedPermit);
            return updatedPermit;
        } else {
            throw new CustomException("Permit not found", HttpStatus.NOT_FOUND);
        }
    }

    public Collection<Permit> getAll() {
        return permitRepository.findAll();
    }

    public void delete(Long id) {
        permitRepository.deleteById(id);
    }

    public Optional<Permit> findById(Long id) {
        return permitRepository.findById(id);
    }

    public Optional<Permit> findByIdAndCompany(Long id, Long companyId) {
        return permitRepository.findByIdAndCompany_Id(id, companyId);
    }

    public Collection<Permit> findByCompany(Long companyId) {
        return permitRepository.findByCompany_Id(companyId);
    }

    public Collection<Permit> findByStatus(PermitStatus status) {
        return permitRepository.findByStatus(status);
    }

    public Collection<Permit> findByStatusAndCompany(PermitStatus status, Long companyId) {
        return permitRepository.findByStatusAndCompany_Id(status, companyId);
    }

    public Collection<Permit> findByPrimaryUser(Long userId) {
        return permitRepository.findByPrimaryUser_Id(userId);
    }

    public Collection<Permit> findByAssignedToUser(Long userId) {
        return permitRepository.findByAssignedToUser(userId);
    }

    public Collection<Permit> findByLocation(Long locationId) {
        return permitRepository.findByPermitLocation_Id(locationId);
    }

    public Page<Permit> findBySearchCriteria(SearchCriteria searchCriteria) {
        SpecificationBuilder<Permit> builder = new SpecificationBuilder<>();
        searchCriteria.getFilterFields().forEach(builder::with);
        Pageable page = PageRequest.of(searchCriteria.getPageNum(), searchCriteria.getPageSize(),
                searchCriteria.getDirection(), searchCriteria.getSortField());
        return permitRepository.findAll(builder.build(), page);
    }

    public void save(Permit permit) {
        permitRepository.save(permit);
    }

    public Permit saveAndFlush(Permit permit) {
        Permit updatedPermit = permitRepository.saveAndFlush(permit);
        em.refresh(updatedPermit);
        return updatedPermit;
    }

    @Transactional
    public Permit submit(Long id, OwnUser user) {
        Permit permit = permitRepository.findById(id)
                .orElseThrow(() -> new CustomException("Permit not found", HttpStatus.NOT_FOUND));
        
        if (permit.getStatus() != PermitStatus.DRAFT) {
            throw new CustomException("Only draft permits can be submitted", HttpStatus.BAD_REQUEST);
        }
        
        permit.setStatus(PermitStatus.PENDING);
        permit.setSubmittedAt(new Date());
        permit.setSubmittedBy(user);
        
        Permit savedPermit = permitRepository.saveAndFlush(permit);
        em.refresh(savedPermit);
        
        notifyStatusChange(savedPermit, "submitted for approval", Helper.getLocale(permit.getCompany()));
        
        return savedPermit;
    }

    @Transactional
    public Permit approve(Long id, OwnUser user) {
        Permit permit = permitRepository.findById(id)
                .orElseThrow(() -> new CustomException("Permit not found", HttpStatus.NOT_FOUND));
        
        if (permit.getStatus() != PermitStatus.PENDING) {
            throw new CustomException("Only pending permits can be approved", HttpStatus.BAD_REQUEST);
        }
        
        permit.setStatus(PermitStatus.APPROVED);
        permit.setApprovedAt(new Date());
        permit.setApprovedBy(user);
        
        Permit savedPermit = permitRepository.saveAndFlush(permit);
        em.refresh(savedPermit);
        
        notifyStatusChange(savedPermit, "approved", Helper.getLocale(permit.getCompany()));
        
        return savedPermit;
    }

    @Transactional
    public Permit reject(Long id, OwnUser user, String reason) {
        Permit permit = permitRepository.findById(id)
                .orElseThrow(() -> new CustomException("Permit not found", HttpStatus.NOT_FOUND));
        
        if (permit.getStatus() != PermitStatus.PENDING) {
            throw new CustomException("Only pending permits can be rejected", HttpStatus.BAD_REQUEST);
        }
        
        permit.setStatus(PermitStatus.REJECTED);
        permit.setAdditionalComments(reason);
        
        Permit savedPermit = permitRepository.saveAndFlush(permit);
        em.refresh(savedPermit);
        
        notifyStatusChange(savedPermit, "rejected", Helper.getLocale(permit.getCompany()));
        
        return savedPermit;
    }

    @Transactional
    public Permit activate(Long id, OwnUser user) {
        Permit permit = permitRepository.findById(id)
                .orElseThrow(() -> new CustomException("Permit not found", HttpStatus.NOT_FOUND));
        
        if (permit.getStatus() != PermitStatus.APPROVED) {
            throw new CustomException("Only approved permits can be activated", HttpStatus.BAD_REQUEST);
        }
        
        permit.setStatus(PermitStatus.ACTIVE);
        permit.setActivatedAt(new Date());
        permit.setWorkStartedAt(new Date());
        
        Permit savedPermit = permitRepository.saveAndFlush(permit);
        em.refresh(savedPermit);
        
        notifyStatusChange(savedPermit, "activated", Helper.getLocale(permit.getCompany()));
        
        return savedPermit;
    }

    @Transactional
    public Permit complete(Long id, OwnUser user) {
        Permit permit = permitRepository.findById(id)
                .orElseThrow(() -> new CustomException("Permit not found", HttpStatus.NOT_FOUND));
        
        if (permit.getStatus() != PermitStatus.ACTIVE) {
            throw new CustomException("Only active permits can be completed", HttpStatus.BAD_REQUEST);
        }
        
        permit.setStatus(PermitStatus.COMPLETED);
        permit.setCompletedAt(new Date());
        permit.setWorkCompletedAt(new Date());
        
        Permit savedPermit = permitRepository.saveAndFlush(permit);
        em.refresh(savedPermit);
        
        notifyStatusChange(savedPermit, "completed", Helper.getLocale(permit.getCompany()));
        
        return savedPermit;
    }

    @Transactional
    public Permit cancel(Long id, OwnUser user, String reason) {
        Permit permit = permitRepository.findById(id)
                .orElseThrow(() -> new CustomException("Permit not found", HttpStatus.NOT_FOUND));
        
        if (permit.getStatus() == PermitStatus.COMPLETED || permit.getStatus() == PermitStatus.CANCELLED) {
            throw new CustomException("Cannot cancel a completed or already cancelled permit", HttpStatus.BAD_REQUEST);
        }
        
        permit.setStatus(PermitStatus.CANCELLED);
        permit.setAdditionalComments(reason);
        
        Permit savedPermit = permitRepository.saveAndFlush(permit);
        em.refresh(savedPermit);
        
        notifyStatusChange(savedPermit, "cancelled", Helper.getLocale(permit.getCompany()));
        
        return savedPermit;
    }

    public void notifyStatusChange(Permit permit, String action, Locale locale) {
        String title = messageSource.getMessage("permit_status_change", null, locale);
        String message = String.format("Permit %s (%s) has been %s", permit.getPermitId(), permit.getTitle(), action);
        
        Collection<OwnUser> users = permit.getAssignedTo();
        notificationService.createMultiple(
                users.stream()
                        .map(user -> new Notification(message, user, NotificationType.INFO, permit.getId()))
                        .collect(Collectors.toList()),
                true,
                title
        );

        Map<String, Object> mailVariables = new HashMap<String, Object>() {{
            put("permitLink", frontendUrl + "/app/permits/" + permit.getId());
            put("featuresLink", frontendUrl + "/#key-features");
            put("permitTitle", permit.getTitle());
            put("permitId", permit.getPermitId());
            put("action", action);
        }};
        
        Collection<OwnUser> usersToMail = users.stream()
                .filter(user -> user.isEnabled())
                .collect(Collectors.toList());
        
        if (!usersToMail.isEmpty()) {
            emailService2.sendMessageUsingThymeleafTemplate(
                    usersToMail.stream().map(OwnUser::getEmail).toArray(String[]::new),
                    title,
                    mailVariables,
                    "permit-status-change.html",
                    locale
            );
        }
    }

    public void notify(Permit permit, Locale locale) {
        String title = messageSource.getMessage("new_permit", null, locale);
        String message = messageSource.getMessage("notification_permit_assigned", new Object[]{permit.getTitle()}, locale);
        
        Collection<OwnUser> users = permit.getAssignedTo();
        notificationService.createMultiple(
                users.stream()
                        .map(user -> new Notification(message, user, NotificationType.INFO, permit.getId()))
                        .collect(Collectors.toList()),
                true,
                title
        );

        Map<String, Object> mailVariables = new HashMap<String, Object>() {{
            put("permitLink", frontendUrl + "/app/permits/" + permit.getId());
            put("featuresLink", frontendUrl + "/#key-features");
            put("permitTitle", permit.getTitle());
        }};
        
        Collection<OwnUser> usersToMail = users.stream()
                .filter(user -> user.isEnabled())
                .collect(Collectors.toList());
        
        if (!usersToMail.isEmpty()) {
            emailService2.sendMessageUsingThymeleafTemplate(
                    usersToMail.stream().map(OwnUser::getEmail).toArray(String[]::new),
                    title,
                    mailVariables,
                    "new-permit.html",
                    locale
            );
        }
    }

    public boolean isPermitInCompany(Permit permit, long companyId, boolean optional) {
        if (optional) {
            Optional<Permit> optionalPermit = permit == null ? Optional.empty() : findById(permit.getId());
            return permit == null || (optionalPermit.isPresent() && optionalPermit.get().getCompany().getId().equals(companyId));
        } else {
            Optional<Permit> optionalPermit = findById(permit.getId());
            return optionalPermit.isPresent() && optionalPermit.get().getCompany().getId().equals(companyId);
        }
    }

    public Collection<Permit> findByCreatedBy(Long id) {
        return permitRepository.findByCreatedBy(id);
    }

    public Collection<Permit> findByStartDateBetweenAndCompany(Date date1, Date date2, Long companyId) {
        return permitRepository.findByStartDateBetweenAndCompany_Id(date1, date2, companyId);
    }

    public Collection<Permit> findByEndDateBetweenAndCompany(Date date1, Date date2, Long companyId) {
        return permitRepository.findByEndDateBetweenAndCompany_Id(date1, date2, companyId);
    }
}
