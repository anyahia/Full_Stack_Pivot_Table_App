using System.Collections.Generic;

namespace PivotApi.Models
{
    public class PivotRequest
    {
        public List<string> Rows { get; set; } = new List<string>(); // Initialize to empty list
        public List<string> Columns { get; set; } = new List<string>(); // Initialize to empty list
        public List<string> Measures { get; set; } = new List<string>(); // Initialize to empty list
        public List<Filter> Filters { get; set; } = new List<Filter>(); // Initialize to empty list
    }

    public class Filter
    {
        public string Field { get; set; } = null!; // Initialize with null-forgiving operator
        public List<string> Members { get; set; } = new List<string>(); // Initialize to empty list
    }
}