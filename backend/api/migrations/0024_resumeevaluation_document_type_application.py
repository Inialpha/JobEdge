import django.db.models.deletion
from django.db import migrations, models


class Migration(migrations.Migration):

    dependencies = [
        ('api', '0023_resume_section_order_resumeevaluation'),
    ]

    operations = [
        migrations.AddField(
            model_name='resumeevaluation',
            name='document_type',
            field=models.CharField(choices=[('resume', 'Resume'), ('cover_letter', 'Cover letter')], db_index=True, default='resume', help_text='Which document was evaluated', max_length=20),
        ),
        migrations.AddField(
            model_name='resumeevaluation',
            name='application',
            field=models.ForeignKey(blank=True, help_text='Application the document was created for, if any', null=True, on_delete=django.db.models.deletion.SET_NULL, related_name='evaluations', to='api.application'),
        ),
        migrations.AlterField(
            model_name='resumeevaluation',
            name='job_description',
            field=models.TextField(help_text='Job description the document was tailored to'),
        ),
    ]
