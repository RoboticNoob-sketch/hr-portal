using HR.Application.Common.Exceptions;
using System.Net;
using System.Text.Json;

namespace HR.Api.Middleware;

public class ExceptionMiddleware
{
    private readonly RequestDelegate _next;
    private readonly ILogger<ExceptionMiddleware> _logger;

    public ExceptionMiddleware(RequestDelegate next, ILogger<ExceptionMiddleware> logger)
    {
        _next = next;
        _logger = logger;
    }

    public async Task InvokeAsync(HttpContext context)
    {
        try
        {
            await _next(context);
        }
        catch (Exception ex)
        {
            await HandleExceptionAsync(context, ex);
        }
    }

    private async Task HandleExceptionAsync(HttpContext context, Exception exception)
    {
        var (statusCode, message, errors) = exception switch
        {
            NotFoundException e => (HttpStatusCode.NotFound, e.Message, (IEnumerable<string>?)null),
            UnauthorizedException e => (HttpStatusCode.Unauthorized, e.Message, null),
            ForbiddenException e => (HttpStatusCode.Forbidden, e.Message, null),
            ConflictException e => (HttpStatusCode.Conflict, e.Message, null),
            Application.Common.Exceptions.ValidationException e => (HttpStatusCode.UnprocessableEntity, "Validation failed.", e.Errors),
            AppException e => (HttpStatusCode.BadRequest, e.Message, null),
            _ => (HttpStatusCode.InternalServerError, "An unexpected error occurred. Please try again later.", null)
        };

        if (statusCode == HttpStatusCode.InternalServerError)
            _logger.LogError(exception, "Unhandled exception.");
        else
            _logger.LogWarning(exception, "Handled exception: {Message}", exception.Message);

        context.Response.StatusCode = (int)statusCode;
        context.Response.ContentType = "application/json";

        var response = new
        {
            success = false,
            message,
            errors
        };

        await context.Response.WriteAsync(JsonSerializer.Serialize(response, new JsonSerializerOptions
        {
            PropertyNamingPolicy = JsonNamingPolicy.CamelCase
        }));
    }
}
