// D:/Full_Stack_Pivot_Table_App/PivotApi/Controllers/PivotDataController.cs

using Microsoft.AspNetCore.Mvc;
using System.Collections.Generic;
using System.Linq;
using PivotApi.Models; // Ensure this using directive is present

namespace PivotApi.Controllers
{
    [ApiController]
    [Route("api/[controller]")]
    public class PivotDataController : ControllerBase
    {
        // POST /api/pivotdata/data
        [HttpPost("data")]
        public IActionResult GetPivotData([FromBody] PivotRequest request)
        {
            if (request == null || request.Rows == null || request.Measures == null)
                return BadRequest("Missing rows or measures");

            // --- CONCEPTUAL DAX GENERATION ---
            string dax = GenerateDaxQuery(request);

            // --- SIMULATED DATA RESPONSE ---
            var data = new[] {
                new { Segment = "Segment A", Leads = 120, Mobile = "85%" },
                new { Segment = "Segment B", Leads = 95, Mobile = "78%" }
            };

            return Ok(new { data, dax });
        }

        // GET /api/pivotdata/metadata
        [HttpGet("metadata")]
        public IActionResult GetMetadata()
        {
            var dimensions = new List<string> { "Date[Month]", "Product[Category]", "Region", "Customer[Segment]" };
            var measures = new List<string> { "Sales Amount", "Units Sold", "Profit" };
            return Ok(new { dimensions, measures });
        }

        // POST /api/pivotdata/segment
        [HttpPost("segment")]
        public IActionResult SaveSegment([FromBody] SegmentDto segment)
        {
            if (string.IsNullOrWhiteSpace(segment.Name) || string.IsNullOrWhiteSpace(segment.Dax))
                return BadRequest("Invalid segment data");

            System.Console.WriteLine($"Simulated: Saving Segment '{segment.Name}' with DAX: {segment.Dax}");
            return Ok(new { status = "Segment saved." });
        }

        // POST /api/pivotdata/push-mscrm
        [HttpPost("push-mscrm")]
        public IActionResult PushToMsCrm()
        {
            System.Console.WriteLine("Simulated: Pushing segment to MS CRM.");
            return Ok(new { status = "Simulated push to MS CRM complete." });
        }

        /// <summary>
        /// Conceptual DAX query generation based on a simplified PivotRequest.
        /// This method needs significant expansion for real-world SSAS integration.
        /// </summary>
        private string GenerateDaxQuery(PivotRequest request)
        {
            var fields = request.Rows.Concat(request.Columns).Select(x => $"'{x}'");
            var measures = request.Measures.Select(m => $"\"{m}\", [{m}]");

            var filterClauses = new List<string>();
            if (request.Filters != null)
            {
                foreach (var filter in request.Filters)
                {
                    if (filter.Members != null && filter.Members.Any())
                    {
                        filterClauses.Add($"FILTER(ALL('{filter.Field}'), '{filter.Field}' IN {{{string.Join(", ", filter.Members.Select(m => $"'{m}'"))}}})");
                    }
                }
            }

            string dax = $"EVALUATE SUMMARIZECOLUMNS({string.Join(", ", fields)}, {string.Join(", ", measures)})";

            if (filterClauses.Any())
            {
                dax = $"CALCULATETABLE(\n  {dax},\n  {string.Join(",\n  ", filterClauses)}\n)";
            }

            return dax;
        }
    }
}