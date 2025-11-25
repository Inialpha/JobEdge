from rest_framework.views import APIView
from rest_framework.response import Response
from rest_framework import status
from rest_framework.authentication import TokenAuthentication
from rest_framework.permissions import IsAuthenticated
from ..models import User, Resume, Application
from django.db.models import Count
from django.db.models.functions import TruncDate
from django.utils import timezone
from datetime import timedelta


class AdminStatsAPIView(APIView):
    """
    API View for admin statistics.
    Returns counts of all users, resumes, and applications.
    """
    
    authentication_classes = [TokenAuthentication]
    permission_classes = [IsAuthenticated]
    
    def get(self, request):
        user = request.user
        if not user.is_staff:
            return Response(
                {"details": "Permission denied. Admin access required."},
                status=status.HTTP_403_FORBIDDEN
            )
        
        users_count = User.objects.count()
        resumes_count = Resume.objects.count()
        applications_count = Application.objects.count()
        
        return Response({
            "users": users_count,
            "resumes": resumes_count,
            "applications": applications_count
        }, status=status.HTTP_200_OK)


class AdminAnalyticsAPIView(APIView):
    """
    API View for admin analytics.
    Returns creation statistics over time for users, resumes, and applications.
    """
    
    authentication_classes = [TokenAuthentication]
    permission_classes = [IsAuthenticated]
    
    def get(self, request):
        user = request.user
        if not user.is_staff:
            return Response(
                {"details": "Permission denied. Admin access required."},
                status=status.HTTP_403_FORBIDDEN
            )
        
        # Get date range from query params or default to last 30 days
        days = int(request.query_params.get('days', 30))
        end_date = timezone.now().date()
        start_date = end_date - timedelta(days=days)
        
        # Get daily counts for users
        users_by_date = (
            User.objects
            .filter(date_joined__date__gte=start_date, date_joined__date__lte=end_date)
            .annotate(date=TruncDate('date_joined'))
            .values('date')
            .annotate(count=Count('id'))
            .order_by('date')
        )
        
        # Get daily counts for resumes
        resumes_by_date = (
            Resume.objects
            .filter(created_at__date__gte=start_date, created_at__date__lte=end_date)
            .annotate(date=TruncDate('created_at'))
            .values('date')
            .annotate(count=Count('id'))
            .order_by('date')
        )
        
        # Get daily counts for applications
        applications_by_date = (
            Application.objects
            .filter(created_at__date__gte=start_date, created_at__date__lte=end_date)
            .annotate(date=TruncDate('created_at'))
            .values('date')
            .annotate(count=Count('id'))
            .order_by('date')
        )
        
        # Convert to lists with string dates
        users_data = [
            {"date": item['date'].isoformat(), "count": item['count']}
            for item in users_by_date
        ]
        resumes_data = [
            {"date": item['date'].isoformat(), "count": item['count']}
            for item in resumes_by_date
        ]
        applications_data = [
            {"date": item['date'].isoformat(), "count": item['count']}
            for item in applications_by_date
        ]
        
        # Calculate today and yesterday counts
        today = timezone.now().date()
        yesterday = today - timedelta(days=1)
        
        today_stats = {
            "users": User.objects.filter(date_joined__date=today).count(),
            "resumes": Resume.objects.filter(created_at__date=today).count(),
            "applications": Application.objects.filter(created_at__date=today).count()
        }
        
        yesterday_stats = {
            "users": User.objects.filter(date_joined__date=yesterday).count(),
            "resumes": Resume.objects.filter(created_at__date=yesterday).count(),
            "applications": Application.objects.filter(created_at__date=yesterday).count()
        }
        
        return Response({
            "users_over_time": users_data,
            "resumes_over_time": resumes_data,
            "applications_over_time": applications_data,
            "today": today_stats,
            "yesterday": yesterday_stats,
            "date_range": {
                "start": start_date.isoformat(),
                "end": end_date.isoformat()
            }
        }, status=status.HTTP_200_OK)
