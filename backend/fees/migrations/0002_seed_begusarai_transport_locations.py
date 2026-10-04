from decimal import Decimal

from django.db import migrations


DEFAULT_LOCATIONS = [
    'Begusarai Town',
    'Barauni',
    'Bihat',
    'Ballia',
    'Teghra',
    'Lakhminia',
    'Matihani',
]


def seed_transport_locations(apps, schema_editor):
    TransportLocation = apps.get_model('fees', 'TransportLocation')
    for location_name in DEFAULT_LOCATIONS:
        TransportLocation.objects.get_or_create(
            location_name=location_name,
            defaults={
                'monthly_transport_fee': Decimal('0.00'),
                'is_active': True,
            },
        )


class Migration(migrations.Migration):
    dependencies = [
        ('fees', '0001_initial'),
    ]

    operations = [
        migrations.RunPython(seed_transport_locations, migrations.RunPython.noop),
    ]
