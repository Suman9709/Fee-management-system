"""Small dependency-free PDF renderer for downloadable fee invoices."""

from textwrap import wrap


def _pdf_text(value):
    """Encode text safely for a basic PDF string literal."""

    return (
        str(value)
        .encode('latin-1', errors='replace')
        .decode('latin-1')
        .replace('\\', '\\\\')
        .replace('(', '\\(')
        .replace(')', '\\)')
    )


def render_invoice_pdf(invoice):
    """Return a compact, printable PDF invoice without an extra dependency."""

    payments = list(invoice.payments.all())
    paid_amount = sum((payment.amount for payment in payments), start=0)
    outstanding = max(0, invoice.total_amount - paid_amount)
    lines = [
        'SCHOOL FEE INVOICE',
        f'Invoice number: INV-{invoice.pk:06d}',
        f'Student: {invoice.student.full_name} ({invoice.student.student_id})',
        f'Class and section: {invoice.student.class_name}-{invoice.student.section}',
        f'Academic year: {invoice.academic_year}',
        f'Billing month: {invoice.billing_month:%B %Y}',
        f'Due date: {invoice.due_date:%d %b %Y}',
        '',
        f'School fee: INR {invoice.school_fee_amount:.2f}',
        f'Transport fee: INR {invoice.transport_fee_amount:.2f}',
        f'Total invoice amount: INR {invoice.total_amount:.2f}',
        f'Amount paid: INR {paid_amount:.2f}',
        f'Outstanding amount: INR {outstanding:.2f}',
        f'Invoice status: {invoice.get_status_display()}',
        '',
        'PAYMENT HISTORY',
    ]
    if payments:
        for payment in payments:
            reference = f' | Reference: {payment.reference_number}' if payment.reference_number else ''
            lines.append(
                f'{payment.payment_date:%d %b %Y} | INR {payment.amount:.2f} | '
                f'{payment.get_method_display()}{reference}'
            )
    else:
        lines.append('No payments have been recorded for this invoice.')
    lines.extend(['', 'This is a system-generated invoice from the Fee Management System.'])

    wrapped_lines = [part for line in lines for part in (wrap(line, width=88) or [''])]
    content_lines = ['BT', '/F1 11 Tf', '50 790 Td', '15 TL']
    for line in wrapped_lines:
        content_lines.extend([f'({_pdf_text(line)}) Tj', 'T*'])
    content_lines.append('ET')
    content = ('\n'.join(content_lines) + '\n').encode('latin-1')

    objects = [
        b'<< /Type /Catalog /Pages 2 0 R >>',
        b'<< /Type /Pages /Kids [3 0 R] /Count 1 >>',
        b'<< /Type /Page /Parent 2 0 R /MediaBox [0 0 595 842] '
        b'/Resources << /Font << /F1 5 0 R >> >> /Contents 4 0 R >>',
        b'<< /Length ' + str(len(content)).encode('ascii') + b' >>\nstream\n' + content + b'endstream',
        b'<< /Type /Font /Subtype /Type1 /BaseFont /Helvetica >>',
    ]

    document = bytearray(b'%PDF-1.4\n%\xe2\xe3\xcf\xd3\n')
    offsets = [0]
    for index, object_data in enumerate(objects, start=1):
        offsets.append(len(document))
        document.extend(f'{index} 0 obj\n'.encode('ascii'))
        document.extend(object_data)
        document.extend(b'\nendobj\n')
    xref_offset = len(document)
    document.extend(f'xref\n0 {len(objects) + 1}\n'.encode('ascii'))
    document.extend(b'0000000000 65535 f \n')
    for offset in offsets[1:]:
        document.extend(f'{offset:010d} 00000 n \n'.encode('ascii'))
    document.extend(
        f'trailer\n<< /Size {len(objects) + 1} /Root 1 0 R >>\nstartxref\n{xref_offset}\n%%EOF\n'.encode(
            'ascii'
        )
    )
    return bytes(document)
