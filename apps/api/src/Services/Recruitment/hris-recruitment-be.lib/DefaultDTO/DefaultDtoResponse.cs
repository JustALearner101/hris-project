using System.Collections.Generic;

namespace hris_recruitment_be.lib.DefaultDTO
{
    public class DefaultDtoResponse<T>
    {
        public string Status { get; set; } = "SUCCESS";
        public List<T> Data { get; set; } = new List<T>();
        public Dictionary<string, object> Message { get; set; } = new Dictionary<string, object>();
        public int Total { get; set; }

        public void AddMessage(string key, object value)
        {
            Message ??= new Dictionary<string, object>();
            Message[key] = value;
        }
    }

    public class DefaultDtoResponse : DefaultDtoResponse<object>
    {
    }
}
