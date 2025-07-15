```csharp
 // D:/Full_Stack_Pivot_Table_App/PivotApi/Models/PivotRequest.cs

 using System.Collections.Generic;

 namespace PivotApi.Models
 {
     public class PivotRequest
     {
         public List<string> Rows { get; set; }
         public List<string> Columns { get; set; }
         public List<string> Measures { get; set; }
         public List<Filter> Filters { get; set; } // Assuming a Filter class exists or will be added
     }

     public class Filter
     {
         public string Field { get; set; }
         public List<string> Members { get; set; }
     }
 }
 ```

 * Still inside `D:/Full_Stack_Pivot_Table_App/PivotApi/Models`, create a new file named `SegmentDto.cs`.
 * **Open `SegmentDto.cs`** in your text editor and paste the following code:

 ```csharp
 // D:/Full_Stack_Pivot_Table_App/PivotApi/Models/SegmentDto.cs

 namespace PivotApi.Models
 {
     public class SegmentDto
     {
         public string Name { get; set; }
         public string Dax { get; set; }
     }
 }
 ```