from django.contrib import admin

from .models import ClassFeeStructure, FeeInvoice, Payment, PaymentAuditLog, TransportLocation

# Register your models here.
admin.site.register(ClassFeeStructure)
admin.site.register(TransportLocation)
admin.site.register(FeeInvoice)
admin.site.register(Payment)
admin.site.register(PaymentAuditLog)
