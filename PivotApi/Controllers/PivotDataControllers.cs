using Microsoft.AspNetCore.Mvc;
using System.Collections.Generic;
using System.Linq;
using PivotApi.Models; // Ensure your PivotRequest and SegmentDto models are defined

namespace PivotApi.Controllers
{
    [ApiController]
    [Route("api/[controller]")]
    public class PivotDataController : ControllerBase
    {
        // No need for SSAS connection string or AdomdClient imports here for pivot data fetching
        // as WebDataRocks will connect directly via msmdpump.dll

        // POST /api/pivotdata/data
        // This endpoint now primarily generates and returns the DAX query string
        // based on the frontend's pivot configuration.
        [HttpPost("data")]
        public IActionResult GetPivotData([FromBody] PivotRequest request)
        {
            if (request == null)
                return BadRequest("Request cannot be null.");

            // Your existing DAX generation logic.
            // This method takes the frontend's slice configuration (rows, columns, measures)
            // and constructs a DAX query string.
            string dax = GenerateDaxQuery(request);

            // In this OLAP direct connection scenario, the backend DOES NOT
            // fetch actual pivot data from SSAS and return it.
            // WebDataRocks will fetch data directly from msmdpump.dll.

            // We still return mockSegments for the "Results" table in the UI
            // and the generated DAX for display.
            var mockSegments = new[] {
                new { Segment = "Segment A", Leads = 120, Mobile = "85%" },
                new { Segment = "Segment B", Leads = 95, Mobile = "78%" },
                new { Segment = "Segment C", Leads = 70, Mobile = "90%" },
            };

            // Return the DAX query and mock segments.
            // The 'data' property is no longer used for the main pivot table.
            return Ok(new { dax = dax, mockSegments = mockSegments });
        }

        // GET /api/pivotdata/metadata
        // This endpoint can still provide a list of available dimensions and measures
        // if you want to control what fields WebDataRocks shows, or if auto-discovery
        // is not sufficient for your needs. For a truly direct OLAP setup, WebDataRocks
        // can often discover these directly from the cube.
        [HttpGet("metadata")]
        public IActionResult GetMetadata()
        {
            // These should ideally come from querying your SSAS cube's metadata
            // if you want them to be dynamic. For a simple example, they can be hardcoded.
            var dimensions = new List<string> {
                "[Date].[Calendar].[Calendar Year]", // Example OLAP hierarchy unique name
                "[Product].[Category]",
                "[Region]",
                "[Customer].[Customer Geography]"
            };
            var measures = new List<string> {
                "[Measures].[Sales Amount]", // Example OLAP measure unique name
                "[Measures].[Units Sold]",
                "[Measures].[Profit]"
            };
            return Ok(new { dimensions, measures });
        }

        // POST /api/pivotdata/segment
        [HttpPost("segment")]
        public IActionResult SaveSegment([FromBody] SegmentDto segment)
        {
            if (string.IsNullOrWhiteSpace(segment.Name) || string.IsNullOrWhiteSpace(segment.Dax))
                return BadRequest("Segment name and DAX cannot be empty.");

            // In a real application:
            // 1. Store segment.Name and segment.Dax in a database.
            // 2. Perform validation.
            Console.WriteLine($"Saving Segment: Name='{segment.Name}', DAX='{segment.Dax}'");
            return Ok(new { status = "Segment saved successfully (simulated)." });
        }

        // POST /api/pivotdata/push-mscrm
        [HttpPost("push-mscrm")]
        public IActionResult PushToMsCrm()
        {
            // In a real application:
            // 1. Retrieve the relevant segment data (e.g., from a database).
            // 2. Call the Microsoft CRM API to push the data.
            Console.WriteLine("Simulating push to MS CRM.");
            return Ok(new { status = "Push to MS CRM simulated successfully." });
        }

        // Helper method to generate DAX query string (remains largely the same)
        private string GenerateDaxQuery(PivotRequest request)
        {
            var daxParts = new List<string>();

            // Example DAX generation based on frontend request
            // This is a simplified example. Real DAX generation can be complex.
            // It should map WebDataRocks' slice to appropriate DAX functions.

            if (request.Measures != null && request.Measures.Any())
            {
                var measures = string.Join(", ", request.Measures.Select(m => m));
                daxParts.Add($"EVALUATE SUMMARIZECOLUMNS(");
                
                // Add rows
                if (request.Rows != null && request.Rows.Any())
                {
                    daxParts.Add(string.Join(", ", request.Rows.Select(r => r)));
                    daxParts.Add(",");
                }

                // Add columns
                if (request.Columns != null && request.Columns.Any())
                {
                    daxParts.Add(string.Join(", ", request.Columns.Select(c => r)));
                    daxParts.Add(",");
                }

                daxParts.Add($"\"Measures\", {measures}");
                daxParts.Add($")");
            }
            else
            {
                daxParts.Add("EVALUATE SUMMARIZECOLUMNS(");
                if (request.Rows != null && request.Rows.Any())
                {
                    daxParts.Add(string.Join(", ", request.Rows.Select(r => r)));
                }
                daxParts.Add(")");
            }

            // Add filters if implemented in PivotRequest
            // if (request.Filters != null && request.Filters.Any())
            // {
            //     daxParts.Add("FILTER(");
            //     // ... complex filter logic
            //     daxParts.Add(")");
            // }

            return string.Join(" ", daxParts);
        }
    }

    // Models (if not already defined in a separate file like Models/PivotRequest.cs)
    public class PivotRequest
    {
        public List<string> Rows { get; set; }
        public List<string> Columns { get; set; }
        public List<string> Measures { get; set; }
        public List<object> Filters { get; set; } // Can be more specific
    }

    public class SegmentDto
    {
        public string Name { get; set; }
        public string Dax { get; set; }
    }
}
