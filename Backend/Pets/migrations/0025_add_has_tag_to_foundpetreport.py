                                               

from django.db import migrations, models


class Migration(migrations.Migration):

    dependencies = [
        ('Pets', '0024_foundpetreport_pet_name'),
    ]

    operations = [
        migrations.AddField(
            model_name='foundpetreport',
            name='has_tag',
            field=models.CharField(blank=True, choices=[('present', 'Present'), ('not_present', 'Not Present')], default='not_present', max_length=20),
        ),
    ]
