"""
Example usage of the send_user_feedback_emails management command

This script demonstrates how to test the user outreach system.
"""

# To run the command in dry-run mode (no emails sent):
# python manage.py send_user_feedback_emails --dry-run

# To run the command and send actual emails:
# python manage.py send_user_feedback_emails

# Expected output:
"""
Processing user segments...
✓ Sent INCOMPLETE_PROFILE email to user1@example.com
✓ Sent NO_APPLICATION email to user2@example.com
✓ Sent NO_JOB_SEARCH email to user3@example.com

=== Summary ===
Incomplete Profile emails sent: 5
No Application emails sent: 3
No Job Search emails sent: 7
Total emails sent: 15
"""

# To check which users would be contacted:
# python manage.py send_user_feedback_emails --dry-run

# To verify outreach records were created:
# python manage.py shell
"""
from api.models import UserOutreach
print(UserOutreach.objects.all().count())
print(UserOutreach.objects.values_list('user__email', 'outreach_type', 'sent_at'))
"""

# To run tests:
# python manage.py test api.test_user_outreach

# To view test coverage:
"""
coverage run --source='api' manage.py test api.test_user_outreach
coverage report -m
"""
