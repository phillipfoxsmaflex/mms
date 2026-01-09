# Konzept für Auftragnehmer-Sicherheitsunterweisung

## Übersicht

Dieses Konzept beschreibt die Erweiterung des Auftragnehmermoduls um eine Funktion zur Verwaltung von standortspezifischen Sicherheitsunterweisungen für Mitarbeiter von Auftragnehmern. Die Erweiterung soll nahtlos in das bestehende System integriert werden und die folgenden Hauptfunktionen bieten:

## Aktuelle Systemanalyse

### Backend-Struktur
- **ContractorController**: Verwaltet CRUD-Operationen für Auftragnehmer
- **Contractor-Model**: Enthält grundlegende Auftragnehmerinformationen wie companyName, description, rate, etc.
- **Beziehungen**: Auftragnehmer können mit Assets, Standorten und Teilen verknüpft werden

### Frontend-Struktur
- **Contractor-Slice**: Verwaltet den Zustand und API-Aufrufe für Auftragnehmer
- **Contractor-Model**: Definiert die Auftragnehmer-Schnittstelle mit Feldern wie companyName, address, phone, etc.

## Neue Funktionalitäten

### 1. Sicherheitsunterweisungs-Management

#### Datenmodell-Erweiterungen

**Neue Entität: SafetyInstruction**
```java
@Entity
public class SafetyInstruction {
    @Id
    @GeneratedValue(strategy = GenerationType.AUTO)
    private Long id;
    
    @ManyToOne
    private Location location; // Standortspezifische Unterweisung
    
    @ManyToOne
    private Contractor contractor; // Zugehöriger Auftragnehmer
    
    private String title;
    private String description;
    private LocalDateTime instructionDate;
    private LocalDateTime expirationDate; // Standard: 12 Monate ab Unterweisungsdatum
    
    @Enumerated(EnumType.STRING)
    private InstructionType type; // VIDEO, DOCUMENT, LINK
    
    private String instructionMaterialUrl; // URL zu Dokument/Video
    private String instructionMaterialFileId; // Referenz auf hochgeladenes File
    
    @ManyToOne
    private OwnUser instructor; // Durchführender
    
    @ManyToOne
    private ContractorEmployee employee; // Unterwiesener Mitarbeiter
    
    private boolean completed;
    private LocalDateTime completionDate;
    private String signatureData; // Elektronische Signatur
    private String signatureName; // Name des Unterzeichners
}
```

**Erweiterung Contractor-Model**
```java
@Entity
public class Contractor {
    // Bestehende Felder...
    
    @OneToMany(mappedBy = "contractor")
    private List<SafetyInstruction> safetyInstructions = new ArrayList<>();
    
    @OneToMany(mappedBy = "contractor")
    private List<ContractorEmployee> employees = new ArrayList<>();
}
```

**Neue Entität: ContractorEmployee**
```java
@Entity
public class ContractorEmployee {
    @Id
    @GeneratedValue(strategy = GenerationType.AUTO)
    private Long id;
    
    @ManyToOne
    private Contractor contractor;
    
    private String firstName;
    private String lastName;
    private String email;
    private String phone;
    private String position;
    
    // Referenz auf aktuelle gültige Unterweisung
    @ManyToOne
    private SafetyInstruction currentSafetyInstruction;
}
```

#### API-Erweiterungen

**Neue Controller-Endpunkte**
- `POST /safety-instructions` - Neue Sicherheitsunterweisung erstellen
- `GET /safety-instructions/{id}` - Einzelne Unterweisung abrufen
- `GET /safety-instructions/contractor/{contractorId}` - Alle Unterweisungen eines Auftragnehmers
- `GET /safety-instructions/employee/{employeeId}` - Unterweisungen eines Mitarbeiters
- `PATCH /safety-instructions/{id}/complete` - Unterweisung als abgeschlossen markieren mit Signatur
- `GET /safety-instructions/expired` - Abgelaufene Unterweisungen abrufen
- `POST /safety-instructions/upload` - Dokument/Video hochladen

**Erweiterte Contractor-Endpunkte**
- `GET /contractors/{id}/employees` - Alle Mitarbeiter eines Auftragnehmers
- `POST /contractors/{id}/employees` - Neuen Mitarbeiter hinzufügen
- `GET /contractors/{id}/safety-instructions` - Alle Sicherheitsunterweisungen eines Auftragnehmers

### 2. Dokumenten- und Video-Upload

#### Technische Umsetzung
- Nutzung des bestehenden FileService für Dateiuploads
- Erweiterung um spezifische Validierung für Sicherheitsunterweisungsmaterialien
- Unterstützung für:
  - PDF-Dokumente
  - Video-Dateien (MP4, WebM)
  - Externe Links (URL-Validierung)

#### Frontend-Integration
- Dateiupload-Komponente mit Drag-and-Drop
- Vorschau-Funktion für hochgeladene Dokumente/Videos
- Link-Validierung für externe Ressourcen

### 3. Elektronische Signatur

#### Signatur-Erfassung
- Canvas-basierte Signatur-Erfassung im Frontend
- Speicherung als Base64-String in der Datenbank
- Zusätzliche Speicherung des Namens des Unterzeichners
- Zeitstempel der Unterzeichnung

#### Signatur-Anzeige
- Anzeige der Signatur in der Unterweisungsdetailansicht
- Exportfunktion für signierte Unterweisungsnachweise

### 4. Gültigkeitsverfolgung und Ablaufwarnungen

#### Gültigkeitslogik
- Standard-Gültigkeit: 12 Monate ab Abschlussdatum
- Automatische Berechnung des Ablaufdatums
- Täglicher Cron-Job zur Überprüfung ablaufender Unterweisungen

#### Warnungen und Benachrichtigungen
- **Work Order Integration**: Warnung bei Zuweisung von Mitarbeitern mit abgelaufener Unterweisung
- **Dashboard-Anzeige**: Übersicht ablaufender/abgelaufener Unterweisungen
- **E-Mail-Benachrichtigungen**: Automatische Erinnerungen 30, 15 und 7 Tage vor Ablauf
- **Systembenachrichtigungen**: Push-Benachrichtigungen für zuständige Benutzer

### 5. Auftragnehmer-Kalender

#### Datenmodell
```java
@Entity
public class ContractorCalendarEntry {
    @Id
    @GeneratedValue(strategy = GenerationType.AUTO)
    private Long id;
    
    @ManyToOne
    private Contractor contractor;
    
    @ManyToOne
    private WorkOrder workOrder; // Verknüpfung mit Arbeitsaufträgen
    
    @ManyToOne
    private ContractorEmployee employee; // Zugewiesener Mitarbeiter
    
    @ManyToOne
    private OwnUser supervisor; // Zuständiger Betreuer
    
    private LocalDateTime startTime;
    private LocalDateTime endTime;
    private String description;
    private String locationDetails;
    
    @Enumerated(EnumType.STRING)
    private CalendarEntryStatus status; // PLANNED, IN_PROGRESS, COMPLETED, CANCELLED
}
```

#### Kalender-Funktionalitäten
- **Monats-/Wochen-/Tagesansicht** mit Filteroptionen
- **Farbcodierung** nach Status und Auftragnehmer
- **Drag-and-Drop** für Terminänderungen
- **Detailansicht** mit allen relevanten Informationen
- **Exportfunktion** (iCal, PDF)
- **Integration mit Work Order Modul** für direkte Zuweisung

## Technische Implementierung

### Backend-Implementierung

1. **Neue Entitäten und Repositories**
   - `SafetyInstruction`, `SafetyInstructionRepository`
   - `ContractorEmployee`, `ContractorEmployeeRepository`
   - `ContractorCalendarEntry`, `ContractorCalendarEntryRepository`

2. **Neue Services**
   - `SafetyInstructionService` mit Logik für Gültigkeit und Ablaufprüfung
   - `ContractorEmployeeService` für Mitarbeiterverwaltung
   - `ContractorCalendarService` für Kalenderfunktionalität

3. **Erweiterte Services**
   - `ContractorService`: Erweiterung um Mitarbeiter- und Unterweisungsmanagement
   - `WorkOrderService`: Integration von Unterweisungsprüfung bei Mitarbeiterzuweisung
   - `NotificationService`: Erweiterung um Unterweisungsbenachrichtigungen

4. **Geplante Jobs**
   - Täglicher Job zur Überprüfung ablaufender Unterweisungen
   - Wöchentlicher Job für Benachrichtigungen

### Frontend-Implementierung

1. **Neue Komponenten**
   - `SafetyInstructionList`: Übersicht aller Unterweisungen
   - `SafetyInstructionDetail`: Detailansicht mit Signaturfunktion
   - `SafetyInstructionForm`: Formular zum Erstellen/Bearbeiten von Unterweisungen
   - `ContractorEmployeeManagement`: Mitarbeiterverwaltung
   - `ContractorCalendar`: Kalenderkomponente mit Filter- und Exportfunktionen
   - `SignaturePad`: Komponente für elektronische Signatur

2. **Erweiterte Komponenten**
   - `ContractorDetail`: Integration von Unterweisungs- und Mitarbeiter-Tabs
   - `WorkOrderForm`: Warnung bei Zuweisung von Mitarbeitern mit abgelaufener Unterweisung

3. **Neue Redux-Slices**
   - `safetyInstructionSlice`: Zustandmanagement für Unterweisungen
   - `contractorEmployeeSlice`: Zustandmanagement für Mitarbeiter
   - `contractorCalendarSlice`: Zustandmanagement für Kalender

4. **Neue API-Endpunkte**
   - Integration aller neuen Backend-Endpunkte
   - Erweiterte Fehlerbehandlung für Unterweisungsvalidierung

## Datenbank-Migrationen

1. **Neue Tabellen**
   - `T_Safety_Instructions`
   - `T_Contractor_Employees`
   - `T_Contractor_Calendar_Entries`

2. **Tabellen-Erweiterungen**
   - `T_Contractors`: Fremdschlüssel für neue Beziehungen

## Sicherheitsaspekte

1. **Datenzugriff**
   - Berechtigungsprüfung für alle neuen Endpunkte
   - Rollenbasierte Zugriffskontrolle (nur autorisierte Benutzer können Unterweisungen erstellen/bearbeiten)

2. **Datenvalidierung**
   - Validierung aller Eingabedaten
   - Dateigrößen- und Typenbeschränkungen für Uploads
   - URL-Validierung für externe Links

3. **Audit-Logging**
   - Protokollierung aller Änderungen an Unterweisungen
   - Nachverfolgung von Signaturvorgängen

## Integration in bestehende Workflows

### Work Order Modul
1. **Mitarbeiterzuweisung**
   - Prüfung der aktuellen Unterweisungsgültigkeit
   - Warnmeldung bei abgelaufener oder fehlender Unterweisung
   - Blockierung der Zuweisung bei kritischen Sicherheitsverstößen (konfigurierbar)

2. **Kalenderintegration**
   - Automatische Erstellung von Kalendereinträgen bei Work Order Zuweisung
   - Synchronisation von Terminänderungen

### Benachrichtigungssystem
1. **E-Mail-Vorlagen**
   - Vorlagen für Ablaufwarnungen
   - Vorlagen für abgeschlossene Unterweisungen
   - Vorlagen für neue Zuweisungen

2. **Systembenachrichtigungen**
   - Push-Benachrichtigungen für mobile Apps
   - Dashboard-Warnungen für Administratoren

## Zeitplan und Priorisierung

### Phase 1: Grundlegende Funktionalität (4-6 Wochen)
- Datenmodell und Backend-Services
- Grundlegende Frontend-Komponenten
- Dokumentenupload und Signaturfunktion
- Grundlegende Kalenderansicht

### Phase 2: Integration und Erweiterungen (3-4 Wochen)
- Work Order Integration
- Benachrichtigungssystem
- Erweiterte Kalenderfunktionen
- Reporting und Export

### Phase 3: Test und Optimierung (2-3 Wochen)
- Umfassende Tests aller Komponenten
- Performance-Optimierung
- Benutzerfeedback und Anpassungen
- Dokumentation

## Erfolgskriterien

1. **Funktionale Anforderungen**
   - Mitarbeiter von Auftragnehmern können standortspezifische Unterweisungen durchführen
   - Unterweisungen können mit Dokumenten/Videos verknüpft werden
   - Elektronische Signatur und Gültigkeitsverfolgung funktionieren
   - Ablaufwarnungen werden korrekt angezeigt
   - Kalender zeigt alle relevanten Informationen für Auftragnehmer an

2. **Technische Anforderungen**
   - Nahtlose Integration in bestehendes System
   - Keine Beeinträchtigung bestehender Funktionalität
   - Gute Performance auch bei großen Datenmengen
   - Sichere Datenverarbeitung und -speicherung

3. **Benutzerakzeptanz**
   - Intuitive Bedienung
   - Klare Feedbackmechanismen
   - Gute Dokumentation und Schulungsmaterialien

## Risiken und Gegenmaßnahmen

1. **Datenmigration**
   - Risiko: Probleme bei der Migration bestehender Daten
   - Gegenmaßnahme: Umfassende Tests der Migrationsskripte

2. **Performance**
   - Risiko: Performance-Probleme durch zusätzliche Abfragen
   - Gegenmaßnahme: Optimierung von Datenbankabfragen und Caching

3. **Benutzerakzeptanz**
   - Risiko: Ablehnung der neuen Funktionalität durch Benutzer
   - Gegenmaßnahme: Frühzeitige Einbindung von Key-Usern in den Designprozess

4. **Sicherheit**
   - Risiko: Sicherheitslücken in neuen Komponenten
   - Gegenmaßnahme: Umfassende Sicherheitsreviews und Penetrationstests

## Offene Fragen und Entscheidungen

1. **Signatur-Implementierung**
   - Soll eine einfache Canvas-Signatur ausreichen oder benötigen wir eine qualifizierte elektronische Signatur?
   - Entscheidung: Canvas-Signatur mit Namensbestätigung für erste Version

2. **Dokumentenverwaltung**
   - Soll der bestehende FileService erweitert werden oder ein neues Modul erstellt werden?
   - Entscheidung: Erweiterung des bestehenden FileService

3. **Benachrichtigungsfrequenz**
   - Wie oft sollen Erinnerungen vor Ablauf gesendet werden?
   - Entscheidung: 30, 15 und 7 Tage vor Ablauf

4. **Work Order Blockierung**
   - Soll die Zuweisung bei abgelaufener Unterweisung komplett blockiert werden?
   - Entscheidung: Warnung mit Option zur Überbrückung (für Notfälle)

## Umsetzung

### Backend-Implementierung

#### Datenbankmodell
- **SafetyInstruction**: Entität für Sicherheitsunterweisungen mit Feldern für Titel, Beschreibung, Datum, Typ, Material-URL, Standort, Auftragnehmer, Durchführender, Mitarbeiter, Status und Signatur
- **ContractorEmployee**: Entität für Mitarbeiter von Auftragnehmern mit Feldern für Vorname, Nachname, E-Mail, Telefon, Position, Auftragnehmer und aktuelle Sicherheitsunterweisung
- **ContractorCalendarEntry**: Entität für Kalendereinträge mit Feldern für Auftragnehmer, Arbeitsauftrag, Mitarbeiter, Betreuer, Zeitraum, Beschreibung, Standortdetails und Status

#### Services
- **SafetyInstructionService**: Service für die Verwaltung von Sicherheitsunterweisungen mit Methoden für Erstellung, Aktualisierung, Abfrage, Löschung, Abschluss mit Signatur und Gültigkeitsprüfung
- **ContractorEmployeeService**: Service für die Verwaltung von Auftragnehmermitarbeitern mit Methoden für CRUD-Operationen und Abfrage nach Auftragnehmer
- **ContractorCalendarService**: Service für die Verwaltung von Kalendereinträgen mit Methoden für CRUD-Operationen, Abfrage nach verschiedenen Kriterien und Erstellung aus Arbeitsaufträgen

#### Controller
- **SafetyInstructionController**: REST-Controller mit Endpunkten für alle CRUD-Operationen, Abfrage nach Auftragnehmer/Mitarbeiter, abgelaufene Unterweisungen und Abschluss mit Signatur
- **ContractorEmployeeController**: REST-Controller mit Endpunkten für alle CRUD-Operationen und Abfrage nach Auftragnehmer
- **ContractorCalendarController**: REST-Controller mit Endpunkten für alle CRUD-Operationen, Abfrage nach verschiedenen Kriterien und Erstellung aus Arbeitsaufträgen

#### Integration mit WorkOrder
- **WorkOrder-Erweiterung**: Hinzufügung des Feldes `assignedToEmployee` zur WorkOrderBase-Entität
- **WorkOrderService-Erweiterung**: Methoden `checkContractorEmployeeSafetyInstruction` und `checkAndWarnContractorEmployeeSafetyInstruction` für die Prüfung der Gültigkeit von Sicherheitsunterweisungen bei der Zuweisung von Mitarbeitern
- **Automatische Warnungen**: Integration der Prüfung in den WorkOrder-Erstellungsprozess mit automatischen Benachrichtigungen bei abgelaufenen Unterweisungen

#### Benachrichtigungssystem
- **SafetyInstructionExpirationJob**: Geplanter Job, der täglich um 8 Uhr läuft und Warnungen für ablaufende Unterweisungen (30, 15, 7 Tage vor Ablauf) sowie abgelaufene Unterweisungen sendet
- **NotificationService-Erweiterung**: Methoden für die Verwaltung von Benachrichtigungen zu Sicherheitsunterweisungen
- **EmailService2-Integration**: Versand von E-Mail-Benachrichtigungen an Administratoren

### Frontend-Implementierung

#### Modelle
- **SafetyInstruction**: TypeScript-Interface für Sicherheitsunterweisungen
- **ContractorEmployee**: TypeScript-Interface für Auftragnehmermitarbeiter
- **ContractorCalendarEntry**: TypeScript-Interface für Kalendereinträge

#### Redux-Slices
- **safetyInstructionSlice**: Zustandmanagement für Sicherheitsunterweisungen mit Actions für CRUD-Operationen, Abfragen und Abschluss mit Signatur
- **contractorEmployeeSlice**: Zustandmanagement für Auftragnehmermitarbeiter mit Actions für CRUD-Operationen und Abfragen
- **contractorCalendarSlice**: Zustandmanagement für Kalendereinträge mit Actions für CRUD-Operationen, Abfragen und Erstellung aus Arbeitsaufträgen

#### Komponenten
- **SafetyInstructionList**: Liste aller Sicherheitsunterweisungen mit Filter- und Sortierfunktionen
- **SafetyInstructionDetail**: Detailansicht einer Sicherheitsunterweisung mit Signaturfunktion
- **SafetyInstructionForm**: Formular zum Erstellen und Bearbeiten von Sicherheitsunterweisungen
- **ContractorEmployeeList**: Liste aller Mitarbeiter von Auftragnehmern mit Statusanzeige für Sicherheitsunterweisungen
- **ContractorCalendar**: Kalenderansicht für Auftragnehmertermine mit Drag-and-Drop und Detailansicht
- **SignaturePad**: Komponente für die elektronische Signatur mit Canvas
- **SafetyInstructionDocumentUpload**: Komponente für den Upload von Unterweisungsmaterialien (PDF, Video)
- **WorkOrderSafetyInstructionWarning**: Warnkomponente für WorkOrder-Formulare bei abgelaufenen Sicherheitsunterweisungen
- **SafetyInstructionExpirationWarnings**: Dashboard-Komponente für die Anzeige abgelaufener Sicherheitsunterweisungen

#### Integration
- **WorkOrder-Formular**: Integration der Warnkomponente bei der Zuweisung von Auftragnehmermitarbeitern
- **Contractor-Detailansicht**: Integration von Tabs für Mitarbeiter, Sicherheitsunterweisungen und Kalender
- **Dashboard**: Integration der Warnungen für abgelaufene Sicherheitsunterweisungen

### Technische Details

#### Sicherheitsaspekte
- **Berechtigungsprüfung**: Alle neuen Endpunkte erfordern angemessene Berechtigungen (VENDORS_AND_CUSTOMERS)
- **Datenvalidierung**: Validierung aller Eingabedaten, Dateigrößen- und Typenbeschränkungen für Uploads
- **Audit-Logging**: Protokollierung aller Änderungen an Unterweisungen und Signaturvorgängen

#### Performance
- **Caching**: Implementierung von Caching für häufig abgerufene Daten
- **Asynchrone Verarbeitung**: Verwendung von @Async für Benachrichtigungen und Hintergrundjobs
- **Batch-Verarbeitung**: Effiziente Verarbeitung von Massenbenachrichtigungen

#### Dateiupload
- **Unterstützte Formate**: PDF-Dokumente, MP4- und WebM-Videos
- **Größenbeschränkung**: Maximale Dateigröße von 50MB
- **Speicherung**: Integration mit dem bestehenden FileService

#### Signaturfunktion
- **Canvas-basierte Erfassung**: Signaturerfassung mit HTML5 Canvas
- **Speicherung**: Speicherung als Base64-String in der Datenbank
- **Anzeige**: Anzeige der Signatur in der Detailansicht und auf Exportdokumenten

### Tests

#### Unit-Tests
- **SafetyInstructionServiceTest**: Tests für alle Methoden des SafetyInstructionService
- **WorkOrderServiceSafetyInstructionTest**: Tests für die Integration der Sicherheitsprüfung in WorkOrderService
- **SafetyInstructionControllerTest**: Tests für alle Endpunkte des SafetyInstructionController

#### Integrationstests
- **Datenbank-Integration**: Tests für die neuen Repository-Methoden
- **Service-Integration**: Tests für die Zusammenarbeit zwischen Services
- **API-Integration**: Tests für die REST-Endpunkte

#### Benutzerakzeptanztests
- **Formularvalidierung**: Tests für die Validierung von Formularen
- **Workflow-Tests**: Tests für den kompletten Workflow von der Erstellung bis zum Abschluss
- **Benachrichtigungstests**: Tests für das Benachrichtigungssystem

### Herausforderungen und Lösungen

1. **Datenmigration**: 
   - Herausforderung: Integration der neuen Entitäten in das bestehende Datenmodell
   - Lösung: Verwendung von JPA-Beziehungen und sorgfältige Planung der Datenbankmigration

2. **Performance-Optimierung**:
   - Herausforderung: Effiziente Abfrage großer Datenmengen
   - Lösung: Implementierung von Pagination, Caching und optimierten Datenbankabfragen

3. **Benutzerfreundlichkeit**:
   - Herausforderung: Komplexe Formulare und Workflows
   - Lösung: Schrittweise Führung, klare Fehlermeldungen und Hilfstexte

4. **Sicherheitsintegration**:
   - Herausforderung: Nahtlose Integration in bestehende Sicherheitsmechanismen
   - Lösung: Konsistente Verwendung der bestehenden Berechtigungsstruktur

### Erfolgskriterien

✅ **Funktionale Anforderungen**:
- Mitarbeiter von Auftragnehmern können standortspezifische Unterweisungen durchführen
- Unterweisungen können mit Dokumenten/Videos verknüpft werden
- Elektronische Signatur und Gültigkeitsverfolgung funktionieren
- Ablaufwarnungen werden korrekt angezeigt
- Kalender zeigt alle relevanten Informationen für Auftragnehmer an

✅ **Technische Anforderungen**:
- Nahtlose Integration in bestehendes System
- Keine Beeinträchtigung bestehender Funktionalität
- Gute Performance auch bei großen Datenmengen
- Sichere Datenverarbeitung und -speicherung

✅ **Benutzerakzeptanz**:
- Intuitive Bedienung
- Klare Feedbackmechanismen
- Gute Dokumentation und Schulungsmaterialien

### Nächste Schritte

1. **Deployment**: Bereitstellung der neuen Funktionalität in der Produktionsumgebung
2. **Schulung**: Schulung der Benutzer und Administratoren
3. **Monitoring**: Überwachung der Performance und Nutzung
4. **Feedback**: Sammlung von Benutzerfeedback für zukünftige Verbesserungen
5. **Wartung**: Regelmäßige Wartung und Updates

## Fazit

Die Implementierung der Auftragnehmer-Sicherheitsunterweisungsfunktionalität wurde erfolgreich abgeschlossen und bietet eine umfassende Lösung für die Verwaltung von Sicherheitsunterweisungen für Mitarbeiter von Auftragnehmern. Die Erweiterung integriert sich nahtlos in das bestehende System und erfüllt alle definierten Anforderungen. Durch die Kombination von Backend-Services, Frontend-Komponenten und automatisierten Benachrichtigungen wird ein robustes und benutzerfreundliches System bereitgestellt, das die Sicherheit am Arbeitsplatz verbessert und die Compliance-Anforderungen erfüllt.

Dieses Konzept bietet eine umfassende Grundlage für die Implementierung der Auftragnehmer-Sicherheitsunterweisungsfunktionalität und stellt sicher, dass die Erweiterung nahtlos in das bestehende Auftragnehmermodul integriert wird, ohne dessen bestehende Funktionalität zu beeinträchtigen.