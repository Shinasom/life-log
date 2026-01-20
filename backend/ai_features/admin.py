from django.contrib import admin
from .models import GoalInsight

@admin.register(GoalInsight)
class GoalInsightAdmin(admin.ModelAdmin):
    # Columns to show in the list view
    list_display = ('goal', 'created_at', 'short_overview')
    
    # Enable search by Goal Name or the Insight text
    search_fields = ('goal__name', 'overview', 'reflection')
    
    # Filter by date
    list_filter = ('created_at',)
    
    # Make creation date read-only
    readonly_fields = ('created_at',)

    def short_overview(self, obj):
        """Helper to truncate long text in the list view"""
        return obj.overview[:75] + "..." if obj.overview else "-"
    short_overview.short_description = "Overview Preview"