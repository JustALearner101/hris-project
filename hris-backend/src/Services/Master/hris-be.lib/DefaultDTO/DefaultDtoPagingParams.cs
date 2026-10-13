using System.Collections.Generic;

namespace hris_be.lib.DefaultDTO
{
    public class DefaultDtoPagingParams
    {
        public int Offset { get; set; } = 0;
        public int Limit { get; set; } = 10;
        public string? Sort { get; set; }
        public string? Order { get; set; }
        public Dictionary<string, object> Search { get; set; } = new Dictionary<string, object>();
        public int MaxId { get; set; }
    }
}
