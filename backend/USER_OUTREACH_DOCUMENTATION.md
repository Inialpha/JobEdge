# User Feedback & Outreach System

This document describes the targeted user outreach system for collecting feedback from users who dropped off at different stages of JobEdge onboarding and usage.

## Overview

The system automatically identifies users based on their engagement level and sends targeted feedback emails to encourage them to complete the next step or provide feedback about what prevented them from continuing.

## User Segments

The system identifies three user segments:

### 1. Users With Incomplete Profiles
- **Criteria**: `user.has_master_resume == False`
- **Meaning**: User signed up but did not complete their profile/master resume
- **Email**: Asks why they didn't complete their profile and provides resources to help

### 2. Users With Completed Profiles but No Applications
- **Criteria**: 
  - `user.has_master_resume == True`
  - No Application records associated with the user
- **Meaning**: User completed their profile but hasn't created any job applications
- **Email**: Asks why they haven't applied and encourages them to use the application feature

### 3. Users Who Have Never Searched for Jobs
- **Criteria**: `user.current_job_search` is empty/null
- **Meaning**: User hasn't used the job search feature
- **Email**: Asks why they haven't searched for jobs and highlights the job search functionality

## Features

- **Deduplication**: Uses the `UserOutreach` model to track which users have received which type of outreach, preventing duplicate emails
- **Segment-Specific Messaging**: Each segment receives a tailored email addressing their specific drop-off point
- **Feedback Collection**: Emails invite users to reply directly or use the "Contact Us" feature
- **Educational Content**: All emails include a YouTube walkthrough link: https://youtu.be/Ani3HY7dHcM?si=7CUU-KMK4quTJ4_2
- **Dry Run Mode**: Test the command without sending emails

## Usage

### Basic Usage

```bash
python manage.py send_user_feedback_emails
```

This will:
1. Identify users in each segment
2. Send targeted emails to each user
3. Create tracking records in the database
4. Display a summary of emails sent

### Dry Run Mode

To see which users would be contacted without actually sending emails:

```bash
python manage.py send_user_feedback_emails --dry-run
```

This is useful for:
- Testing the command
- Previewing which users will be contacted
- Verifying the segment logic

## Database Models

### UserOutreach

Tracks outreach activity to prevent duplicate emails:

```python
class UserOutreach(BaseModel):
    user = ForeignKey(User)
    outreach_type = CharField(choices=[
        'INCOMPLETE_PROFILE',
        'NO_APPLICATION', 
        'NO_JOB_SEARCH'
    ])
    sent_at = DateTimeField(auto_now_add=True)
```

The model has a unique constraint on `(user, outreach_type)` to ensure each user receives each type of outreach only once.

## Email Templates

Email templates are located in `backend/api/templates/authemail/`:

- `incomplete_profile_subject.txt` / `incomplete_profile.txt` / `incomplete_profile.html`
- `no_application_subject.txt` / `no_application.txt` / `no_application.html`
- `no_job_search_subject.txt` / `no_job_search.txt` / `no_job_search.html`

Each template set includes:
- A subject line
- Plain text version
- HTML version

## Scheduling (Optional)

To run this command automatically on a schedule, you can:

1. **Using cron** (Linux/Unix):
   ```bash
   # Run daily at 10 AM
   0 10 * * * cd /path/to/JobEdge/backend && python manage.py send_user_feedback_emails
   ```

2. **Using Celery Beat** (Django):
   Add to your Celery configuration:
   ```python
   from celery.schedules import crontab
   
   CELERY_BEAT_SCHEDULE = {
       'send-feedback-emails': {
           'task': 'api.tasks.send_user_feedback_emails',
           'schedule': crontab(hour=10, minute=0),  # Daily at 10 AM
       },
   }
   ```

3. **Using Django-Cron**:
   ```python
   from django_cron import CronJobBase, Schedule
   
   class SendFeedbackEmailsCronJob(CronJobBase):
       schedule = Schedule(run_at_times=['10:00'])
       code = 'api.send_feedback_emails'
       
       def do(self):
           call_command('send_user_feedback_emails')
   ```

## Testing

Tests are located in `backend/api/test_user_outreach.py` and cover:

- Correct identification of users in each segment
- Deduplication logic
- UserOutreach model constraints
- Command import and basic functionality

Run tests with:
```bash
python manage.py test api.test_user_outreach
```

## Monitoring

The command outputs:
- Success messages for each email sent
- Error messages if any email fails
- A summary showing counts for each segment

Example output:
```
Processing user segments...
✓ Sent INCOMPLETE_PROFILE email to user1@example.com
✓ Sent NO_APPLICATION email to user2@example.com
✓ Sent NO_JOB_SEARCH email to user3@example.com

=== Summary ===
Incomplete Profile emails sent: 5
No Application emails sent: 3
No Job Search emails sent: 7
Total emails sent: 15
```

## Customization

### Changing the YouTube Link

Edit `YOUTUBE_LINK` in `backend/api/management/commands/send_user_feedback_emails.py`:

```python
class Command(BaseCommand):
    YOUTUBE_LINK = 'https://youtu.be/YOUR_NEW_LINK'
```

### Adding New Segments

1. Add the new outreach type to `UserOutreach.OUTREACH_TYPES` in `backend/api/models/user_outreach.py`
2. Create email templates for the new segment
3. Add a method in the Command class to identify users in the new segment
4. Call the method in the `handle()` method

### Modifying Email Content

Edit the template files in `backend/api/templates/authemail/` to customize:
- Email subject lines
- Email body text
- HTML styling
- Call-to-action messages

## Troubleshooting

### No emails being sent

Check:
1. Email configuration in `settings.py` (ANYMAIL settings)
2. BREVO_API_KEY environment variable is set
3. Users exist in the identified segments (run with `--dry-run` to check)
4. UserOutreach records haven't already been created for these users

### Emails marked as spam

- Ensure SPF and DKIM records are properly configured
- Use a verified sender email address
- Keep email content professional and not too promotional

### Database errors

If you get migration errors:
```bash
python manage.py migrate api
```

## Security Considerations

- Email addresses are never shared with third parties
- Outreach tracking respects user privacy
- Users can opt out by replying to the email
- No sensitive user data is included in emails

## Future Enhancements

Potential improvements:
- Add more granular segments (e.g., users who started but didn't finish an application)
- Implement email preference management
- Add A/B testing for email content
- Track email open rates and click-through rates
- Add reminder emails for users who didn't respond
