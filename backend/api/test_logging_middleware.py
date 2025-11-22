from django.test import TestCase, RequestFactory
from django.http import HttpResponse
from api.middleware.logging_middleware import RequestResponseLoggingMiddleware
import logging
from unittest.mock import patch, MagicMock


class LoggingMiddlewareTestCase(TestCase):
    """
    Test cases for RequestResponseLoggingMiddleware.
    Tests that the middleware logs both successful and failed responses.
    """

    def setUp(self):
        self.factory = RequestFactory()
        self.middleware = RequestResponseLoggingMiddleware(get_response=lambda r: HttpResponse())

    @patch('api.middleware.logging_middleware.logger')
    def test_process_request_logs_incoming_request(self, mock_logger):
        """Test that incoming requests are logged."""
        request = self.factory.get('/api/resumes/')
        
        self.middleware.process_request(request)
        
        mock_logger.info.assert_called_once()
        call_args = mock_logger.info.call_args[0][0]
        self.assertIn('Request:', call_args)
        self.assertIn('GET', call_args)
        self.assertIn('/api/resumes/', call_args)

    @patch('api.middleware.logging_middleware.logger')
    def test_process_response_logs_success(self, mock_logger):
        """Test that successful responses (2xx, 3xx) are logged with INFO level."""
        request = self.factory.get('/api/resumes/')
        response = HttpResponse(status=200)
        response.data = {"message": "success"}
        
        result = self.middleware.process_response(request, response)
        
        # Verify response is returned unchanged
        self.assertEqual(result, response)
        
        # Verify logging occurred
        mock_logger.log.assert_called_once()
        call_args = mock_logger.log.call_args
        
        # Check log level is INFO
        self.assertEqual(call_args[0][0], logging.INFO)
        
        # Check log message contains expected information
        log_message = call_args[0][1]
        self.assertIn('Success Response:', log_message)
        self.assertIn('GET', log_message)
        self.assertIn('/api/resumes/', log_message)
        self.assertIn('Status: 200', log_message)

    @patch('api.middleware.logging_middleware.logger')
    def test_process_response_logs_failure(self, mock_logger):
        """Test that failed responses (4xx, 5xx) are logged with ERROR level."""
        request = self.factory.get('/api/resumes/999/')
        response = HttpResponse(status=404)
        response.data = {"error": "Not found"}
        
        result = self.middleware.process_response(request, response)
        
        # Verify response is returned unchanged
        self.assertEqual(result, response)
        
        # Verify logging occurred
        mock_logger.log.assert_called_once()
        call_args = mock_logger.log.call_args
        
        # Check log level is ERROR
        self.assertEqual(call_args[0][0], logging.ERROR)
        
        # Check log message contains expected information
        log_message = call_args[0][1]
        self.assertIn('Failure Response:', log_message)
        self.assertIn('GET', log_message)
        self.assertIn('/api/resumes/999/', log_message)
        self.assertIn('Status: 404', log_message)

    @patch('api.middleware.logging_middleware.logger')
    def test_process_exception_logs_errors(self, mock_logger):
        """Test that exceptions are logged."""
        request = self.factory.get('/api/resumes/')
        exception = ValueError("Test exception")
        
        result = self.middleware.process_exception(request, exception)
        
        # Verify None is returned (exception not handled)
        self.assertIsNone(result)
        
        # Verify error was logged
        mock_logger.error.assert_called_once()
        call_args = mock_logger.error.call_args[0][0]
        self.assertIn('Exception:', call_args)
        self.assertIn('GET', call_args)
        self.assertIn('/api/resumes/', call_args)
        self.assertIn('Test exception', call_args)
