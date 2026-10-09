# Merge the existing transport-location seed with the payment-audit schema.

from django.db import migrations


class Migration(migrations.Migration):

    dependencies = [
        ('fees', '0002_payment_audit_log'),
        ('fees', '0002_seed_begusarai_transport_locations'),
    ]

    operations = []
