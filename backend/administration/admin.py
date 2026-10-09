from django.contrib import admin

from .models import Announcement, Holiday, SupportRequest, TimetableEntry


@admin.register(Announcement)
class AnnouncementAdmin(admin.ModelAdmin):
    list_display = ('title', 'audience', 'is_published', 'published_at', 'published_by')
    list_filter = ('audience', 'is_published')
    search_fields = ('title', 'message')


@admin.register(Holiday)
class HolidayAdmin(admin.ModelAdmin):
    list_display = ('name', 'start_date', 'end_date', 'audience', 'is_published')
    list_filter = ('audience', 'is_published')


@admin.register(TimetableEntry)
class TimetableEntryAdmin(admin.ModelAdmin):
    list_display = ('academic_year', 'class_name', 'section', 'day_of_week', 'start_time', 'subject')
    list_filter = ('academic_year', 'class_name', 'section', 'day_of_week')
    search_fields = ('subject', 'teacher_name', 'room')


@admin.register(SupportRequest)
class SupportRequestAdmin(admin.ModelAdmin):
    list_display = ('subject', 'student', 'status', 'created_at', 'responded_by')
    list_filter = ('status',)
    search_fields = ('student__student_id', 'student__full_name', 'subject', 'message')
