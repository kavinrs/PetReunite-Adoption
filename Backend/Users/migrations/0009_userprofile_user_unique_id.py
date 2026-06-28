                                                

from django.db import migrations, models


class Migration(migrations.Migration):

    dependencies = [
        ('Users', '0008_remove_volunteerrequest_volunteering_preferences'),
    ]

    operations = [
        migrations.AddField(
            model_name='userprofile',
            name='user_unique_id',
            field=models.CharField(blank=True, max_length=32, null=True, unique=True),
        ),
    ]
