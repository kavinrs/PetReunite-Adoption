                                               

from django.db import migrations, models


class Migration(migrations.Migration):

    dependencies = [
        ('Users', '0005_lostpetreport'),
    ]

    operations = [
        migrations.RemoveField(
            model_name='lostpetreport',
            name='reporter',
        ),
        migrations.AddField(
            model_name='userprofile',
            name='landmark',
            field=models.CharField(blank=True, max_length=255),
        ),
        migrations.AddField(
            model_name='userprofile',
            name='location_url',
            field=models.URLField(blank=True, max_length=500),
        ),
        migrations.DeleteModel(
            name='FoundPetReport',
        ),
        migrations.DeleteModel(
            name='LostPetReport',
        ),
    ]
