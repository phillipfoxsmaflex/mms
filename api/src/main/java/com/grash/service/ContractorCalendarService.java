package com.grash.service;

import com.grash.advancedsearch.SearchCriteria;
import com.grash.advancedsearch.SpecificationBuilder;
import com.grash.dto.ContractorCalendarEntryPatchDTO;
import com.grash.exception.CustomException;
import com.grash.mapper.ContractorCalendarEntryMapper;
import com.grash.model.ContractorCalendarEntry;
import com.grash.model.Vendor;
import com.grash.model.WorkOrder;
import com.grash.repository.ContractorCalendarEntryRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Pageable;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;

import java.time.LocalDateTime;
import java.util.Collection;
import java.util.Optional;

@Service
@RequiredArgsConstructor
public class ContractorCalendarService {
    private final ContractorCalendarEntryRepository contractorCalendarEntryRepository;
    private final VendorService vendorService;
    private final WorkOrderService workOrderService;
    private final UserService userService;
    private final ContractorCalendarEntryMapper contractorCalendarEntryMapper;

    public ContractorCalendarEntry create(ContractorCalendarEntry contractorCalendarEntry) {
        return contractorCalendarEntryRepository.save(contractorCalendarEntry);
    }

    public ContractorCalendarEntry update(Long id, ContractorCalendarEntryPatchDTO contractorCalendarEntry) {
        if (contractorCalendarEntryRepository.existsById(id)) {
            ContractorCalendarEntry savedEntry = contractorCalendarEntryRepository.findById(id).get();
            return contractorCalendarEntryRepository.save(contractorCalendarEntryMapper.updateContractorCalendarEntry(savedEntry, contractorCalendarEntry));
        } else throw new CustomException("Not found", HttpStatus.NOT_FOUND);
    }

    public ContractorCalendarEntry update(Long id, ContractorCalendarEntry contractorCalendarEntry) {
        if (contractorCalendarEntryRepository.existsById(id)) {
            contractorCalendarEntry.setId(id);
            return contractorCalendarEntryRepository.save(contractorCalendarEntry);
        } else throw new CustomException("Not found", HttpStatus.NOT_FOUND);
    }

    public Collection<ContractorCalendarEntry> getAll() {
        return contractorCalendarEntryRepository.findAll();
    }

    public void delete(Long id) {
        contractorCalendarEntryRepository.deleteById(id);
    }

    public Optional<ContractorCalendarEntry> findById(Long id) {
        return contractorCalendarEntryRepository.findById(id);
    }

    public Collection<ContractorCalendarEntry> findByVendor(Long vendorId) {
        return contractorCalendarEntryRepository.findByVendor_Id(vendorId);
    }

    public Collection<ContractorCalendarEntry> findByEmployee(Long employeeId) {
        return contractorCalendarEntryRepository.findByEmployee_Id(employeeId);
    }

    public Collection<ContractorCalendarEntry> findByWorkOrder(Long workOrderId) {
        return contractorCalendarEntryRepository.findByWorkOrder_Id(workOrderId);
    }

    public Page<ContractorCalendarEntry> findBySearchCriteria(SearchCriteria searchCriteria) {
        SpecificationBuilder<ContractorCalendarEntry> builder = new SpecificationBuilder<>();
        searchCriteria.getFilterFields().forEach(builder::with);
        Pageable page = PageRequest.of(searchCriteria.getPageNum(), searchCriteria.getPageSize(),
                searchCriteria.getDirection(), searchCriteria.getSortField());
        return contractorCalendarEntryRepository.findAll(builder.build(), page);
    }

    public Collection<ContractorCalendarEntry> findByDateRange(LocalDateTime start, LocalDateTime end) {
        return contractorCalendarEntryRepository.findByStartTimeBetween(start, end);
    }

    public ContractorCalendarEntry createFromWorkOrder(Long workOrderId, Long employeeId, Long supervisorId) {
        Optional<WorkOrder> optionalWorkOrder = workOrderService.findById(workOrderId);
        if (!optionalWorkOrder.isPresent()) {
            throw new CustomException("Work order not found", HttpStatus.NOT_FOUND);
        }
        
        WorkOrder workOrder = optionalWorkOrder.get();
        Vendor vendor = workOrder.getVendor();
        
        ContractorCalendarEntry entry = new ContractorCalendarEntry();
        entry.setVendor(vendor);
        entry.setWorkOrder(workOrder);
        entry.setEmployee(workOrder.getAssignedToEmployee());
        entry.setSupervisor(userService.findById(supervisorId).orElseThrow(() -> 
            new CustomException("Supervisor not found", HttpStatus.NOT_FOUND)));
        entry.setStartTime(workOrder.getStartDate() != null ? workOrder.getStartDate().toInstant().atZone(java.time.ZoneId.systemDefault()).toLocalDateTime() : null);
        entry.setEndTime(workOrder.getEndDate() != null ? workOrder.getEndDate().toInstant().atZone(java.time.ZoneId.systemDefault()).toLocalDateTime() : null);
        entry.setDescription("Work Order: " + workOrder.getTitle());
        entry.setLocationDetails(workOrder.getLocation() != null ? workOrder.getLocation().getName() : "");
        entry.setStatus(com.grash.model.enums.CalendarEntryStatus.PLANNED);
        
        return contractorCalendarEntryRepository.save(entry);
    }
}