namespace NovaERP.Application.Common.Models;

public class ApiResponse<T>
{
    public bool Success { get; set; }
    public string Message { get; set; } = string.Empty;
    public T? Data { get; set; }
    public List<string>? Errors { get; set; }

    public ApiResponse() { }

    public ApiResponse(bool success, string message, T? data = default)
    {
        Success = success;
        Message = message;
        Data = data;
    }
}

public class ApiResponse : ApiResponse<object>
{
    public ApiResponse(bool success, string message) : base(success, message, null)
    {
    }

    public static ApiResponse SuccessResponse(string message)
    {
        return new ApiResponse(true, message);
    }

    public static ApiResponse ErrorResponse(string message)
    {
        return new ApiResponse(false, message);
    }

    public static ApiResponse<T> SuccessResponse<T>(string message, T data)
    {
        return new ApiResponse<T>(true, message, data);
    }

    public static ApiResponse<T> ErrorResponse<T>(string message, T data)
    {
        return new ApiResponse<T>(false, message, data);
    }
}
