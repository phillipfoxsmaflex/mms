package com.grash.controller;

import com.grash.model.ContractorEmployee;
import com.grash.model.Location;
import com.grash.model.OwnUser;
import com.grash.model.SafetyInstruction;
import com.grash.model.Vendor;
import com.grash.model.enums.InstructionType;
import com.grash.service.SafetyInstructionService;
import com.grash.service.UserService;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;

import javax.servlet.http.HttpServletRequest;
import java.time.LocalDateTime;
import java.util.Arrays;
import java.util.List;
import java.util.Optional;

import static org.junit.jupiter.api.Assertions.*;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.ArgumentMatchers.anyLong;
import static org.mockito.Mockito.*;

@ExtendWith(MockitoExtension.class)
class SafetyInstructionControllerTest {

    @Mock
    private SafetyInstructionService safetyInstructionService;

    @Mock
    private UserService userService;

    @Mock
    private HttpServletRequest request;

    @InjectMocks
    private SafetyInstructionController safetyInstructionController;

    private SafetyInstruction testInstruction;
    private ContractorEmployee testEmployee;
    private Vendor testVendor;
    private Location testLocation;
    private OwnUser testUser;

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

        testUser = new OwnUser();
        testUser.setId(1L);
        testUser.setFirstName("Jane");
        testUser.setLastName("Smith");

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
        testInstruction.setInstructor(testUser);
        testInstruction.setEmployee(testEmployee);
        testInstruction.setCompleted(false);
    }

    @Test
    void testGetById_Success() {
        when(userService.whoami(request)).thenReturn(testUser);
        when(safetyInstructionService.findById(anyLong())).thenReturn(Optional.of(testInstruction));

        SafetyInstruction result = safetyInstructionController.getById(1L, request);

        assertNotNull(result);
        assertEquals(testInstruction.getTitle(), result.getTitle());
        verify(safetyInstructionService, times(1)).findById(1L);
    }

    @Test
    void testGetByVendor_Success() {
        List<SafetyInstruction> instructions = Arrays.asList(testInstruction);
        when(userService.whoami(request)).thenReturn(testUser);
        when(safetyInstructionService.findByVendor(anyLong())).thenReturn(instructions);

        List<SafetyInstruction> result = safetyInstructionController.getByVendor(1L, request);

        assertNotNull(result);
        assertEquals(1, result.size());
        assertEquals(testInstruction.getTitle(), result.get(0).getTitle());
        verify(safetyInstructionService, times(1)).findByVendor(1L);
    }

    @Test
    void testGetByEmployee_Success() {
        List<SafetyInstruction> instructions = Arrays.asList(testInstruction);
        when(userService.whoami(request)).thenReturn(testUser);
        when(safetyInstructionService.findByEmployee(anyLong())).thenReturn(instructions);

        List<SafetyInstruction> result = safetyInstructionController.getByEmployee(1L, request);

        assertNotNull(result);
        assertEquals(1, result.size());
        assertEquals(testInstruction.getTitle(), result.get(0).getTitle());
        verify(safetyInstructionService, times(1)).findByEmployee(1L);
    }

    @Test
    void testGetExpiredInstructions_Success() {
        List<SafetyInstruction> instructions = Arrays.asList(testInstruction);
        when(userService.whoami(request)).thenReturn(testUser);
        when(safetyInstructionService.findExpiredInstructions()).thenReturn(instructions);

        List<SafetyInstruction> result = safetyInstructionController.getExpiredInstructions(request);

        assertNotNull(result);
        assertEquals(1, result.size());
        assertEquals(testInstruction.getTitle(), result.get(0).getTitle());
        verify(safetyInstructionService, times(1)).findExpiredInstructions();
    }

    @Test
    void testCreate_Success() {
        when(userService.whoami(request)).thenReturn(testUser);
        when(safetyInstructionService.create(any(SafetyInstruction.class))).thenReturn(testInstruction);

        SafetyInstruction result = safetyInstructionController.create(testInstruction, request);

        assertNotNull(result);
        assertEquals(testInstruction.getTitle(), result.getTitle());
        verify(safetyInstructionService, times(1)).create(testInstruction);
    }

    @Test
    void testCompleteInstruction_Success() {
        when(userService.whoami(request)).thenReturn(testUser);
        when(safetyInstructionService.findById(anyLong())).thenReturn(Optional.of(testInstruction));
        when(safetyInstructionService.completeInstruction(anyLong(), anyString(), anyString(), anyLong()))
            .thenReturn(testInstruction);

        SafetyInstruction result = safetyInstructionController.completeInstruction(
            1L, "testSignature", "Test User", request
        );

        assertNotNull(result);
        assertTrue(result.isCompleted());
        verify(safetyInstructionService, times(1)).completeInstruction(1L, "testSignature", "Test User", 1L);
    }

    @Test
    void testDelete_Success() {
        when(userService.whoami(request)).thenReturn(testUser);
        when(safetyInstructionService.findById(anyLong())).thenReturn(Optional.of(testInstruction));
        doNothing().when(safetyInstructionService).delete(anyLong());

        ResponseEntity<?> result = safetyInstructionController.delete(1L, request);

        assertNotNull(result);
        assertEquals(HttpStatus.OK, result.getStatusCode());
        verify(safetyInstructionService, times(1)).delete(1L);
    }

    @Test
    void testIsEmployeeInstructionValid_Success() {
        when(userService.whoami(request)).thenReturn(testUser);
        when(safetyInstructionService.isEmployeeInstructionValid(anyLong())).thenReturn(true);

        boolean result = safetyInstructionController.isEmployeeInstructionValid(1L, request);

        assertTrue(result);
        verify(safetyInstructionService, times(1)).isEmployeeInstructionValid(1L);
    }
}