from django.db import migrations, models
import django.db.models.deletion


class Migration(migrations.Migration):

    dependencies = [
        ("Pets", "0015_add_pet_unique_id_to_adoption"),
    ]

    operations = [
        migrations.AddField(
            model_name="chatmessage",
            name="reply_to",
            field=models.ForeignKey(
                blank=True,
                null=True,
                on_delete=django.db.models.deletion.SET_NULL,
                related_name="replies",
                to="Pets.chatmessage",
            ),
        ),
        migrations.AddField(
            model_name="chatmessage",
            name="is_deleted",
            field=models.BooleanField(default=False),
        ),
        migrations.AddField(
            model_name="chatmessage",
            name="deleted_for",
            field=models.JSONField(blank=True, default=list),
        ),
    ]


