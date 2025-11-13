# Generated manually for Application model

from django.db import migrations, models
import django.db.models.deletion


class Migration(migrations.Migration):

    dependencies = [
        ('api', '0019_user_current_job_search'),
    ]

    operations = [
        migrations.CreateModel(
            name='Application',
            fields=[
                ('id', models.CharField(default='', editable=False, help_text='Unique ID for the model instance', max_length=255, primary_key=True, serialize=False, unique=True)),
                ('job_description', models.TextField(help_text='Job description for this application')),
                ('cover_letter', models.TextField(help_text='Cover letter for this application')),
                ('job_link', models.URLField(blank=True, help_text='Optional link to the job posting', max_length=500, null=True)),
                ('created_at', models.DateTimeField(auto_now_add=True, help_text='Timestamp when the application was created')),
                ('updated_at', models.DateTimeField(auto_now=True, help_text='Timestamp when the application was last updated')),
                ('resume', models.ForeignKey(help_text='Resume associated with this application', on_delete=django.db.models.deletion.CASCADE, related_name='applications', to='api.resume')),
                ('user', models.ForeignKey(help_text='User who created the application', on_delete=django.db.models.deletion.CASCADE, related_name='applications', to='api.user')),
            ],
            options={
                'abstract': False,
            },
        ),
    ]
