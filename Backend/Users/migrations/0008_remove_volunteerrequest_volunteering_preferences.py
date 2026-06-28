                                               

from django.db import migrations


class Migration(migrations.Migration):

    dependencies = [
        ('Users', '0007_volunteerrequest'),
    ]

    operations = [
        migrations.RemoveField(
            model_name='volunteerrequest',
            name='volunteering_preferences',
        ),
    ]
