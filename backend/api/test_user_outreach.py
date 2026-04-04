"""
Tests for the user feedback outreach system
"""
from unittest.mock import patch
from django.test import TestCase
from django.db import IntegrityError
from django.core import mail
from api.models import User, Application, Resume, UserOutreach
from api.management.commands.send_user_feedback_emails import Command


class UserSegmentTestCase(TestCase):
    """Test user segment identification logic"""
    
    def setUp(self):
        """Set up test users"""
        # User with incomplete profile (no master resume)
        self.incomplete_user = User.objects.create(
            email='incomplete@test.com',
            first_name='Incomplete',
            last_name='User',
            password='testpass123',
            has_master_resume=False,
            current_job_search=[]
        )
        
        # User with completed profile but no applications
        self.no_app_user = User.objects.create(
            email='noapp@test.com',
            first_name='NoApp',
            last_name='User',
            password='testpass123',
            has_master_resume=True,
            current_job_search=[]
        )
        
        # User with profile and applications but no job search
        self.no_search_user = User.objects.create(
            email='nosearch@test.com',
            first_name='NoSearch',
            last_name='User',
            password='testpass123',
            has_master_resume=True,
            current_job_search=[]
        )
        
        # Create resume and application for no_search_user
        resume = Resume.objects.create(
            user=self.no_search_user,
            name='Test Resume',
            skills=['Python', 'Django'],
            work_experience=[],
            education=[],
            projects=[]
        )
        
        Application.objects.create(
            user=self.no_search_user,
            resume=resume,
            job_description='Test job',
            cover_letter='Test cover letter'
        )
        
        # User with job search (should not be contacted)
        self.active_user = User.objects.create(
            email='active@test.com',
            first_name='Active',
            last_name='User',
            password='testpass123',
            has_master_resume=True,
            current_job_search=[{'job': 'test'}]
        )
        
        self.command = Command()
    
    def test_incomplete_profile_segment(self):
        """Test identification of users with incomplete profiles"""
        users = self.command._get_incomplete_profile_users()
        user_emails = [u.email for u in users]
        
        self.assertIn('incomplete@test.com', user_emails)
        self.assertNotIn('noapp@test.com', user_emails)
        self.assertNotIn('nosearch@test.com', user_emails)
        self.assertNotIn('active@test.com', user_emails)
    
    def test_no_application_segment(self):
        """Test identification of users with no applications"""
        users = self.command._get_no_application_users()
        user_emails = [u.email for u in users]
        
        self.assertIn('noapp@test.com', user_emails)
        self.assertNotIn('incomplete@test.com', user_emails)
        self.assertNotIn('nosearch@test.com', user_emails)
        self.assertNotIn('active@test.com', user_emails)
    
    def test_no_job_search_segment(self):
        """Test identification of users who never searched for jobs"""
        users = self.command._get_no_job_search_users()
        user_emails = [u.email for u in users]
        
        # All users without job search should be included
        self.assertIn('incomplete@test.com', user_emails)
        self.assertIn('noapp@test.com', user_emails)
        self.assertIn('nosearch@test.com', user_emails)
        self.assertNotIn('active@test.com', user_emails)
    
    def test_deduplication(self):
        """Test that users who were already contacted are excluded"""
        # Create outreach record for incomplete_user
        UserOutreach.objects.create(
            user=self.incomplete_user,
            outreach_type='INCOMPLETE_PROFILE'
        )
        
        users = self.command._get_incomplete_profile_users()
        user_emails = [u.email for u in users]
        
        # incomplete_user should not be in the list anymore
        self.assertNotIn('incomplete@test.com', user_emails)
    
    def test_multiple_outreach_types(self):
        """Test that a user can receive different types of outreach"""
        # User with no job search can be contacted for that
        UserOutreach.objects.create(
            user=self.incomplete_user,
            outreach_type='INCOMPLETE_PROFILE'
        )
        
        # But should still appear in no_job_search segment if applicable
        # In this case, incomplete_user has no job search
        users = self.command._get_no_job_search_users()
        user_emails = [u.email for u in users]
        
        # Should be included because outreach_type is different
        self.assertIn('incomplete@test.com', user_emails)


class UserOutreachModelTestCase(TestCase):
    """Test UserOutreach model"""
    
    def setUp(self):
        self.user = User.objects.create(
            email='test@test.com',
            first_name='Test',
            last_name='User',
            password='testpass123',
            has_master_resume=False
        )
    
    def test_create_outreach_record(self):
        """Test creating an outreach record"""
        outreach = UserOutreach.objects.create(
            user=self.user,
            outreach_type='INCOMPLETE_PROFILE'
        )
        
        self.assertEqual(outreach.user, self.user)
        self.assertEqual(outreach.outreach_type, 'INCOMPLETE_PROFILE')
        self.assertIsNotNone(outreach.sent_at)
    
    def test_unique_constraint(self):
        """Test that the same outreach type can't be sent twice to same user"""
        UserOutreach.objects.create(
            user=self.user,
            outreach_type='INCOMPLETE_PROFILE'
        )
        
        # Attempting to create duplicate should fail with IntegrityError
        with self.assertRaises(IntegrityError):
            UserOutreach.objects.create(
                user=self.user,
                outreach_type='INCOMPLETE_PROFILE'
            )
    
    def test_str_representation(self):
        """Test string representation of outreach record"""
        outreach = UserOutreach.objects.create(
            user=self.user,
            outreach_type='NO_APPLICATION'
        )
        
        self.assertIn('NO_APPLICATION', str(outreach))
        self.assertIn('test@test.com', str(outreach))


class EmailReplyToTestCase(TestCase):
    """Test that outreach emails include a Reply-To header"""

    def setUp(self):
        self.user = User.objects.create(
            email='replyto@test.com',
            first_name='ReplyTo',
            last_name='User',
            password='testpass123',
            has_master_resume=False,
            current_job_search=[]
        )
        self.command = Command()

    def test_reply_to_header_is_set(self):
        """Test that sent emails have the custom Reply-To address"""
        rendered_content = 'Test content'
        with patch(
            'api.management.commands.send_user_feedback_emails.render_to_string',
            return_value=rendered_content
        ):
            self.command._send_segment_emails(
                [self.user], 'INCOMPLETE_PROFILE', 'incomplete_profile', dry_run=False
            )

        self.assertEqual(len(mail.outbox), 1)
        sent_email = mail.outbox[0]
        self.assertEqual(sent_email.reply_to, ['inimfonebong0001@gmail.com'])
