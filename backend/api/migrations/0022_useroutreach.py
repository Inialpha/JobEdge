# Generated manually for UserOutreach model

from django.db import migrations, models
import django.db.models.deletion


class Migration(migrations.Migration):

    dependencies = [
        ('api', '0021_remove_uncategorized_skills'),
    ]

    operations = [
        migrations.CreateModel(
            name='UserOutreach',
            fields=[
                ('id', models.CharField(default='', editable=False, help_text='Unique ID for the model instance', max_length=255, primary_key=True, serialize=False, unique=True)),
                ('outreach_type', models.CharField(choices=[('INCOMPLETE_PROFILE', 'Incomplete Profile'), ('NO_APPLICATION', 'No Application'), ('NO_JOB_SEARCH', 'No Job Search')], help_text='Type of outreach sent', max_length=50)),
                ('sent_at', models.DateTimeField(auto_now_add=True, help_text='Timestamp when the outreach was sent')),
                ('user', models.ForeignKey(help_text='User who received the outreach', on_delete=django.db.models.deletion.CASCADE, related_name='outreach_records', to='api.user')),
            ],
            options={
                'ordering': ['-sent_at'],
                'unique_together': {('user', 'outreach_type')},
            },
        ),
    ]
