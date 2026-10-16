namespace hris_recruitment_be.lib.DefaultDTO
{
    public class DefaultDtoPagingParams
    {
        public int Offset { get; set; } = 0;
        public int Limit { get; set; } = 10;
        public string Sort { get; set; } = "id";
        public string Order { get; set; } = "desc";
        public string? Search { get; set; }
    }
}
