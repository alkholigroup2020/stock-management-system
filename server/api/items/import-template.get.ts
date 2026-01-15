import * as XLSX from "xlsx";

/**
 * GET /api/items/import-template
 *
 * Downloads an import template file with correct column headers and sample data.
 * Supports both Excel (.xlsx) and CSV formats.
 *
 * Query Parameters:
 * - format: "xlsx" | "csv" (default: "xlsx")
 */
export default defineEventHandler(async (event) => {
  // Auth check - require Admin or Supervisor role
  const user = event.context.user;
  if (!user || !["ADMIN", "SUPERVISOR"].includes(user.role)) {
    throw createError({
      statusCode: 403,
      statusMessage: "Forbidden",
      data: {
        code: "FORBIDDEN",
        message: "Only administrators and supervisors can download import templates",
      },
    });
  }

  // Get format from query parameter
  const query = getQuery(event);
  const format = (query.format as string)?.toLowerCase() || "xlsx";

  if (format !== "xlsx" && format !== "csv") {
    throw createError({
      statusCode: 400,
      statusMessage: "Bad Request",
      data: {
        code: "INVALID_FORMAT",
        message: "Format must be 'xlsx' or 'csv'",
      },
    });
  }

  // Template data with headers and sample rows
  const templateData = [
    ["Code", "Name", "Unit", "Category", "Subcategory"],
    ["ITEM-001", "Sample Item 1", "KG", "Produce", "Vegetables"],
    ["ITEM-002", "Sample Item 2", "EA", "Supplies", "Cleaning"],
    ["ITEM-003", "Sample Item 3", "LTR", "Beverages", "Soft Drinks"],
  ];

  const timestamp = new Date().toISOString().split("T")[0];
  const filename = `items-import-template-${timestamp}`;

  if (format === "csv") {
    // Generate CSV string
    const csvContent = templateData.map((row) => row.join(",")).join("\n");

    // Set headers for CSV download
    setResponseHeaders(event, {
      "Content-Type": "text/csv; charset=utf-8",
      "Content-Disposition": `attachment; filename="${filename}.csv"`,
    });

    return csvContent;
  } else {
    // Generate Excel file
    const workbook = XLSX.utils.book_new();
    const worksheet = XLSX.utils.aoa_to_sheet(templateData);

    // Set column widths for better readability
    worksheet["!cols"] = [
      { wch: 15 }, // Code
      { wch: 30 }, // Name
      { wch: 10 }, // Unit
      { wch: 20 }, // Category
      { wch: 20 }, // Subcategory
    ];

    XLSX.utils.book_append_sheet(workbook, worksheet, "Items Import");

    // Generate buffer
    const buffer = XLSX.write(workbook, { type: "buffer", bookType: "xlsx" });

    // Set headers for Excel download
    setResponseHeaders(event, {
      "Content-Type": "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
      "Content-Disposition": `attachment; filename="${filename}.xlsx"`,
    });

    return buffer;
  }
});
