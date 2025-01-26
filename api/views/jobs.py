from rest_framework.views import APIView
from rest_framework.response import Response
from rest_framework import status
from django.db.models import Q
from ..models import Job
from ..serializers.job import JobSerializer 
from rest_framework.pagination import PageNumberPagination


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
