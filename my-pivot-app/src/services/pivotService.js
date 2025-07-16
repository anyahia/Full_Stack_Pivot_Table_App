// src/services/pivotService.js

const API_BASE_URL = "http://localhost:5000/api/pivotdata"; // Ensure this matches your .NET backend URL

/**
 * Fetches metadata (dimensions and measures) from the backend.
 * This is still useful for populating initial field lists or for backend-driven field mapping.
 */
export async function fetchMetadata() {
  try {
    const response = await fetch(`${API_BASE_URL}/metadata`);
    if (!response.ok) {
      throw new Error(`HTTP error! Status: ${response.status}`);
    }
    const data = await response.json();
    console.log("Fetched metadata:", data);
    return data;
  } catch (error) {
    console.error("Failed to fetch metadata:", error);
    return { dimensions: [], measures: [] }; // Return empty arrays on error
  }
}

/**
 * Generates a payload from WebDataRocks report and requests DAX from backend.
 * The actual pivot data will be fetched by WebDataRocks directly from the OLAP source.
 * @param {object} webDataRocksInstance - The WebDataRocks instance.
 * @returns {Promise<object>} - An object containing the DAX query and mockSegments.
 */
export async function generateDaxQuery(webDataRocksInstance) {
  if (!webDataRocksInstance) {
    console.warn("WebDataRocks instance not available.");
    return { dax: "Error: Pivot table not ready.", mockSegments: [] };
  }

  // Get the current report configuration from WebDataRocks
  const report = webDataRocksInstance.getReport();

  // Construct a simplified request payload for the backend.
  // This structure needs to match the PivotRequest DTO in your .NET backend.
  // We send the current slice configuration so the backend can generate the DAX.
  const payload = {
    Rows: report.slice.rows ? report.slice.rows.map(r => r.uniqueName) : [],
    Columns: report.slice.columns ? report.slice.columns.map(c => c.uniqueName) : [],
    Measures: report.slice.measures ? report.slice.measures.map(m => m.uniqueName) : [],
    // Filters would need more complex parsing from WebDataRocks' report.slice.reportFilters
    Filters: [] // Placeholder for now, implement based on your needs
  };

  console.log("Sending payload to backend for DAX generation:", payload);

  try {
    // Call your backend's /data endpoint, which now only needs to return the DAX string
    // and potentially mock segments. It no longer needs to return the pivot data itself.
    const response = await fetch(`${API_BASE_URL}/data`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
    });

    if (!response.ok) {
      throw new Error(`HTTP error! Status: ${response.status}`);
    }

    const result = await response.json();
    console.log("Backend response (DAX and mock segments):", result);

    // Simulate segment data for the Results table (this part remains the same)
    const mockSegments = [
      { name: "Segment A", leads: 120, mobile: "85%" },
      { name: "Segment B", leads: 95, mobile: "78%" },
      { name: "Segment C", leads: 70, mobile: "90%" },
    ];

    // The backend's /data endpoint should now return { dax: "YOUR_DAX_STRING" }
    // We combine it with mockSegments for the frontend display.
    return { dax: result.dax, mockSegments }; 
  } catch (error) {
    console.error("Failed to generate DAX:", error);
    return { dax: `Error: ${error.message}`, mockSegments: [] };
  }
}
