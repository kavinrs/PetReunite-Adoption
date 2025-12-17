from django.db import migrations, models


class Migration(migrations.Migration):

    dependencies = [
        ("Pets", "0016_chatmessage_reply_deleted_fields"),
    ]

    operations = [
        migrations.AlterField(
            model_name="conversation",
            name="status",
            field=models.CharField(
                choices=[
                    ("requested", "Requested"),
                    ("pending_user", "Pending User Confirmation"),
                    ("active", "Active"),
                    ("read_only", "Read Only"),
                    ("closed", "Closed"),
                ],
                default="requested",
                max_length=32,
            ),
        ),
    ]


