from rest_framework.views import APIView
from rest_framework.response import Response
from rest_framework import status
from django.db.models import Q
from ..models import Job
from ..serializers.job import JobSerializer 
from rest_framework.pagination import PageNumberPagination
from rest_framework.authentication import TokenAuthentication
from rest_framework.permissions import IsAuthenticated
import os
from serpapi import GoogleSearch
import requests


ATS_SITES = [
            "*.careers-page.com",
            #"boards.greenhouse.io"
]


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
    authentication_classes = [TokenAuthentication]
    permission_classes = [IsAuthenticated]

    def get(self, request, *args, **kwargs):
        # Get query parameters
        keywords = request.query_params.getlist('keywords', [])
        print("\n\n\n", keywords)
        location = request.query_params.get('location', '')
        job_type = request.query_params.get('job_type', '')
        is_remote = request.query_params.get('is_remote', '').lower() == 'true'
        max_jobs = request.query_params.get('max_jobs', '50')
        days_ago = request.query_params.get('days_ago', '2')

        if not keywords or len(keywords) == 0:
            return Response(
                {"error": "Keywords parameter is required."},
                status=status.HTTP_400_BAD_REQUEST,
            )

        try:
            max_jobs = int(max_jobs)
            if max_jobs > 25:
                max_jobs = 25
        except ValueError:
            max_jobs = 25

        try:
            days_ago = int(days_ago)
        except ValueError:
            days_ago = 2

        query_parts = []
        
        if keywords:
            keyword_query = " OR ".join([f'"{kw}"' if ' ' in kw else kw for kw in keywords])
            query_parts.append(f"({keyword_query})")
        print(keyword_query)
        if is_remote:
            query_parts.append("(Remote OR remote)")
        
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

        # site_query = " OR ".join([f"site:{domain}" for domain in ATS_SITES])

        search_params = {
            "engine": "google",
            "q": f"({keyword_query})",

            "api_key": serpapi_key,
            "num": max_jobs,
            #"nfpr": 1,
            "as_sitesearch": "careers-page.com",
            "as_dt": "i"
        }

        if location:
            search_params["location"] = location
        import math

        if days_ago:
            try:
                days_ago = int(days_ago)
                if days_ago >= 1:
                    if days_ago <= 7:
                        qdr = f"d{days_ago}"
                    elif days_ago <= 30:
                        weeks = math.ceil(days_ago / 7)
                        qdr = f"w{weeks}"
                    elif days_ago <= 365:
                        months = math.ceil(days_ago / 30)
                        qdr = f"m{min(months, 12)}"
                    else:
                        years = math.ceil(days_ago / 365)
                        qdr = f"y{years}"
        
                    search_params["tbs"] = f"qdr:{qdr},li:1"
            except (ValueError, TypeError):
                pass


        try:
            search = GoogleSearch(search_params)
            results = search.get_dict()
            print(results)

            jobs_list = []
            jobs_results = results.get("organic_results", [])
            other_pages = results.get("serpapi_pagination", {}).get("other_pages", {})
            if len(jobs_results) < max_jobs and other_pages:
                current_page = 1
                while True:
                    current_page += 1
                    next_link = other_pages.get(str(current_page), "")
                    if not next_link:
                        break
                    res = requests.get(f"{next_link}&api_key={serpapi_key}")
                    data = res.json()
                    jobs_results.extend(data.get("organic_results", []))
                    if len(jobs_results) >= max_jobs:
                        break
            for job in jobs_results[:max_jobs]:
                job_data = {
                    "title": job.get("title", ""),
                    "date": job.get("date", ""),
                    "link": job.get("link", ""),
                    "snippet": job.get("snippet", ""),
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
            print(e)
            raise e
            return Response(
                {"error": f"Search failed: {str(e)}"},
                status=status.HTTP_500_INTERNAL_SERVER_ERROR,
            )
