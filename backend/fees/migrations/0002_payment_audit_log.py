# Generated manually to preserve the existing deployed fee schema.

import django.db.models.deletion
import django.utils.timezone
from django.conf import settings
from django.db import migrations, models


class Migration(migrations.Migration):

    dependencies = [
        ('fees', '0001_initial'),
        migrations.swappable_dependency(settings.AUTH_USER_MODEL),
    ]

    operations = [
        migrations.AddField(
            model_name='payment',
            name='updated_at',
            field=models.DateTimeField(auto_now=True, default=django.utils.timezone.now),
            preserve_default=False,
        ),
        migrations.AddField(
            model_name='payment',
            name='updated_by',
            field=models.ForeignKey(
                blank=True,
                null=True,
                on_delete=django.db.models.deletion.PROTECT,
                related_name='updated_payments',
                to=settings.AUTH_USER_MODEL,
            ),
        ),
        migrations.CreateModel(
            name='PaymentAuditLog',
            fields=[
                ('id', models.BigAutoField(auto_created=True, primary_key=True, serialize=False, verbose_name='ID')),
                ('previous_amount', models.DecimalField(decimal_places=2, max_digits=10)),
                ('new_amount', models.DecimalField(decimal_places=2, max_digits=10)),
                ('previous_payment_date', models.DateField()),
                ('new_payment_date', models.DateField()),
                ('previous_method', models.CharField(choices=[('cash', 'Cash'), ('card', 'Card'), ('bank_transfer', 'Bank transfer'), ('upi', 'UPI')], max_length=20)),
                ('new_method', models.CharField(choices=[('cash', 'Cash'), ('card', 'Card'), ('bank_transfer', 'Bank transfer'), ('upi', 'UPI')], max_length=20)),
                ('previous_reference_number', models.CharField(blank=True, max_length=100)),
                ('new_reference_number', models.CharField(blank=True, max_length=100)),
                ('changed_at', models.DateTimeField(auto_now_add=True)),
                ('changed_by', models.ForeignKey(on_delete=django.db.models.deletion.PROTECT, related_name='payment_corrections', to=settings.AUTH_USER_MODEL)),
                ('payment', models.ForeignKey(on_delete=django.db.models.deletion.PROTECT, related_name='audit_logs', to='fees.payment')),
            ],
            options={
                'ordering': ['-changed_at'],
            },
        ),
    ]
