                                               

from django.db import migrations, models


class Migration(migrations.Migration):

    dependencies = [
        ('Pets', '0029_directchatrequest'),
    ]

    operations = [
        migrations.AlterField(
            model_name='chatroomparticipant',
            name='role',
            field=models.CharField(choices=[('admin', 'Admin'), ('requested_user', 'Requested User'), ('founded_user', 'Founded User'), ('participant', 'Participant')], max_length=50),
        ),
        migrations.AlterField(
            model_name='notification',
            name='notification_type',
            field=models.CharField(choices=[('chat_request', 'Chat Request'), ('chat_accepted', 'Chat Accepted'), ('chat_rejected', 'Chat Rejected'), ('chat_message', 'Chat Message'), ('chat_room_created', 'Chat Room Created'), ('chat_status_changed', 'Chat Status Changed'), ('chatroom_invitation', 'Chatroom Invitation'), ('chatroom_request_accepted', 'Chatroom Request Accepted'), ('chatroom_request_rejected', 'Chatroom Request Rejected'), ('direct_chat_request', 'Direct Chat Request'), ('direct_chat_accepted', 'Direct Chat Accepted'), ('direct_chat_rejected', 'Direct Chat Rejected'), ('adoption_request', 'Adoption Request'), ('adoption_status', 'Adoption Status'), ('report_status', 'Report Status')], max_length=32),
        ),
    ]
