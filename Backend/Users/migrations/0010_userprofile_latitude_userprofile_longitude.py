                                               

from django.db import migrations, models


class Migration(migrations.Migration):

    dependencies = [
        ('Users', '0009_userprofile_user_unique_id'),
    ]

    operations = [
        migrations.AddField(
            model_name='userprofile',
            name='latitude',
            field=models.FloatField(blank=True, help_text='Latitude coordinate for location', null=True),
        ),
        migrations.AddField(
            model_name='userprofile',
            name='longitude',
            field=models.FloatField(blank=True, help_text='Longitude coordinate for location', null=True),
        ),
    ]
