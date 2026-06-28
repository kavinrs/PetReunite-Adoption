                                                         

from django.db import migrations, models


class Migration(migrations.Migration):

    dependencies = [
        ('Pets', '0026_add_adoption_conversion_fields'),
    ]

    operations = [
        migrations.AddField(
            model_name='foundpetreport',
            name='image_verification_status',
            field=models.CharField(
                choices=[
                    ('verified', 'Verified'),
                    ('fake_detected', 'Fake Detected'),
                    ('uncertain', 'Uncertain'),
                    ('not_checked', 'Not Checked')
                ],
                default='not_checked',
                max_length=20,
                help_text='AI-based verification status of the uploaded pet image'
            ),
        ),
        migrations.AddField(
            model_name='lostpetreport',
            name='image_verification_status',
            field=models.CharField(
                choices=[
                    ('verified', 'Verified'),
                    ('fake_detected', 'Fake Detected'),
                    ('uncertain', 'Uncertain'),
                    ('not_checked', 'Not Checked')
                ],
                default='not_checked',
                max_length=20,
                help_text='AI-based verification status of the uploaded pet image'
            ),
        ),
    ]
