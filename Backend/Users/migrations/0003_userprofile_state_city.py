from django.db import migrations, models


class Migration(migrations.Migration):

    dependencies = [
        ("Users", "0002_userprofile_pincode"),
    ]

    operations = [
        migrations.AddField(
            model_name="userprofile",
            name="city",
            field=models.CharField(blank=True, max_length=100),
        ),
        migrations.AddField(
            model_name="userprofile",
            name="state",
            field=models.CharField(blank=True, max_length=100),
        ),
    ]

