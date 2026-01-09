# Konzept für Fremdfirmen-Sicherheitsunterweisung

## Übersicht

Dieses Konzept beschreibt die Erweiterung des Lieferantenmoduls um eine Funktion zur Verwaltung von standortspezifischen Sicherheitsunterweisungen für Mitarbeiter von Fremdfirmen. Die Erweiterung soll nahtlos in das bestehende System integriert werden und die folgenden Hauptfunktionen bieten:

## Aktuelle Systemanalyse

### Backend-Struktur
- **VendorController**: Verwaltet CRUD-Operationen für Lieferanten
- **Vendor-Model**: Enthält grundlegende Lieferanteninformationen wie companyName, description, rate, etc.
- **Beziehungen**: Lieferanten können mit Assets, Standorten und Teilen verknüpft werden

### Frontend-Struktur
- **Vendor-Slice**: Verwaltet den Zustand und API-Aufrufe für Lieferanten
- **Vendor-Model**: Definiert die Lieferanten-Schnittstelle mit Feldern wie companyName, address, phone, etc.

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
    private Vendor vendor; // Zugehörige Fremdfirma
    
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
    private VendorEmployee employee; // Unterwiesener Mitarbeiter
    
    private boolean completed;
    private LocalDateTime completionDate;
    private String signatureData; // Elektronische Signatur
    private String signatureName; // Name des Unterzeichners
}
```

**Erweiterung Vendor-Model**
```java
@Entity
public class Vendor {
    // Bestehende Felder...
    
    @OneToMany(mappedBy = "vendor")
    private List<SafetyInstruction> safetyInstructions = new ArrayList<>();
    
    @OneToMany(mappedBy = "vendor")
    private List<VendorEmployee> employees = new ArrayList<>();
}
```

**Neue Entität: VendorEmployee**
```java
@Entity
public class VendorEmployee {
    @Id
    @GeneratedValue(strategy = GenerationType.AUTO)
    private Long id;
    
    @ManyToOne
    private Vendor vendor;
    
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
- `GET /safety-instructions/vendor/{vendorId}` - Alle Unterweisungen eines Lieferanten
- `GET /safety-instructions/employee/{employeeId}` - Unterweisungen eines Mitarbeiters
- `PATCH /safety-instructions/{id}/complete` - Unterweisung als abgeschlossen markieren mit Signatur
- `GET /safety-instructions/expired` - Abgelaufene Unterweisungen abrufen
- `POST /safety-instructions/upload` - Dokument/Video hochladen

**Erweiterte Vendor-Endpunkte**
- `GET /vendors/{id}/employees` - Alle Mitarbeiter eines Lieferanten
- `POST /vendors/{id}/employees` - Neuen Mitarbeiter hinzufügen
- `GET /vendors/{id}/safety-instructions` - Alle Sicherheitsunterweisungen eines Lieferanten

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

### 5. Fremdfirmen-Kalender

#### Datenmodell
```java
@Entity
public class VendorCalendarEntry {
    @Id
    @GeneratedValue(strategy = GenerationType.AUTO)
    private Long id;
    
    @ManyToOne
    private Vendor vendor;
    
    @ManyToOne
    private WorkOrder workOrder; // Verknüpfung mit Arbeitsaufträgen
    
    @ManyToOne
    private VendorEmployee employee; // Zugewiesener Mitarbeiter
    
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
- **Farbcodierung** nach Status und Lieferant
- **Drag-and-Drop** für Terminänderungen
- **Detailansicht** mit allen relevanten Informationen
- **Exportfunktion** (iCal, PDF)
- **Integration mit Work Order Modul** für direkte Zuweisung

## Technische Implementierung

### Backend-Implementierung

1. **Neue Entitäten und Repositories**
   - `SafetyInstruction`, `SafetyInstructionRepository`
   - `VendorEmployee`, `VendorEmployeeRepository`
   - `VendorCalendarEntry`, `VendorCalendarEntryRepository`

2. **Neue Services**
   - `SafetyInstructionService` mit Logik für Gültigkeit und Ablaufprüfung
   - `VendorEmployeeService` für Mitarbeiterverwaltung
   - `VendorCalendarService` für Kalenderfunktionalität

3. **Erweiterte Services**
   - `VendorService`: Erweiterung um Mitarbeiter- und Unterweisungsmanagement
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
   - `VendorEmployeeManagement`: Mitarbeiterverwaltung
   - `VendorCalendar`: Kalenderkomponente mit Filter- und Exportfunktionen
   - `SignaturePad`: Komponente für elektronische Signatur

2. **Erweiterte Komponenten**
   - `VendorDetail`: Integration von Unterweisungs- und Mitarbeiter-Tabs
   - `WorkOrderForm`: Warnung bei Zuweisung von Mitarbeitern mit abgelaufener Unterweisung

3. **Neue Redux-Slices**
   - `safetyInstructionSlice`: Zustandmanagement für Unterweisungen
   - `vendorEmployeeSlice`: Zustandmanagement für Mitarbeiter
   - `vendorCalendarSlice`: Zustandmanagement für Kalender

4. **Neue API-Endpunkte**
   - Integration aller neuen Backend-Endpunkte
   - Erweiterte Fehlerbehandlung für Unterweisungsvalidierung

## Datenbank-Migrationen

1. **Neue Tabellen**
   - `T_Safety_Instructions`
   - `T_Vendor_Employees`
   - `T_Vendor_Calendar_Entries`

2. **Tabellen-Erweiterungen**
   - `T_Vendors`: Fremdschlüssel für neue Beziehungen

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
   - Mitarbeiter können standortspezifische Unterweisungen durchführen
   - Unterweisungen können mit Dokumenten/Videos verknüpft werden
   - Elektronische Signatur und Gültigkeitsverfolgung funktionieren
   - Ablaufwarnungen werden korrekt angezeigt
   - Kalender zeigt alle relevanten Informationen an

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

## Nächste Schritte

1. **Detailliertes technisches Design** für jede Komponente
2. **Datenbank-Schema finalisieren** und Migrationsskripte erstellen
3. **Backend-Implementierung** der neuen Entitäten und Services
4. **Frontend-Implementierung** der neuen Komponenten
5. **Integrationstests** und Benutzerakzeptanztests
6. **Dokumentation** für Administratoren und Benutzer

Dieses Konzept bietet eine umfassende Grundlage für die Implementierung der Fremdfirmen-Sicherheitsunterweisungsfunktionalität und stellt sicher, dass die Erweiterung nahtlos in das bestehende Lieferantenmodul integriert wird, ohne dessen bestehende Funktionalität zu beeinträchtigen.