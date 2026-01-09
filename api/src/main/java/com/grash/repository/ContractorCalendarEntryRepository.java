package com.grash.repository;

import com.grash.model.ContractorCalendarEntry;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.JpaSpecificationExecutor;

import java.time.LocalDateTime;
import java.util.List;

public interface ContractorCalendarEntryRepository extends JpaRepository<ContractorCalendarEntry, Long>, JpaSpecificationExecutor<ContractorCalendarEntry> {
    List<ContractorCalendarEntry> findByVendor_Id(Long vendorId);
    List<ContractorCalendarEntry> findByEmployee_Id(Long employeeId);
    List<ContractorCalendarEntry> findByWorkOrder_Id(Long workOrderId);
    List<ContractorCalendarEntry> findByStartTimeBetween(LocalDateTime start, LocalDateTime end);
}