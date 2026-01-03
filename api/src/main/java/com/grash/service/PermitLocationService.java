package com.grash.service;

import com.grash.advancedsearch.SearchCriteria;
import com.grash.advancedsearch.SpecificationBuilder;
import com.grash.dto.PermitLocationPatchDTO;
import com.grash.exception.CustomException;
import com.grash.mapper.PermitLocationMapper;
import com.grash.model.Company;
import com.grash.model.OwnUser;
import com.grash.model.PermitLocation;
import com.grash.repository.PermitLocationRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Pageable;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;

import javax.persistence.EntityManager;
import javax.transaction.Transactional;
import java.util.Collection;
import java.util.Optional;

@Service
@RequiredArgsConstructor
public class PermitLocationService {
    private final PermitLocationRepository permitLocationRepository;
    private final PermitLocationMapper permitLocationMapper;
    private final EntityManager em;

    @Transactional
    public PermitLocation create(PermitLocation permitLocation, Company company) {
        permitLocation.setCompany(company);
        permitLocation.setActive(true);
        
        PermitLocation savedLocation = permitLocationRepository.saveAndFlush(permitLocation);
        em.refresh(savedLocation);
        
        return savedLocation;
    }

    @Transactional
    public PermitLocation update(Long id, PermitLocationPatchDTO patchDTO, OwnUser user) {
        if (permitLocationRepository.existsById(id)) {
            PermitLocation savedLocation = permitLocationRepository.findById(id).get();
            PermitLocation updatedLocation = permitLocationRepository.saveAndFlush(
                    permitLocationMapper.updatePermitLocation(savedLocation, patchDTO)
            );
            em.refresh(updatedLocation);
            return updatedLocation;
        } else {
            throw new CustomException("Permit location not found", HttpStatus.NOT_FOUND);
        }
    }

    public Collection<PermitLocation> getAll() {
        return permitLocationRepository.findAll();
    }

    public void delete(Long id) {
        permitLocationRepository.deleteById(id);
    }

    public Optional<PermitLocation> findById(Long id) {
        return permitLocationRepository.findById(id);
    }

    public Optional<PermitLocation> findByIdAndCompany(Long id, Long companyId) {
        return permitLocationRepository.findByIdAndCompany_Id(id, companyId);
    }

    public Collection<PermitLocation> findByCompany(Long companyId) {
        return permitLocationRepository.findByCompany_Id(companyId);
    }

    public Collection<PermitLocation> findActiveByCompany(Long companyId) {
        return permitLocationRepository.findByIsActiveAndCompany_Id(true, companyId);
    }

    public Collection<PermitLocation> findByFacility(String facility, Long companyId) {
        return permitLocationRepository.findByFacilityAndCompany_Id(facility, companyId);
    }

    public Collection<PermitLocation> findByBuilding(String building, Long companyId) {
        return permitLocationRepository.findByBuildingAndCompany_Id(building, companyId);
    }

    public Page<PermitLocation> findBySearchCriteria(SearchCriteria searchCriteria) {
        SpecificationBuilder<PermitLocation> builder = new SpecificationBuilder<>();
        searchCriteria.getFilterFields().forEach(builder::with);
        Pageable page = PageRequest.of(searchCriteria.getPageNum(), searchCriteria.getPageSize(),
                searchCriteria.getDirection(), searchCriteria.getSortField());
        return permitLocationRepository.findAll(builder.build(), page);
    }

    public void save(PermitLocation permitLocation) {
        permitLocationRepository.save(permitLocation);
    }

    public PermitLocation saveAndFlush(PermitLocation permitLocation) {
        PermitLocation updatedLocation = permitLocationRepository.saveAndFlush(permitLocation);
        em.refresh(updatedLocation);
        return updatedLocation;
    }

    public boolean isPermitLocationInCompany(PermitLocation permitLocation, long companyId, boolean optional) {
        if (optional) {
            Optional<PermitLocation> optionalLocation = permitLocation == null ? Optional.empty() : findById(permitLocation.getId());
            return permitLocation == null || (optionalLocation.isPresent() && optionalLocation.get().getCompany().getId().equals(companyId));
        } else {
            Optional<PermitLocation> optionalLocation = findById(permitLocation.getId());
            return optionalLocation.isPresent() && optionalLocation.get().getCompany().getId().equals(companyId);
        }
    }
}
