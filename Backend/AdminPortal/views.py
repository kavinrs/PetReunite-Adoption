from django.conf import settings
from django.core.mail import send_mail

from rest_framework.decorators import api_view, permission_classes
from rest_framework import permissions, status
from rest_framework.response import Response

from Users.serializers import RegisterSerializer
from Users.models import UserProfile
from .models import AdminInvite, AdminProfile


@api_view(["GET"])
@permission_classes([permissions.AllowAny])
def verify_admin_email(request):
    """Verify a superuser email and send its admin_code via email.

    Responses:
        200 {"exists": true}  – email belongs to a superuser, code sent via email
        200 {"exists": false} – no matching superuser
        4xx/5xx {"error": "..."} – validation or server error
    """

    raw_email = request.query_params.get("email", "").strip().lower()
    if not raw_email:
        return Response({"error": "Email is required"}, status=status.HTTP_400_BAD_REQUEST)

    qs = AdminInvite.objects.all()
    if "@" in raw_email:
        invite = qs.filter(email__iexact=raw_email).first()
    else:
        # If user typed only the username part, match any invite whose email
        # starts with that local-part followed by '@'.
        invite = qs.filter(email__istartswith=raw_email + "@").first()
    if not invite:
        # Do not leak details – just say it does not exist for this flow
        return Response({"exists": False}, status=status.HTTP_200_OK)

    if not invite.admin_code:
        return Response({"error": "Admin code is not configured"}, status=status.HTTP_500_INTERNAL_SERVER_ERROR)

    from_email = getattr(settings, "DEFAULT_FROM_EMAIL", None) or getattr(settings, "EMAIL_HOST_USER", None)
    if not from_email:
        return Response({"error": "Email sending is not configured on the server"}, status=status.HTTP_500_INTERNAL_SERVER_ERROR)

    subject = "Your PawReunite admin registration code"
    message = f"Your admin registration code is: {invite.admin_code}"
    recipient_email = invite.email

    # Simple debug log so you can see the email+code in the runserver console
    print(f"[verify_admin_email] sending admin_code={invite.admin_code!r} to {recipient_email!r}")

    try:
        send_mail(subject, message, from_email, [recipient_email], fail_silently=False)
    except Exception:
        return Response({"error": "Failed to send email"}, status=status.HTTP_500_INTERNAL_SERVER_ERROR)

    # Do NOT include the code in JSON – only via email
    return Response({"exists": True}, status=status.HTTP_200_OK)


@api_view(["POST"])
@permission_classes([permissions.AllowAny])
def admin_register(request):
    data = request.data.copy()

    raw_email = str(data.get("email", "")).strip().lower()
    code = str(data.get("code", "")).strip()

    if not raw_email or not code:
        return Response({"error": "Email and admin code are required"}, status=status.HTTP_400_BAD_REQUEST)

    qs = AdminInvite.objects.filter(admin_code=code)
    if "@" in raw_email:
        invite = qs.filter(email__iexact=raw_email).first()
    else:
        invite = qs.filter(email__istartswith=raw_email + "@").first()
    if not invite:
        return Response({"error": "Invalid admin email or code"}, status=status.HTTP_400_BAD_REQUEST)

    email = invite.email
    data["email"] = email
    data.pop("code", None)

    serializer = RegisterSerializer(data=data)
    if not serializer.is_valid():
        return Response(
            {
                "ok": False,
                "message": "Admin registration failed",
                "errors": serializer.errors,
            },
            status=status.HTTP_400_BAD_REQUEST,
        )

    user = serializer.save()
    user.is_staff = True
    user.save(update_fields=["is_staff"])

    try:
        profile = UserProfile.objects.get(user=user)
        profile.role = "admin"
        profile.save(update_fields=["role"])
    except UserProfile.DoesNotExist:
        pass

    AdminProfile.objects.create(user=user, admin_code=invite.admin_code)

    return Response(
        {
            "ok": True,
            "message": "Admin registered successfully",
            "user": {
                "username": user.username,
                "email": user.email,
            },
        },
        status=status.HTTP_201_CREATED,
    )
