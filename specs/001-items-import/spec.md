# Feature Specification: Items Import via Excel/CSV

**Feature Branch**: `001-items-import`
**Created**: 2026-01-14
**Status**: Draft
**Input**: User description: "On the items page, I need to implement a new feature that allows the user to import items using an Excel or CSV file."

## User Scenarios & Testing _(mandatory)_

### User Story 1 - Import Items from File (Priority: P1)

An administrator or supervisor needs to bulk-add inventory items to the system from an existing spreadsheet. Instead of manually creating items one by one, they upload an Excel (.xlsx) or CSV file containing item data, and the system creates all valid items in a single operation.

**Why this priority**: This is the core functionality that delivers the primary value of the feature—saving significant time when onboarding new items or migrating from another system. Without this, the feature has no value.

**Independent Test**: Can be fully tested by uploading a valid file with 10 items and verifying all items appear in the items list with correct data.

**Acceptance Scenarios**:

1. **Given** the user is on the items page and has permission to edit items, **When** they click the "Import" button, **Then** an import dialog opens allowing file selection
2. **Given** the import dialog is open, **When** the user uploads a valid Excel file with 50 items, **Then** all 50 items are created and a success message shows "50 items imported successfully"
3. **Given** the import dialog is open, **When** the user uploads a valid CSV file with item data, **Then** the system parses and imports all valid items

---

### User Story 2 - Download Import Template (Priority: P2)

A user who wants to import items needs to know the exact format required. They can download a template file (Excel or CSV) that shows the required columns, expected data formats, and example data to guide them in preparing their import file.

**Why this priority**: Without a template, users would need to guess the format, leading to import failures and frustration. This is essential for a good user experience but isn't the core import functionality.

**Independent Test**: Can be fully tested by downloading the template and verifying it opens correctly with all required columns and sample data.

**Acceptance Scenarios**:

1. **Given** the user opens the import dialog, **When** they click "Download Template", **Then** a template file is downloaded to their device
2. **Given** the user opens the downloaded template, **When** they view the contents, **Then** they see column headers (Code, Name, Unit, Category, Subcategory) and sample data rows
3. **Given** the user fills in the template with their items, **When** they upload the completed file, **Then** the import succeeds without format errors

---

### User Story 3 - Handle Import Errors Gracefully (Priority: P2)

When importing items, some rows may have validation errors (missing required fields, invalid unit values, duplicate codes). The system provides a clear error report showing which rows failed and why, while still importing the valid rows.

**Why this priority**: Error handling is critical for real-world usage where data is rarely perfect. Users need to understand what went wrong to fix their data.

**Independent Test**: Can be tested by uploading a file with intentional errors and verifying the error report accurately identifies each issue.

**Acceptance Scenarios**:

1. **Given** a file with 10 items where 2 have missing required fields, **When** the user imports the file, **Then** 8 items are imported and a report shows the 2 failures with specific error messages
2. **Given** a file with a row containing an invalid unit value "GALLONS", **When** the user imports, **Then** that row fails with error "Invalid unit. Must be one of: KG, EA, LTR, BOX, CASE, PACK"
3. **Given** a file with an item code that already exists in the system, **When** the user imports, **Then** that row fails with error "Item code 'XYZ-001' already exists"

---

### User Story 4 - Preview Before Import (Priority: P3)

Before committing the import, users can preview the parsed data to verify it looks correct. This helps catch issues like wrong column mapping or encoding problems before creating records.

**Why this priority**: Nice-to-have for added confidence, but experienced users may skip this step. The error handling in P2 catches issues anyway.

**Independent Test**: Can be tested by uploading a file and verifying the preview shows accurate data before confirming import.

**Acceptance Scenarios**:

1. **Given** the user uploads a file, **When** parsing completes, **Then** a preview table shows the first 10 rows of data before import
2. **Given** the preview is displayed, **When** the user clicks "Cancel", **Then** no items are imported and the dialog closes
3. **Given** the preview is displayed, **When** the user clicks "Confirm Import", **Then** the import proceeds with the previewed data

---

### Edge Cases

- What happens when the file is empty (headers only, no data rows)?
  → System shows "No items to import. File contains only headers."

- What happens when the file has no headers or unrecognized columns?
  → System shows "Invalid file format. Required columns not found: Code, Name, Unit"

- What happens when the file exceeds the maximum row limit?
  → System shows "File contains X rows. Maximum allowed is 1000 rows per import."

- What happens when the file is corrupted or not a valid Excel/CSV?
  → System shows "Unable to parse file. Please ensure it is a valid Excel (.xlsx) or CSV file."

- What happens when the user uploads while offline?
  → Import button is disabled with tooltip "Import requires internet connection"

- How are duplicate codes within the same import file handled?
  → Only the first occurrence is imported; subsequent duplicates fail with "Duplicate code in import file"

## Requirements _(mandatory)_

### Functional Requirements

- **FR-001**: System MUST allow users with item editing permissions to access the import feature
- **FR-002**: System MUST accept Excel (.xlsx) and CSV file formats for import
- **FR-003**: System MUST validate that uploaded files contain the required columns: Code, Name, Unit
- **FR-004**: System MUST validate that Unit values match allowed options: KG, EA, LTR, BOX, CASE, PACK
- **FR-005**: System MUST reject item codes that already exist in the database
- **FR-006**: System MUST reject duplicate item codes within the same import file
- **FR-007**: System MUST provide a downloadable template file with correct column headers and example data
- **FR-008**: System MUST display a summary after import showing: items imported successfully, items failed, total items processed
- **FR-009**: System MUST display specific error messages for each failed row, including row number and reason
- **FR-010**: System MUST support Category and Subcategory as optional columns
- **FR-011**: System MUST set is_active to true for all newly imported items
- **FR-012**: System MUST limit imports to a maximum of 1000 rows per file
- **FR-013**: System MUST handle both comma-separated and semicolon-separated CSV files
- **FR-014**: System MUST strip leading/trailing whitespace from all imported values
- **FR-015**: System MUST treat the first row of the file as column headers

### Key Entities

- **Item**: The primary entity being imported. Key attributes: code (unique identifier), name (display name), unit (measurement unit from predefined list), category (optional grouping), sub_category (optional sub-grouping), is_active (defaults to true)
- **Import Job** (transient): Represents a single import operation. Tracks: file name, total rows, successful imports, failed rows with error details, timestamp, user who initiated

## Success Criteria _(mandatory)_

### Measurable Outcomes

- **SC-001**: Users can import 100 items in under 30 seconds
- **SC-002**: Users can prepare a valid import file using the template without external documentation
- **SC-003**: 95% of import errors are understandable from the error message alone (no need to contact support)
- **SC-004**: Users who previously entered items manually reduce item creation time by 80% when using bulk import
- **SC-005**: Import success rate for properly formatted files exceeds 99%
- **SC-006**: Users can identify and fix file errors within 2 attempts using provided error messages

## Assumptions

- Users have access to spreadsheet software (Excel, Google Sheets, LibreOffice) to edit templates
- Item codes are unique across the entire system (not per-location)
- The import creates items globally; location-specific stock data is managed separately
- No approval workflow is required for item imports (unlike transfers or PRFs)
- Import is an Admin/Supervisor function; regular Operators cannot import items
