import logging
import json
from django.utils.deprecation import MiddlewareMixin

logger = logging.getLogger('api')

# Sensitive fields that should be excluded from logs
SENSITIVE_FIELDS = {'password', 'token', 'api_key', 'secret', 'authorization', 'auth'}


class RequestResponseLoggingMiddleware(MiddlewareMixin):
    """
    Middleware to log all API requests and responses.
    Logs both successful and failed responses before they are sent to the client.
    """

    def process_request(self, request):
        """
        Log incoming request details.
        """
        logger.info(f"Request: {request.method} {request.path}")
        return None

    def _sanitize_data(self, data):
        """
        Remove sensitive information from data before logging.
        """
        if isinstance(data, dict):
            return {
                key: '***REDACTED***' if any(s in key.lower() for s in SENSITIVE_FIELDS) else self._sanitize_data(value)
                for key, value in data.items()
            }
        elif isinstance(data, list):
            return [self._sanitize_data(item) for item in data]
        return data

    def process_response(self, request, response):
        """
        Log response details before sending to client.
        Logs both success and failure responses.
        """
        status_code = response.status_code
        
        # Determine if this is a success or failure
        if 200 <= status_code < 400:
            log_level = logging.INFO
            log_type = "Success"
        else:
            log_level = logging.ERROR
            log_type = "Failure"
        
        # Get response data if available
        response_data = ""
        if hasattr(response, 'data'):
            # DRF Response object
            try:
                sanitized_data = self._sanitize_data(response.data)
                response_data = json.dumps(sanitized_data)[:200]  # Limit to 200 chars
            except (TypeError, ValueError):
                response_data = str(response.data)[:200]
        elif hasattr(response, 'content') and hasattr(response, 'headers'):
            # Regular Django JsonResponse - check Content-Type header
            content_type = response.headers.get('Content-Type', '')
            if content_type.startswith('application/json'):
                try:
                    content = json.loads(response.content.decode('utf-8'))
                    sanitized_data = self._sanitize_data(content)
                    response_data = json.dumps(sanitized_data)[:200]
                except (ValueError, UnicodeDecodeError):
                    response_data = ""
        
        # Log the response
        logger.log(
            log_level,
            f"{log_type} Response: {request.method} {request.path} - "
            f"Status: {status_code} - Data: {response_data}"
        )
        
        return response

    def process_exception(self, request, exception):
        """
        Log exceptions that occur during request processing.
        """
        logger.error(
            f"Exception: {request.method} {request.path} - "
            f"Error: {str(exception)}",
            exc_info=True
        )
        return None
