                                               

import django.db.models.deletion
from django.conf import settings
from django.db import migrations, models


class Migration(migrations.Migration):

    dependencies = [
        ('Pets', '0028_add_multiple_photos'),
        migrations.swappable_dependency(settings.AUTH_USER_MODEL),
    ]

    operations = [
        migrations.CreateModel(
            name='DirectChatRequest',
            fields=[
                ('id', models.BigAutoField(auto_created=True, primary_key=True, serialize=False, verbose_name='ID')),
                ('reason', models.TextField(help_text='Reason for wanting to chat', max_length=500)),
                ('status', models.CharField(choices=[('pending', 'Pending'), ('accepted', 'Accepted'), ('rejected', 'Rejected')], default='pending', max_length=20)),
                ('created_at', models.DateTimeField(auto_now_add=True)),
                ('updated_at', models.DateTimeField(auto_now=True)),
                ('receiver', models.ForeignKey(help_text='User receiving the chat request', on_delete=django.db.models.deletion.CASCADE, related_name='received_direct_chat_requests', to=settings.AUTH_USER_MODEL)),
                ('sender', models.ForeignKey(help_text='User sending the chat request', on_delete=django.db.models.deletion.CASCADE, related_name='sent_direct_chat_requests', to=settings.AUTH_USER_MODEL)),
            ],
            options={
                'ordering': ['-created_at'],
                'unique_together': {('sender', 'receiver', 'status')},
            },
        ),
    ]
