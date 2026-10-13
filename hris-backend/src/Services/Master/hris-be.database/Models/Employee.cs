using System;

namespace hris_be.database.Models
{
    public class Employee
    {
        public int Id { get; set; }
        public string FirstName { get; set; } = string.Empty;
        public string LastName { get; set; } = string.Empty;
        public string Email { get; set; } = string.Empty;
        public string? PhoneNumber { get; set; }
        public DateTime? DateOfBirth { get; set; }
        public string Position { get; set; } = string.Empty;
        public string Department { get; set; } = string.Empty;

        // Base Audit Properties
        public int Status { get; set; } = 1;
        public string CreatedBy { get; set; } = "system";
        public DateTime CreatedAt { get; set; } = DateTime.UtcNow;
        public string? ModifiedBy { get; set; }
        public DateTime? ModifiedAt { get; set; }
        public bool IsDeleted { get; set; } = false;
    }
}
