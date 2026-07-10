from django.db import migrations, models


class Migration(migrations.Migration):

    dependencies = [
        ("api", "0022_alter_application_id_alter_resume_skills_and_more"),
    ]

    operations = [
        migrations.AddField(
            model_name="user",
            name="google_sub",
            field=models.CharField(blank=True, max_length=255, null=True, unique=True),
        ),
    ]
