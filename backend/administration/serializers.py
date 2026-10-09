from rest_framework import serializers

from .models import Announcement, Holiday, SupportRequest, TimetableEntry


class AnnouncementSerializer(serializers.ModelSerializer):
    published_by_name = serializers.CharField(source='published_by.username', read_only=True)

    class Meta:
        model = Announcement
        fields = [
            'id', 'audience', 'title', 'message', 'is_published',
            'published_by', 'published_by_name', 'published_at', 'updated_at',
        ]
        read_only_fields = ['id', 'published_by', 'published_by_name', 'published_at', 'updated_at']

    def validate_title(self, value):
        return value.strip()

    def validate_message(self, value):
        return value.strip()


class HolidaySerializer(serializers.ModelSerializer):
    created_by_name = serializers.CharField(source='created_by.username', read_only=True)

    class Meta:
        model = Holiday
        fields = [
            'id', 'audience', 'name', 'start_date', 'end_date', 'is_published',
            'created_by', 'created_by_name', 'created_at', 'updated_at',
        ]
        read_only_fields = ['id', 'created_by', 'created_by_name', 'created_at', 'updated_at']

    def validate_name(self, value):
        return value.strip()

    def validate(self, attrs):
        start_date = attrs.get('start_date', getattr(self.instance, 'start_date', None))
        end_date = attrs.get('end_date', getattr(self.instance, 'end_date', None))
        if start_date and end_date and end_date < start_date:
            raise serializers.ValidationError({'end_date': 'The end date cannot be before the start date.'})
        return attrs


class TimetableEntrySerializer(serializers.ModelSerializer):
    day_name = serializers.CharField(source='get_day_of_week_display', read_only=True)
    created_by_name = serializers.CharField(source='created_by.username', read_only=True)

    class Meta:
        model = TimetableEntry
        fields = [
            'id', 'academic_year', 'class_name', 'section', 'day_of_week', 'day_name',
            'start_time', 'end_time', 'subject', 'room', 'teacher_name',
            'created_by', 'created_by_name', 'created_at', 'updated_at',
        ]
        read_only_fields = ['id', 'created_by', 'created_by_name', 'created_at', 'updated_at']

    def validate(self, attrs):
        start_time = attrs.get('start_time', getattr(self.instance, 'start_time', None))
        end_time = attrs.get('end_time', getattr(self.instance, 'end_time', None))
        if start_time and end_time and end_time <= start_time:
            raise serializers.ValidationError({'end_time': 'The end time must be after the start time.'})
        return attrs

    def validate_academic_year(self, value):
        return value.strip()

    def validate_class_name(self, value):
        return value.strip()

    def validate_section(self, value):
        return value.strip()


class SupportRequestSerializer(serializers.ModelSerializer):
    student_id = serializers.CharField(source='student.student_id', read_only=True)
    student_name = serializers.CharField(source='student.full_name', read_only=True)
    responded_by_name = serializers.CharField(
        source='responded_by.username', read_only=True, allow_null=True
    )

    class Meta:
        model = SupportRequest
        fields = [
            'id', 'student', 'student_id', 'student_name', 'subject', 'message',
            'status', 'office_response', 'responded_by', 'responded_by_name',
            'created_at', 'updated_at',
        ]
        read_only_fields = [
            'id', 'student', 'student_id', 'student_name', 'responded_by',
            'responded_by_name', 'created_at', 'updated_at',
        ]

    def validate_subject(self, value):
        return value.strip()

    def validate_message(self, value):
        return value.strip()
