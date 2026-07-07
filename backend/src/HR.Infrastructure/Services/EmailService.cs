using HR.Application.Common.Interfaces;
using Microsoft.Extensions.Logging;

namespace HR.Infrastructure.Services;

/// <summary>
/// Stub email service — logs emails to console in development.
/// Replace with real SMTP/SendGrid implementation in Phase 7.
/// </summary>
public class EmailService : IEmailService
{
    private readonly ILogger<EmailService> _logger;

    public EmailService(ILogger<EmailService> logger)
    {
        _logger = logger;
    }

    public Task SendPasswordResetEmailAsync(string toEmail, string resetToken, CancellationToken cancellationToken = default)
    {
        _logger.LogInformation(
            "[EMAIL STUB] Password reset email to {Email}. Token: {Token} (expires in 1 hour)",
            toEmail, resetToken);
        return Task.CompletedTask;
    }

    public Task SendWelcomeEmailAsync(string toEmail, string fullName, CancellationToken cancellationToken = default)
    {
        _logger.LogInformation("[EMAIL STUB] Welcome email to {Email} ({Name}).", toEmail, fullName);
        return Task.CompletedTask;
    }
}
