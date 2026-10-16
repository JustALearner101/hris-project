using System;
using System.Globalization;
using System.Security.Cryptography;
using System.Text;
using System.Text.RegularExpressions;

namespace hris_recruitment_be.lib.Utils
{
    public static class SlugUtil
    {
        private static readonly Regex InvalidCharsRegex = new Regex(@"[^a-z0-9\s-]", RegexOptions.Compiled);
        private static readonly Regex MultiSpacesRegex = new Regex(@"[\s-]+", RegexOptions.Compiled);

        public static string GenerateSlug(string title, string? customSlug = null)
        {
            var source = !string.IsNullOrWhiteSpace(customSlug) ? customSlug : title;
            if (string.IsNullOrWhiteSpace(source))
            {
                return $"job-{Guid.NewGuid():N}"[..12];
            }

            var normalized = source.Normalize(NormalizationForm.FormD);
            var sb = new StringBuilder(normalized.Length);
            foreach (var c in normalized)
            {
                if (CharUnicodeInfo.GetUnicodeCategory(c) != UnicodeCategory.NonSpacingMark)
                {
                    sb.Append(char.ToLowerInvariant(c));
                }
            }

            var cleaned = InvalidCharsRegex.Replace(sb.ToString(), "");
            var slug = MultiSpacesRegex.Replace(cleaned, "-").Trim('-');

            return string.IsNullOrWhiteSpace(slug)
                ? $"job-{Guid.NewGuid():N}"[..12]
                : slug;
        }
    }

    public static class TrackingTokenUtil
    {
        public static (string RawToken, string TokenHash) GenerateToken()
        {
            var randomBytes = RandomNumberGenerator.GetBytes(24); // 192-bit CSPRNG entropy
            var rawToken = Convert.ToBase64String(randomBytes)
                .Replace('+', '-')
                .Replace('/', '_')
                .TrimEnd('=');

            return (rawToken, HashToken(rawToken));
        }

        public static string HashToken(string rawToken)
        {
            if (string.IsNullOrWhiteSpace(rawToken))
            {
                return string.Empty;
            }

            var bytes = SHA256.HashData(Encoding.UTF8.GetBytes(rawToken.Trim()));
            return Convert.ToHexString(bytes).ToLowerInvariant();
        }
    }

    public static class HtmlSanitizerUtil
    {
        private static readonly Regex ScriptOrStyleTagRegex = new Regex(
            @"<\s*(script|style|iframe|object|embed|form|meta|link)\b[^>]*>[\s\S]*?<\s*/\s*\1\s*>|<\s*(script|style|iframe|object|embed|form|meta|link)\b[^>]*/?\s*>",
            RegexOptions.IgnoreCase | RegexOptions.Compiled);

        private static readonly Regex EventHandlerRegex = new Regex(
            @"\bon[a-z]+\s*=\s*(?:""[^""]*""|'[^']*'|[^\s>]+)",
            RegexOptions.IgnoreCase | RegexOptions.Compiled);

        private static readonly Regex JavascriptProtocolRegex = new Regex(
            @"(?:javascript|vbscript|data)\s*:",
            RegexOptions.IgnoreCase | RegexOptions.Compiled);

        public static string? Sanitize(string? input)
        {
            if (string.IsNullOrWhiteSpace(input))
            {
                return input;
            }

            var cleaned = ScriptOrStyleTagRegex.Replace(input, string.Empty);
            cleaned = EventHandlerRegex.Replace(cleaned, string.Empty);
            cleaned = JavascriptProtocolRegex.Replace(cleaned, string.Empty);
            return cleaned.Trim();
        }
    }
}
