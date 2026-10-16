using System.Collections.Generic;
using hris_recruitment_be.lib.DefaultDTO;

namespace hris_recruitment_be.lib.Utils
{
    public static class BuildResponseUtil
    {
        public static DefaultDtoResponse<T> Success<T>(
            List<T> data,
            int total = 0,
            string messageKey = "info",
            object? messageVal = null)
        {
            var response = new DefaultDtoResponse<T>
            {
                Status = "SUCCESS",
                Data = data,
                Total = total > 0 ? total : data.Count
            };
            if (messageVal != null)
            {
                response.AddMessage(messageKey, messageVal);
            }
            return response;
        }

        public static DefaultDtoResponse<T> Error<T>(string errorMessage, string errorCode = "ERR_INTERNAL")
        {
            var response = new DefaultDtoResponse<T>
            {
                Status = "FAILED",
                Data = new List<T>(),
                Total = 0
            };
            response.AddMessage("error", errorMessage);
            response.AddMessage("code", errorCode);
            return response;
        }
    }
}
