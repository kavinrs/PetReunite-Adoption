# Generated migration for adding attachment fields to ChatMessage and ChatroomMessage

from django.db import migrations, models


class Migration(migrations.Migration):

    dependencies = [
        ('Pets', '0021_alter_chatroomaccessrequest_unique_together_and_more'),
    ]

    operations = [
        # ChatMessage attachment fields
        migrations.AddField(
            model_name='chatmessage',
            name='attachment',
            field=models.FileField(blank=True, help_text='File attachment (image, video, document, or folder archive)', null=True, upload_to='chat_attachments/%Y/%m/%d/'),
        ),
        migrations.AddField(
            model_name='chatmessage',
            name='attachment_type',
            field=models.CharField(blank=True, choices=[('image', 'Image'), ('video', 'Video'), ('document', 'Document'), ('folder', 'Folder Archive')], help_text='Type of attachment', max_length=20, null=True),
        ),
        migrations.AddField(
            model_name='chatmessage',
            name='attachment_name',
            field=models.CharField(blank=True, help_text='Original filename', max_length=255, null=True),
        ),
        migrations.AddField(
            model_name='chatmessage',
            name='attachment_size',
            field=models.IntegerField(blank=True, help_text='File size in bytes', null=True),
        ),
        migrations.AlterField(
            model_name='chatmessage',
            name='text',
            field=models.TextField(blank=True),
        ),
        
        # ChatroomMessage attachment fields
        migrations.AddField(
            model_name='chatroommessage',
            name='attachment',
            field=models.FileField(blank=True, help_text='File attachment (image, video, document, or folder archive)', null=True, upload_to='chatroom_attachments/%Y/%m/%d/'),
        ),
        migrations.AddField(
            model_name='chatroommessage',
            name='attachment_type',
            field=models.CharField(blank=True, choices=[('image', 'Image'), ('video', 'Video'), ('document', 'Document'), ('folder', 'Folder Archive')], help_text='Type of attachment', max_length=20, null=True),
        ),
        migrations.AddField(
            model_name='chatroommessage',
            name='attachment_name',
            field=models.CharField(blank=True, help_text='Original filename', max_length=255, null=True),
        ),
        migrations.AddField(
            model_name='chatroommessage',
            name='attachment_size',
            field=models.IntegerField(blank=True, help_text='File size in bytes', null=True),
        ),
        migrations.AlterField(
            model_name='chatroommessage',
            name='text',
            field=models.TextField(blank=True),
        ),
    ]
