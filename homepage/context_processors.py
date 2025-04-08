from .models import Announcement

def unseen_announcements(request):
    if request.user.is_authenticated:
        return {
            'has_unseen_announcements': Announcement.objects
                .filter(is_active=True)
                .exclude(seen_by=request.user)
                .exists()
        }
    return {'has_unseen_announcements': False}
