import logging
import json
from django.utils.deprecation import MiddlewareMixin

logger = logging.getLogger('api')


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
            try:
                response_data = json.dumps(response.data)[:200]  # Limit to 200 chars
            except (TypeError, ValueError):
                response_data = str(response.data)[:200]
        
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
