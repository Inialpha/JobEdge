from rest_framework.views import APIView
from rest_framework.response import Response
from rest_framework import status
from django.db.models import Q
from ..models import Job
from ..serializers.job import JobSerializer 
from rest_framework.pagination import PageNumberPagination
from rest_framework.permissions import IsAuthenticated
import os
from serpapi import GoogleSearch


class CustomPagination(PageNumberPagination):
    page_size = 10
    page_size_query_param = 'page_size'
    max_page_size = 100


class JobAPIView(APIView):
    """
    Handles CRUD operations for jobs, including retrieving all jobs, 
    retrieving a job by ID, creating, updating, and deleting jobs.
    """

    def get(self, request, id=None, *args, **kwargs):
        """
        Retrieve all jobs or a single job by ID.
        """

        if id:
            try:
                job = Job.objects.get(id=id)
                serializer = JobSerializer(job)
                return Response(serializer.data, status=status.HTTP_200_OK)
            except Job.DoesNotExist:
                return Response(
                    {"error": "Job not found."}, status=status.HTTP_404_NOT_FOUND
                )


        jobs = Job.objects.all()
        paginator = CustomPagination()
        paginated_jobs = paginator.paginate_queryset(jobs, request, view=self)
        serializer = JobSerializer(paginated_jobs, many=True)

        return paginator.get_paginated_response(serializer.data)


    def post(self, request, *args, **kwargs):
        """
        Create a new job.
        """
        serializer = JobSerializer(data=request.data)
        if serializer.is_valid():
            serializer.save()
            return Response(serializer.data, status=status.HTTP_201_CREATED)
        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)

    def put(self, request, id=None, *args, **kwargs):
        """
        Update a job by ID.
        """
        if not id:
            return Response(
                {"error": "Job ID is required for updating."},
                status=status.HTTP_400_BAD_REQUEST,
            )

        try:
            job = Job.objects.get(id=id)
        except Job.DoesNotExist:
            return Response(
                {"error": "Job not found."}, status=status.HTTP_404_NOT_FOUND
            )

        serializer = JobSerializer(job, data=request.data, partial=True)
        if serializer.is_valid():
            serializer.save()
            return Response(serializer.data, status=status.HTTP_200_OK)
        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)

    def delete(self, request, id=None, *args, **kwargs):
        """
        Delete a job by ID.
        """
        if not id:
            return Response(
                {"error": "Job ID is required for deletion."},
                status=status.HTTP_400_BAD_REQUEST,
            )

        try:
            job = Job.objects.get(id=id)
            job.delete()
            return Response(
                {"message": f"Job with ID {id} has been deleted."},
                status=status.HTTP_204_NO_CONTENT,
            )
        except Job.DoesNotExist:
            return Response(
                {"error": "Job not found."}, status=status.HTTP_404_NOT_FOUND
            )
            

class JobSearchAPIView(APIView):

    def get(self, request, *args, **kwargs):

        keywords = request.query_params.getlist('keywords', [])
        if keywords:
            keywords = [keyword.lower() for keyword in keywords]
        
        location = request.query_params.get('location', None)
        if location:
            location = location.lower()

        if not keywords and not location:
            return Response(
                {"error": "Provide at least one keyword or location to filter."},
                status=status.HTTP_400_BAD_REQUEST,
            )

        # Build the query
        query = Q()
        if keywords:
            keyword_query = Q()
            for keyword in keywords:
                keyword_query |= Q(job_title__icontains=keyword) | Q(job_description__icontains=keyword)
            query &= keyword_query
            print("keyword", len(keyword_query))

        if location:
            location_query = Q()
            location_query |= Q(job_location__icontains=location) | Q(job_state__icontains=location) | Q(job_city__icontains=location) | Q(job_country__icontains=location)
            print("location", len(location_query))
            query &= location_query

        # Filter the jobs
        jobs = Job.objects.filter(query)
        paginator = CustomPagination()
        paginated_jobs = paginator.paginate_queryset(jobs, request, view=self)
        serializer = JobSerializer(paginated_jobs, many=True)
        return paginator.get_paginated_response(serializer.data)


class SearchJobsAPIView(APIView):
    """
    Handles job search using SerpAPI GoogleSearch.
    Saves search results to the user's current_job_search field.
    """
    permission_classes = [IsAuthenticated]

    def get(self, request, *args, **kwargs):
        # Get query parameters
        keywords = request.query_params.getlist('keywords', [])
        location = request.query_params.get('location', '')
        job_type = request.query_params.get('job_type', '')
        is_remote = request.query_params.get('is_remote', '').lower() == 'true'
        max_jobs = request.query_params.get('max_jobs', '50')
        days_ago = request.query_params.get('days_ago', '2')

        # Validate keywords
        if not keywords or len(keywords) == 0:
            return Response(
                {"error": "Keywords parameter is required."},
                status=status.HTTP_400_BAD_REQUEST,
            )

        # Process max_jobs
        try:
            max_jobs = int(max_jobs)
            if max_jobs > 100:
                max_jobs = 100
        except ValueError:
            max_jobs = 50

        # Process days_ago
        try:
            days_ago = int(days_ago)
        except ValueError:
            days_ago = 2

        # Build search query
        query_parts = []
        
        # Add keywords with OR
        if keywords:
            keyword_query = " OR ".join([f'"{kw}"' if ' ' in kw else kw for kw in keywords])
            query_parts.append(f"({keyword_query})")
        
        # Add remote filter
        if is_remote:
            query_parts.append("(Remote OR remote)")
        
        # Add job type filter
        if job_type:
            query_parts.append(f'"{job_type}"')
        
        search_query = " AND ".join(query_parts)

        # Get SerpAPI key
        serpapi_key = os.getenv("SERPAPI_API_KEY")
        if not serpapi_key:
            return Response(
                {"error": "SERPAPI_API_KEY not configured."},
                status=status.HTTP_500_INTERNAL_SERVER_ERROR,
            )

        # Prepare search parameters
        search_params = {
            "engine": "google_jobs",
            "q": search_query,
            "api_key": serpapi_key,
            "num": max_jobs,
        }

        # Add location if provided
        if location:
            search_params["location"] = location

        # Add date filter
        if days_ago:
            search_params["chips"] = f"date_posted:today"  # SerpAPI uses chips for date filtering

        try:
            # Perform search
            search = GoogleSearch(search_params)
            results = search.get_dict()

            # Extract jobs
            jobs_list = []
            jobs_results = results.get("jobs_results", [])

            for job in jobs_results[:max_jobs]:
                job_data = {
                    "title": job.get("title", ""),
                    "date": job.get("detected_extensions", {}).get("posted_at", ""),
                    "link": job.get("share_url") or job.get("related_links", [{}])[0].get("link", ""),
                    "snippet": job.get("description", ""),
                }
                jobs_list.append(job_data)

            # Check if we need more results
            if len(jobs_list) < max_jobs:
                next_page_token = results.get("serpapi_pagination", {}).get("next_page_token")
                if next_page_token:
                    # Fetch next page
                    search_params["next_page_token"] = next_page_token
                    search = GoogleSearch(search_params)
                    results = search.get_dict()
                    
                    for job in results.get("jobs_results", []):
                        if len(jobs_list) >= max_jobs:
                            break
                        job_data = {
                            "title": job.get("title", ""),
                            "date": job.get("detected_extensions", {}).get("posted_at", ""),
                            "link": job.get("share_url") or job.get("related_links", [{}])[0].get("link", ""),
                            "snippet": job.get("description", ""),
                        }
                        jobs_list.append(job_data)

            # Save to user's current_job_search
            request.user.current_job_search = jobs_list
            request.user.save()

            return Response(
                {"jobs": jobs_list, "count": len(jobs_list)},
                status=status.HTTP_200_OK,
            )

        except Exception as e:
            return Response(
                {"error": f"Search failed: {str(e)}"},
                status=status.HTTP_500_INTERNAL_SERVER_ERROR,
            )
