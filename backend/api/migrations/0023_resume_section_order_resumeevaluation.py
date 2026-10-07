import uuid

import django.db.models.deletion
from django.conf import settings
from django.db import migrations, models


class Migration(migrations.Migration):

    dependencies = [
        ('api', '0022_alter_application_id_alter_resume_skills_and_more'),
    ]

    operations = [
        migrations.AddField(
            model_name='resume',
            name='section_order',
            field=models.JSONField(blank=True, default=list, help_text='Order of the movable resume sections (contact and summary are always first). Empty means the default order'),
        ),
        migrations.CreateModel(
            name='ResumeEvaluation',
            fields=[
                ('id', models.UUIDField(default=uuid.uuid4, editable=False, primary_key=True, serialize=False)),
                ('created_at', models.DateTimeField(auto_now_add=True)),
                ('updated_at', models.DateTimeField(auto_now=True)),
                ('job_description', models.TextField(help_text='Job description the resume was tailored to')),
                ('workflow_version', models.CharField(help_text='Version of the generation/evaluation loop', max_length=64)),
                ('prompt_version', models.CharField(help_text='Version of the prompts used', max_length=64)),
                ('generator_model', models.CharField(help_text='Model that wrote the resume', max_length=128)),
                ('evaluator_model', models.CharField(blank=True, default='', help_text='Model used as judge, if any', max_length=128)),
                ('overall_score', models.FloatField(help_text='Weighted overall score from 0 to 1')),
                ('passed', models.BooleanField(default=False, help_text='Whether the resume met every quality threshold')),
                ('scores', models.JSONField(default=dict, help_text='Score per evaluation dimension')),
                ('report', models.JSONField(default=dict, help_text='Full evaluation report: iterations, diagnostics, issues')),
                ('user', models.ForeignKey(help_text='User the resume was generated for', on_delete=django.db.models.deletion.CASCADE, related_name='resume_evaluations', to=settings.AUTH_USER_MODEL)),
            ],
            options={
                'ordering': ['-created_at'],
            },
        ),
    ]
