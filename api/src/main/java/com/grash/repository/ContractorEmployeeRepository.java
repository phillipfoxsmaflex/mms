package com.grash.repository;

import com.grash.model.ContractorEmployee;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.JpaSpecificationExecutor;

import java.util.List;
import java.util.Optional;

public interface ContractorEmployeeRepository extends JpaRepository<ContractorEmployee, Long>, JpaSpecificationExecutor<ContractorEmployee> {
    List<ContractorEmployee> findByVendor_Id(Long vendorId);
    Optional<ContractorEmployee> findByEmail(String email);
}