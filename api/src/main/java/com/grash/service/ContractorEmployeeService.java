package com.grash.service;

import com.grash.advancedsearch.SearchCriteria;
import com.grash.advancedsearch.SpecificationBuilder;
import com.grash.dto.ContractorEmployeePatchDTO;
import com.grash.exception.CustomException;
import com.grash.mapper.ContractorEmployeeMapper;
import com.grash.model.ContractorEmployee;
import com.grash.model.Vendor;
import com.grash.repository.ContractorEmployeeRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Pageable;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;

import java.util.Collection;
import java.util.Optional;

@Service
@RequiredArgsConstructor
public class ContractorEmployeeService {
    private final ContractorEmployeeRepository contractorEmployeeRepository;
    private final VendorService vendorService;
    private final ContractorEmployeeMapper contractorEmployeeMapper;

    public ContractorEmployee create(ContractorEmployee contractorEmployee) {
        return contractorEmployeeRepository.save(contractorEmployee);
    }

    public ContractorEmployee update(Long id, ContractorEmployeePatchDTO contractorEmployee) {
        if (contractorEmployeeRepository.existsById(id)) {
            ContractorEmployee savedEmployee = contractorEmployeeRepository.findById(id).get();
            return contractorEmployeeRepository.save(contractorEmployeeMapper.updateContractorEmployee(savedEmployee, contractorEmployee));
        } else throw new CustomException("Not found", HttpStatus.NOT_FOUND);
    }

    public ContractorEmployee update(Long id, ContractorEmployee contractorEmployee) {
        if (contractorEmployeeRepository.existsById(id)) {
            contractorEmployee.setId(id);
            return contractorEmployeeRepository.save(contractorEmployee);
        } else throw new CustomException("Not found", HttpStatus.NOT_FOUND);
    }

    public Collection<ContractorEmployee> getAll() {
        return contractorEmployeeRepository.findAll();
    }

    public void delete(Long id) {
        contractorEmployeeRepository.deleteById(id);
    }

    public Optional<ContractorEmployee> findById(Long id) {
        return contractorEmployeeRepository.findById(id);
    }

    public Collection<ContractorEmployee> findByVendor(Long vendorId) {
        return contractorEmployeeRepository.findByVendor_Id(vendorId);
    }

    public Page<ContractorEmployee> findBySearchCriteria(SearchCriteria searchCriteria) {
        SpecificationBuilder<ContractorEmployee> builder = new SpecificationBuilder<>();
        searchCriteria.getFilterFields().forEach(builder::with);
        Pageable page = PageRequest.of(searchCriteria.getPageNum(), searchCriteria.getPageSize(),
                searchCriteria.getDirection(), searchCriteria.getSortField());
        return contractorEmployeeRepository.findAll(builder.build(), page);
    }

    public Optional<ContractorEmployee> findByEmail(String email) {
        return contractorEmployeeRepository.findByEmail(email);
    }
}