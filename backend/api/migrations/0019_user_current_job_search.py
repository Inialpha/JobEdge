# Generated migration for adding current_job_search field to User model

from django.db import migrations, models


class Migration(migrations.Migration):

    dependencies = [
        ('api', '0018_alter_resume_awards_alter_resume_certifications'),
    ]

    operations = [
        migrations.AddField(
            model_name='user',
            name='current_job_search',
            field=models.JSONField(default=list, help_text='Current job search results'),
        ),
    ]
