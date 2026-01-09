package com.grash.service;

import com.grash.model.*;
import com.grash.model.enums.RoleType;
import com.grash.repository.WorkOrderRepository;
import com.grash.utils.Helper;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;

import java.util.Arrays;
import java.util.Locale;

import static org.junit.jupiter.api.Assertions.*;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.ArgumentMatchers.anyLong;
import static org.mockito.Mockito.*;

@ExtendWith(MockitoExtension.class)
class WorkOrderServiceSafetyInstructionTest {

    @Mock
    private WorkOrderRepository workOrderRepository;

    @Mock
    private SafetyInstructionService safetyInstructionService;

    @Mock
    private NotificationService notificationService;

    @Mock
    private UserService userService;

    @InjectMocks
    private WorkOrderService workOrderService;

    private WorkOrder testWorkOrder;
    private ContractorEmployee testEmployee;
    private Company testCompany;
    private OwnUser testCreator;

    @BeforeEach
    void setUp() {
        testCompany = new Company();
        testCompany.setId(1L);
        testCompany.setName("Test Company");

        testCreator = new OwnUser();
        testCreator.setId(1L);
        testCreator.setFirstName("John");
        testCreator.setLastName("Doe");
        testCreator.setCompany(testCompany);

        Role role = new Role();
        role.setRoleType(RoleType.ROLE_ADMIN);
        testCreator.setRole(role);

        testEmployee = new ContractorEmployee();
        testEmployee.setId(1L);
        testEmployee.setFirstName("Jane");
        testEmployee.setLastName("Smith");

        testWorkOrder = new WorkOrder();
        testWorkOrder.setId(1L);
        testWorkOrder.setTitle("Test Work Order");
        testWorkOrder.setCompany(testCompany);
        testWorkOrder.setCreatedBy(1L);
        testWorkOrder.setAssignedToEmployee(testEmployee);
    }

    @Test
    void testCheckContractorEmployeeSafetyInstruction_Valid() {
        when(safetyInstructionService.isEmployeeInstructionValid(anyLong())).thenReturn(true);

        boolean isValid = workOrderService.checkContractorEmployeeSafetyInstruction(testWorkOrder);

        assertTrue(isValid);
        verify(safetyInstructionService, times(1)).isEmployeeInstructionValid(1L);
    }

    @Test
    void testCheckContractorEmployeeSafetyInstruction_Invalid() {
        when(safetyInstructionService.isEmployeeInstructionValid(anyLong())).thenReturn(false);

        boolean isValid = workOrderService.checkContractorEmployeeSafetyInstruction(testWorkOrder);

        assertFalse(isValid);
        verify(safetyInstructionService, times(1)).isEmployeeInstructionValid(1L);
    }

    @Test
    void testCheckContractorEmployeeSafetyInstruction_NoEmployee() {
        testWorkOrder.setAssignedToEmployee(null);

        boolean isValid = workOrderService.checkContractorEmployeeSafetyInstruction(testWorkOrder);

        assertTrue(isValid); // Should return true when no contractor employee is assigned
        verify(safetyInstructionService, never()).isEmployeeInstructionValid(anyLong());
    }

    @Test
    void testCheckAndWarnContractorEmployeeSafetyInstruction_Valid() {
        when(safetyInstructionService.isEmployeeInstructionValid(anyLong())).thenReturn(true);

        workOrderService.checkAndWarnContractorEmployeeSafetyInstruction(testWorkOrder, Locale.GERMAN);

        verify(safetyInstructionService, times(1)).isEmployeeInstructionValid(1L);
        verify(notificationService, never()).create(any(), anyBoolean(), anyString());
    }

    @Test
    void testCheckAndWarnContractorEmployeeSafetyInstruction_Invalid() {
        when(safetyInstructionService.isEmployeeInstructionValid(anyLong())).thenReturn(false);
        when(userService.findById(anyLong())).thenReturn(java.util.Optional.of(testCreator));

        workOrderService.checkAndWarnContractorEmployeeSafetyInstruction(testWorkOrder, Locale.GERMAN);

        verify(safetyInstructionService, times(1)).isEmployeeInstructionValid(1L);
        verify(notificationService, times(1)).create(any(Notification.class), anyBoolean(), anyString());
        verify(userService, times(1)).findById(1L);
    }

    @Test
    void testCheckAndWarnContractorEmployeeSafetyInstruction_NoEmployee() {
        testWorkOrder.setAssignedToEmployee(null);

        workOrderService.checkAndWarnContractorEmployeeSafetyInstruction(testWorkOrder, Locale.GERMAN);

        verify(safetyInstructionService, never()).isEmployeeInstructionValid(anyLong());
        verify(notificationService, never()).create(any(), anyBoolean(), anyString());
    }

    @Test
    void testCheckAndWarnContractorEmployeeSafetyInstruction_CreatorNotFound() {
        when(safetyInstructionService.isEmployeeInstructionValid(anyLong())).thenReturn(false);
        when(userService.findById(anyLong())).thenReturn(java.util.Optional.empty());

        workOrderService.checkAndWarnContractorEmployeeSafetyInstruction(testWorkOrder, Locale.GERMAN);

        verify(safetyInstructionService, times(1)).isEmployeeInstructionValid(1L);
        verify(userService, times(1)).findById(1L);
        verify(notificationService, never()).create(any(), anyBoolean(), anyString());
    }
}