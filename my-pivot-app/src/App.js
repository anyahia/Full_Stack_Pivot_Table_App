import React, { useEffect, useRef, useState } from "react";
import * as WebDataRocks from 'webdatarocks'; // Import WebDataRocks library
import { WebDataRocksReact } from 'react-webdatarocks'; // Import React wrapper
// Import the updated service function for DAX generation only
import { generateDaxQuery } from "./services/pivotService"; 

export default function App() {
  const pivotRef = useRef(null); // Ref to hold the WebDataRocks instance
  const [segmentData, setSegmentData] = useState([]); // State for simulated segment results
  const [daxQuery, setDaxQuery] = useState(""); // State for the generated DAX query
  const [segmentName, setSegmentName] = useState(""); // State for the segment name input
  const [saveStatus, setSaveStatus] = useState(""); // Status message for saving segment
  const [crmStatus, setCrmStatus] = useState(""); // Status message for CRM push
  const [message, setMessage] = useState(''); // General messages to the user
  const [isLoadingWebDataRocks, setIsLoadingWebDataRocks] = useState(true); // Loading state for WebDataRocks
  const [isWebDataRocksReady, setIsWebDataRocksReady] = useState(false); // State to track WDR readiness

  // Define your SSAS connection details for WebDataRocks
  // IMPORTANT: Replace with your actual SSAS server, catalog, cube, and msmdpump.dll URL
  const SSAS_CONNECTION_CONFIG = {
    type: "olap", // Specify OLAP data source type
    // This URL MUST point to your configured msmdpump.dll endpoint
    // Example: "http://yourserver.com/olap/msmdpump.dll"
    // If running locally, and msmdpump.dll is on the same machine/IIS, it might be:
    // "http://localhost/olap/msmdpump.dll" or "http://your_server_ip/olap/msmdpump.dll"
    proxyUrl: "http://localhost/olap/msmdpump.dll", // <--- REPLACE THIS URL
    catalog: "Adventure Works DW 2019", // <--- REPLACE WITH YOUR SSAS CATALOG NAME
    cube: "Adventure Works", // <--- REPLACE WITH YOUR SSAS CUBE NAME
    // Add other properties if needed for authentication (e.g., withCredentials, effectiveUserName)
    // based on your msmdpump.dll and SSAS security configuration.
    // Example for Windows authentication (requires careful IIS/Kerberos setup):
    // withCredentials: true,
    // effectiveUserName: "DOMAIN\\USERNAME" // If impersonation is used
  };

  // Effect to initialize WebDataRocks with the OLAP connection
  useEffect(() => {
    setIsLoadingWebDataRocks(true);

    // Initialize WebDataRocks instance
    const pivot = new WebDataRocks({
      container: "#wdr-component", // ID of the div where the pivot table will render
      toolbar: true,
      componentFolder: "https://cdn.webdatarocks.com/", // CDN for WebDataRocks files
      report: {
        dataSource: SSAS_CONNECTION_CONFIG, // Use the OLAP connection config
        slice: {
          // Initial slice configuration using OLAP unique names
          // These should match your SSAS cube's hierarchies and measures unique names
          rows: [{ uniqueName: "[Date].[Calendar].[Calendar Year]" }], 
          columns: [{ uniqueName: "[Product].[Category]" }],
          measures: [{ uniqueName: "[Measures].[Sales Amount]", aggregation: "sum" }],
          reportFilters: [{ uniqueName: "[Customer].[Customer Geography]" }]
        }
      },
      // Event handler for when WebDataRocks is fully loaded and ready
      ready: onWebDataRocksReady,
      // Event handler for when the report is updated by user interaction
      update: onWebDataRocksUpdate
    });

    // Store the WebDataRocks instance in the ref
    pivotRef.current = { webdatarocks: pivot };

    setIsLoadingWebDataRocks(false);

    // Cleanup function - dispose WebDataRocks instance on unmount
    return () => {
      if (pivotRef.current && pivotRef.current.webdatarocks) {
        pivotRef.current.webdatarocks.dispose();
      }
    };
  }, []); // Empty dependency array means this runs once on mount

  /**
   * Handles the "Generate DAX" button click.
   * Calls the service to get the conceptual DAX from the backend.
   * WebDataRocks handles the data fetching directly from SSAS.
   */
  const handleGenerateDax = async () => {
    if (!pivotRef.current || !pivotRef.current.webdatarocks) {
      setMessage("Pivot table is not ready. Please wait.");
      return;
    }
    setMessage("Requesting DAX query from backend...");
    // Call the updated service function that only gets the DAX string
    const { dax, mockSegments } = await generateDaxQuery(pivotRef.current.webdatarocks);
    
    // The main pivot table data is handled by WebDataRocks directly from the OLAP source.
    // No need to call pivotRef.current.webdatarocks.updateData() for the main pivot here.

    setDaxQuery(dax);
    setSegmentData(mockSegments);
    setMessage("DAX query received!");
  };

  /**
   * Handles saving the current segment.
   * Sends the segment name and generated DAX to the backend.
   */
  const saveSegment = async () => {
    if (!segmentName || !daxQuery) {
      setSaveStatus("Please enter a segment name and generate DAX first.");
      return;
    }
    setSaveStatus("Saving segment...");
    try {
      const response = await fetch("http://localhost:5000/api/pivotdata/segment", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name: segmentName, dax: daxQuery })
      });
      if (!response.ok) {
        throw new Error(`HTTP error! Status: ${response.status}`);
      }
      const result = await response.json();
      setSaveStatus(`Success: ${result.status}`);
    } catch (error) {
      console.error("Failed to save segment:", error);
      setSaveStatus("Error saving segment. Please try again.");
    }
  };

  /**
   * Handles pushing the segment to MS CRM.
   * Sends a request to the backend's CRM push endpoint.
   */
  const pushToMsCrm = async () => {
    setCrmStatus("Simulating push to MS CRM...");
    try {
      const response = await fetch("http://localhost:5000/api/pivotdata/push-mscrm", {
        method: "POST"
      });
      if (!response.ok) {
        throw new Error(`HTTP error! Status: ${response.status}`);
      }
      const result = await response.json();
      setCrmStatus(`Simulated Push Success: ${result.status}`);
    } catch (error) {
      console.error("Failed to push to CRM:", error);
      setCrmStatus("CRM push failed. Integration pending.");
    }
  };

  /**
   * Event handler for when the WebDataRocks component is fully ready.
   * This is crucial for interacting with the WebDataRocks instance.
   */
  const onWebDataRocksReady = () => {
    console.log("WebDataRocks component is ready!");
    setIsWebDataRocksReady(true);
    // Trigger the initial DAX generation after WebDataRocks is ready
    handleGenerateDax(); 
  };

  /**
   * Event handler for when the WebDataRocks report is updated (e.g., user drags fields).
   */
  const onWebDataRocksUpdate = () => {
    console.log("WebDataRocks report updated.");
    // Regenerate DAX on every report change, as the underlying query changes
    handleGenerateDax(); 
  };

  return (
    <div className="min-h-screen bg-gray-100 p-4 font-sans text-gray-800">
      <div className="max-w-7xl mx-auto bg-white rounded-lg shadow-xl p-6">
        <h1 className="text-3xl font-bold mb-6 text-center text-blue-700">SSAS Pivot Segment Builder</h1>

        {/* WebDataRocks Pivot Table Section */}
        <div className="mb-8 p-4 bg-gray-50 rounded-lg border border-gray-200 shadow-sm">
          <h2 className="text-xl font-semibold mb-4 text-gray-700">Interactive Pivot Table</h2>
          {isLoadingWebDataRocks ? (
            <div className="flex justify-center items-center h-[400px] text-gray-600 text-lg">
              <svg className="animate-spin -ml-1 mr-3 h-8 w-8 text-blue-500" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
              </svg>
              Loading Pivot Table...
            </div>
          ) : (
            <div id="wdr-component" style={{ height: "400px" }}>
              {/* The WebDataRocksReact component is no longer directly rendered here.
                  Instead, we manually initialize WebDataRocks in useEffect,
                  which gives us more control over its lifecycle and direct access to its instance. */}
              {/* The pivot table will be rendered into the div with id="wdr-component" by the useEffect hook. */}
            </div>
          )}
         <button
           className="bg-blue-600 text-white px-4 py-2 mt-4 rounded-md shadow-md hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-opacity-75 transition-colors duration-200"
           onClick={handleGenerateDax}
           disabled={!isWebDataRocksReady}
         >
           Generate DAX
         </button>
         <textarea
           className="mt-4 w-full border border-gray-300 p-3 text-sm rounded-md bg-gray-50 font-mono"
           rows="6"
           readOnly
           value={daxQuery}
           placeholder="DAX query will appear here after generation..."
         />
       </div>

       {/* Segment Details Section */}
       <div className="mt-8 p-4 bg-gray-50 rounded-lg border border-gray-200 shadow-sm">
         <h3 className="text-lg font-semibold mb-3 text-gray-700">Segment Details</h3>
         <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3">
           <input
             type="text"
             className="border border-gray-300 px-3 py-2 rounded-md flex-grow focus:outline-none focus:ring-2 focus:ring-blue-500"
             placeholder="Enter Segment Name"
             value={segmentName}
             onChange={e => setSegmentName(e.target.value)}
           />
           <button
             className="bg-gray-300 text-gray-800 px-4 py-2 rounded-md shadow-md hover:bg-gray-400 focus:outline-none focus:ring-2 focus:ring-gray-500 focus:ring-opacity-75 transition-colors duration-200"
             onClick={saveSegment}
           >
             Save Segment
           </button>
           <button
             className="bg-blue-500 text-white px-4 py-2 rounded-md shadow-md hover:bg-blue-600 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-opacity-75 transition-colors duration-200"
             onClick={pushToMsCrm}
           >
             Push to MS CRM
           </button>
         </div>
         {saveStatus && <p className="text-sm mt-2 text-gray-600">Save Status: {saveStatus}</p>}
         {crmStatus && <p className="text-sm mt-2 text-gray-600">CRM Status: {crmStatus}</p>}
       </div>

       {/* Results Table Section */}
       <div className="mt-8 p-4 bg-white rounded-lg shadow-md border border-gray-200">
         <h3 className="text-lg font-semibold mb-3 text-gray-700">Results (Simulated Segments)</h3>
         <div className="overflow-x-auto">
           <table className="min-w-full table-auto border border-gray-300">
             <thead>
               <tr className="bg-gray-50">
                 <th className="px-4 py-2 border border-gray-300 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Segment</th>
                 <th className="px-4 py-2 border border-gray-300 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Leads Count</th>
                 <th className="px-4 py-2 border border-gray-300 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">With Mobile %</th>
               </tr>
             </thead>
             <tbody className="bg-white divide-y divide-gray-200">
               {segmentData.map((seg, idx) => (
                 <tr key={idx}>
                   <td className="border px-4 py-2 text-sm text-gray-900">{seg.name}</td>
                   <td className="border px-4 py-2 text-sm text-gray-900">{seg.leads}</td>
                   <td className="border px-4 py-2 text-sm text-gray-900">{seg.mobile}</td>
                 </tr>
               ))}
               {segmentData.length === 0 && (
                 <tr>
                   <td colSpan="3" className="px-4 py-2 text-sm text-gray-500 text-center">No segments generated yet. Click "Generate DAX".</td>
                 </tr>
               )}
             </tbody>
           </table>
         </div>
       </div>

       {/* General Message Display */}
       {message && (
         <div className="bg-yellow-100 border border-yellow-400 text-yellow-700 px-4 py-3 rounded relative mt-8" role="alert">
           <span className="block sm:inline">{message}</span>
         </div>
       )}
     </div>
   </div>
 );
}
