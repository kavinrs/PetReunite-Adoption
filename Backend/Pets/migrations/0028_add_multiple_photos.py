                                                 

from django.db import migrations, models
import django.db.models.deletion


class Migration(migrations.Migration):

    dependencies = [
        ('Pets', '0027_add_image_verification_status'),
    ]

    operations = [
        migrations.CreateModel(
            name='FoundPetPhoto',
            fields=[
                ('id', models.BigAutoField(auto_created=True, primary_key=True, serialize=False, verbose_name='ID')),
                ('photo', models.ImageField(help_text='Additional photo of the found pet', upload_to='found_pets/%Y/%m/%d/')),
                ('image_verification_status', models.CharField(choices=[('verified', 'Verified'), ('fake_detected', 'Fake Detected'), ('uncertain', 'Uncertain'), ('not_checked', 'Not Checked')], default='not_checked', help_text='AI-based verification status of this photo', max_length=20)),
                ('verification_confidence', models.FloatField(blank=True, help_text='Confidence score from AI verification (0-1)', null=True)),
                ('verification_raw_score', models.FloatField(blank=True, help_text='Raw score from AI model', null=True)),
                ('order', models.PositiveIntegerField(default=0, help_text='Display order of the photo')),
                ('uploaded_at', models.DateTimeField(auto_now_add=True)),
                ('report', models.ForeignKey(on_delete=django.db.models.deletion.CASCADE, related_name='additional_photos', to='Pets.foundpetreport')),
            ],
            options={
                'verbose_name': 'Found Pet Photo',
                'verbose_name_plural': 'Found Pet Photos',
                'ordering': ['order', 'uploaded_at'],
            },
        ),
        migrations.CreateModel(
            name='LostPetPhoto',
            fields=[
                ('id', models.BigAutoField(auto_created=True, primary_key=True, serialize=False, verbose_name='ID')),
                ('photo', models.ImageField(help_text='Additional photo of the lost pet', upload_to='lost_pets/%Y/%m/%d/')),
                ('image_verification_status', models.CharField(choices=[('verified', 'Verified'), ('fake_detected', 'Fake Detected'), ('uncertain', 'Uncertain'), ('not_checked', 'Not Checked')], default='not_checked', help_text='AI-based verification status of this photo', max_length=20)),
                ('verification_confidence', models.FloatField(blank=True, help_text='Confidence score from AI verification (0-1)', null=True)),
                ('verification_raw_score', models.FloatField(blank=True, help_text='Raw score from AI model', null=True)),
                ('order', models.PositiveIntegerField(default=0, help_text='Display order of the photo')),
                ('uploaded_at', models.DateTimeField(auto_now_add=True)),
                ('report', models.ForeignKey(on_delete=django.db.models.deletion.CASCADE, related_name='additional_photos', to='Pets.lostpetreport')),
            ],
            options={
                'verbose_name': 'Lost Pet Photo',
                'verbose_name_plural': 'Lost Pet Photos',
                'ordering': ['order', 'uploaded_at'],
            },
        ),
    ]
