package com.grash.service;

import com.grash.model.ContractorEmployee;
import com.grash.model.Location;
import com.grash.model.OwnUser;
import com.grash.model.SafetyInstruction;
import com.grash.model.Vendor;
import com.grash.model.enums.InstructionType;
import com.grash.repository.SafetyInstructionRepository;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;

import java.time.LocalDateTime;
import java.util.Arrays;
import java.util.List;
import java.util.Optional;

import static org.junit.jupiter.api.Assertions.*;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.ArgumentMatchers.anyLong;
import static org.mockito.Mockito.*;

@ExtendWith(MockitoExtension.class)
class SafetyInstructionServiceTest {

    @Mock
    private SafetyInstructionRepository safetyInstructionRepository;

    @Mock
    private VendorService vendorService;

    @Mock
    private ContractorEmployeeService contractorEmployeeService;

    @Mock
    private UserService userService;

    @InjectMocks
    private SafetyInstructionService safetyInstructionService;

    private SafetyInstruction testInstruction;
    private ContractorEmployee testEmployee;
    private Vendor testVendor;
    private Location testLocation;
    private OwnUser testInstructor;

    @BeforeEach
    void setUp() {
        testVendor = new Vendor();
        testVendor.setId(1L);
        testVendor.setCompanyName("Test Vendor");

        testLocation = new Location();
        testLocation.setId(1L);
        testLocation.setName("Test Location");

        testEmployee = new ContractorEmployee();
        testEmployee.setId(1L);
        testEmployee.setFirstName("John");
        testEmployee.setLastName("Doe");
        testEmployee.setVendor(testVendor);

        testInstructor = new OwnUser();
        testInstructor.setId(1L);
        testInstructor.setFirstName("Jane");
        testInstructor.setLastName("Smith");

        testInstruction = new SafetyInstruction();
        testInstruction.setId(1L);
        testInstruction.setTitle("Test Safety Instruction");
        testInstruction.setDescription("Test Description");
        testInstruction.setInstructionDate(LocalDateTime.now());
        testInstruction.setExpirationDate(LocalDateTime.now().plusMonths(12));
        testInstruction.setType(InstructionType.DOCUMENT);
        testInstruction.setInstructionMaterialUrl("https://example.com/test.pdf");
        testInstruction.setLocation(testLocation);
        testInstruction.setVendor(testVendor);
        testInstruction.setInstructor(testInstructor);
        testInstruction.setEmployee(testEmployee);
        testInstruction.setCompleted(false);
    }

    @Test
    void testCreateSafetyInstruction() {
        when(safetyInstructionRepository.save(any(SafetyInstruction.class))).thenReturn(testInstruction);

        SafetyInstruction created = safetyInstructionService.create(testInstruction);

        assertNotNull(created);
        assertEquals(testInstruction.getTitle(), created.getTitle());
        verify(safetyInstructionRepository, times(1)).save(testInstruction);
    }

    @Test
    void testCompleteInstruction() {
        when(safetyInstructionRepository.findById(anyLong())).thenReturn(Optional.of(testInstruction));
        when(safetyInstructionRepository.save(any(SafetyInstruction.class))).thenReturn(testInstruction);
        when(contractorEmployeeService.findById(anyLong())).thenReturn(Optional.of(testEmployee));
        when(contractorEmployeeService.update(anyLong(), any(ContractorEmployee.class))).thenReturn(testEmployee);

        SafetyInstruction completed = safetyInstructionService.completeInstruction(
            1L, "testSignature", "Test User", 1L
        );

        assertNotNull(completed);
        assertTrue(completed.isCompleted());
        assertNotNull(completed.getCompletionDate());
        assertEquals("testSignature", completed.getSignatureData());
        assertEquals("Test User", completed.getSignatureName());
        verify(safetyInstructionRepository, times(1)).findById(1L);
        verify(safetyInstructionRepository, times(1)).save(testInstruction);
    }

    @Test
    void testIsEmployeeInstructionValid_ValidInstruction() {
        testEmployee.setCurrentSafetyInstruction(testInstruction);
        testInstruction.setCompleted(true);
        testInstruction.setExpirationDate(LocalDateTime.now().plusDays(30));

        when(contractorEmployeeService.findById(anyLong())).thenReturn(Optional.of(testEmployee));

        boolean isValid = safetyInstructionService.isEmployeeInstructionValid(1L);

        assertTrue(isValid);
    }

    @Test
    void testIsEmployeeInstructionValid_ExpiredInstruction() {
        testEmployee.setCurrentSafetyInstruction(testInstruction);
        testInstruction.setCompleted(true);
        testInstruction.setExpirationDate(LocalDateTime.now().minusDays(1));

        when(contractorEmployeeService.findById(anyLong())).thenReturn(Optional.of(testEmployee));

        boolean isValid = safetyInstructionService.isEmployeeInstructionValid(1L);

        assertFalse(isValid);
    }

    @Test
    void testIsEmployeeInstructionValid_NoInstruction() {
        testEmployee.setCurrentSafetyInstruction(null);

        when(contractorEmployeeService.findById(anyLong())).thenReturn(Optional.of(testEmployee));

        boolean isValid = safetyInstructionService.isEmployeeInstructionValid(1L);

        assertFalse(isValid);
    }

    @Test
    void testIsEmployeeInstructionValid_IncompleteInstruction() {
        testEmployee.setCurrentSafetyInstruction(testInstruction);
        testInstruction.setCompleted(false);
        testInstruction.setExpirationDate(LocalDateTime.now().plusDays(30));

        when(contractorEmployeeService.findById(anyLong())).thenReturn(Optional.of(testEmployee));

        boolean isValid = safetyInstructionService.isEmployeeInstructionValid(1L);

        assertFalse(isValid);
    }

    @Test
    void testFindExpiredInstructions() {
        LocalDateTime now = LocalDateTime.now();
        SafetyInstruction expiredInstruction = new SafetyInstruction();
        expiredInstruction.setId(2L);
        expiredInstruction.setTitle("Expired Instruction");
        expiredInstruction.setCompleted(true);
        expiredInstruction.setExpirationDate(now.minusDays(1));

        List<SafetyInstruction> expiredInstructions = Arrays.asList(expiredInstruction);

        when(safetyInstructionRepository.findByExpirationDateBeforeAndCompletedTrue(any(LocalDateTime.class)))
            .thenReturn(expiredInstructions);

        List<SafetyInstruction> result = safetyInstructionService.findExpiredInstructions();

        assertNotNull(result);
        assertEquals(1, result.size());
        assertEquals(expiredInstruction.getTitle(), result.get(0).getTitle());
    }

    @Test
    void testFindByEmployee() {
        List<SafetyInstruction> employeeInstructions = Arrays.asList(testInstruction);

        when(safetyInstructionRepository.findByEmployee_Id(anyLong())).thenReturn(employeeInstructions);

        List<SafetyInstruction> result = safetyInstructionService.findByEmployee(1L);

        assertNotNull(result);
        assertEquals(1, result.size());
        assertEquals(testInstruction.getTitle(), result.get(0).getTitle());
    }

    @Test
    void testFindByVendor() {
        List<SafetyInstruction> vendorInstructions = Arrays.asList(testInstruction);

        when(safetyInstructionRepository.findByVendor_Id(anyLong())).thenReturn(vendorInstructions);

        List<SafetyInstruction> result = safetyInstructionService.findByVendor(1L);

        assertNotNull(result);
        assertEquals(1, result.size());
        assertEquals(testInstruction.getTitle(), result.get(0).getTitle());
    }
}