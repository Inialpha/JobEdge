"""
Django management command to send targeted feedback emails to users
based on their engagement level with the JobEdge platform.
"""
from django.core.management.base import BaseCommand
from django.core.mail import send_mail
from django.template.loader import render_to_string
from django.conf import settings
from api.models import User, Application, UserOutreach
from django.db.models import Count, Q


class Command(BaseCommand):
    help = 'Send targeted feedback emails to users who dropped off at different stages'
    
    # YouTube walkthrough link (shared across all segments)
    # Using the full URL with tracking parameter as provided in requirements
    YOUTUBE_LINK = 'https://youtu.be/Ani3HY7dHcM?si=7CUU-KMK4quTJ4_2'
    
    def add_arguments(self, parser):
        parser.add_argument(
            '--dry-run',
            action='store_true',
            help='Run without actually sending emails',
        )
    
    def handle(self, *args, **options):
        dry_run = options['dry_run']
        
        if dry_run:
            self.stdout.write(self.style.WARNING('DRY RUN MODE - No emails will be sent'))
        
        # Track statistics
        stats = {
            'INCOMPLETE_PROFILE': 0,
            'NO_APPLICATION': 0,
            'NO_JOB_SEARCH': 0,
        }
        
        # Process each user segment
        self.stdout.write('Processing user segments...')
        
        # 1. Users with incomplete profiles
        incomplete_profile_users = self._get_incomplete_profile_users()
        stats['INCOMPLETE_PROFILE'] = self._send_segment_emails(
            incomplete_profile_users,
            'INCOMPLETE_PROFILE',
            'incomplete_profile',
            dry_run
        )
        
        # 2. Users with completed profiles but no applications
        no_application_users = self._get_no_application_users()
        stats['NO_APPLICATION'] = self._send_segment_emails(
            no_application_users,
            'NO_APPLICATION',
            'no_application',
            dry_run
        )
        
        # 3. Users who have never searched for jobs
        no_job_search_users = self._get_no_job_search_users()
        stats['NO_JOB_SEARCH'] = self._send_segment_emails(
            no_job_search_users,
            'NO_JOB_SEARCH',
            'no_job_search',
            dry_run
        )
        
        # Print summary
        self.stdout.write(self.style.SUCCESS('\n=== Summary ==='))
        self.stdout.write(f'Incomplete Profile emails sent: {stats["INCOMPLETE_PROFILE"]}')
        self.stdout.write(f'No Application emails sent: {stats["NO_APPLICATION"]}')
        self.stdout.write(f'No Job Search emails sent: {stats["NO_JOB_SEARCH"]}')
        self.stdout.write(f'Total emails sent: {sum(stats.values())}')
    
    def _get_incomplete_profile_users(self):
        """Get users who have not completed their profile (hasMasterResume == False)"""
        # Exclude users who have already received this outreach
        already_contacted = UserOutreach.objects.filter(
            outreach_type='INCOMPLETE_PROFILE'
        ).values_list('user_id', flat=True)
        
        return User.objects.filter(
            has_master_resume=False
        ).exclude(
            id__in=already_contacted
        )
    
    def _get_no_application_users(self):
        """Get users with completed profiles but no applications"""
        # Exclude users who have already received this outreach
        already_contacted = UserOutreach.objects.filter(
            outreach_type='NO_APPLICATION'
        ).values_list('user_id', flat=True)
        
        # Get users with master resume but no applications
        return User.objects.filter(
            has_master_resume=True
        ).annotate(
            application_count=Count('applications')
        ).filter(
            application_count=0
        ).exclude(
            id__in=already_contacted
        )
    
    def _get_no_job_search_users(self):
        """Get users who have never searched for jobs (currentJobSearch is empty/null)"""
        # Exclude users who have already received this outreach
        already_contacted = UserOutreach.objects.filter(
            outreach_type='NO_JOB_SEARCH'
        ).values_list('user_id', flat=True)
        
        # Check for users with empty or null currentJobSearch
        # JSONField with empty list [] or None
        return User.objects.filter(
            Q(current_job_search=[]) | Q(current_job_search__isnull=True)
        ).exclude(
            id__in=already_contacted
        )
    
    def _send_segment_emails(self, users, outreach_type, template_name, dry_run=False):
        """Send emails to a segment of users"""
        count = 0
        
        for user in users:
            try:
                # Prepare context for template
                context = {
                    'user': user,
                    'youtube_link': self.YOUTUBE_LINK,
                }
                
                # Render email content
                subject = render_to_string(
                    f'authemail/{template_name}_subject.txt',
                    context
                ).strip()
                
                text_content = render_to_string(
                    f'authemail/{template_name}.txt',
                    context
                )
                
                html_content = render_to_string(
                    f'authemail/{template_name}.html',
                    context
                )
                
                if not dry_run:
                    # Send email
                    send_mail(
                        subject=subject,
                        message=text_content,
                        from_email=settings.DEFAULT_FROM_EMAIL,
                        recipient_list=[user.email],
                        html_message=html_content,
                        fail_silently=False,
                    )
                    
                    # Create tracking record
                    UserOutreach.objects.create(
                        user=user,
                        outreach_type=outreach_type
                    )
                    
                    self.stdout.write(
                        self.style.SUCCESS(f'✓ Sent {outreach_type} email to {user.email}')
                    )
                else:
                    self.stdout.write(
                        self.style.WARNING(f'[DRY RUN] Would send {outreach_type} email to {user.email}')
                    )
                
                count += 1
                
            except Exception as e:
                self.stdout.write(
                    self.style.ERROR(f'✗ Failed to send email to {user.email}: {str(e)}')
                )
        
        return count
