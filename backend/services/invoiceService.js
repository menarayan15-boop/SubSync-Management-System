import Invoice from '../models/Invoice.js';

export const generateInvoiceNumber = async () => {
  const currentYear = new Date().getFullYear();
  const count = await Invoice.countDocuments();
  const nextNumber = String(count + 1).padStart(5, '0');
  return `INV-${currentYear}-${nextNumber}`;
};

export const createInvoiceRecord = async ({
  user,
  subscription,
  payment,
  plan,
  billingCycle,
  amount,
}) => {
  const invoiceNumber = await generateInvoiceNumber();

  // 18% GST calculation (included or added)
  // Let's calculate standard subtotal and tax
  const subtotal = Math.round((amount / 1.18) * 100) / 100;
  const taxAmount = Math.round((amount - subtotal) * 100) / 100;

  const invoice = await Invoice.create({
    invoiceNumber,
    user: user._id,
    subscription: subscription ? subscription._id : null,
    payment: payment ? payment._id : null,
    planName: plan.name,
    billingCycle,
    subtotal,
    taxRate: 18,
    taxAmount,
    total: amount,
    currency: plan.currency || 'INR',
    status: 'Paid',
    billingDetails: {
      name: user.name,
      email: user.email,
      phone: user.phone || 'N/A',
      address: 'Digital Subscription Customer, India',
    },
    items: [
      {
        description: `SubSync ${plan.name} Membership (${billingCycle.toUpperCase()} Billing)`,
        amount: subtotal,
        quantity: 1,
      },
    ],
    issueDate: new Date(),
    paidAt: new Date(),
  });

  return invoice;
};

export const renderInvoiceHtml = (invoice, user) => {
  return `
    <!DOCTYPE html>
    <html>
    <head>
      <meta charset="utf-8" />
      <title>Invoice - ${invoice.invoiceNumber}</title>
      <style>
        body { font-family: 'Inter', -apple-system, sans-serif; color: #1e293b; background: #fff; margin: 0; padding: 40px; }
        .invoice-card { max-width: 800px; margin: 0 auto; border: 1px solid #e2e8f0; border-radius: 12px; padding: 40px; box-shadow: 0 4px 6px -1px rgba(0,0,0,0.05); }
        .header { display: flex; justify-content: space-between; align-items: center; border-bottom: 2px solid #f1f5f9; padding-bottom: 24px; }
        .logo-title { font-size: 24px; font-weight: 800; color: #0f172a; display: flex; align-items: center; gap: 8px; }
        .logo-title span { color: #0d9488; }
        .badge { background: #ccfbf1; color: #0f766e; padding: 4px 12px; border-radius: 9999px; font-size: 12px; font-weight: 700; text-transform: uppercase; }
        .meta-grid { display: grid; grid-template-columns: 1fr 1fr; gap: 24px; margin: 30px 0; }
        .meta-col h4 { margin: 0 0 8px 0; color: #64748b; font-size: 12px; text-transform: uppercase; letter-spacing: 0.05em; }
        .meta-col p { margin: 4px 0; font-size: 14px; font-weight: 500; }
        table { width: 100%; border-collapse: collapse; margin: 30px 0; }
        th { text-align: left; padding: 12px; background: #f8fafc; color: #475569; font-size: 13px; text-transform: uppercase; border-bottom: 1px solid #e2e8f0; }
        td { padding: 16px 12px; border-bottom: 1px solid #f1f5f9; font-size: 14px; }
        .totals-section { width: 300px; margin-left: auto; }
        .total-row { display: flex; justify-content: space-between; padding: 8px 0; font-size: 14px; color: #64748b; }
        .grand-total { font-size: 18px; font-weight: 800; color: #0f172a; border-top: 2px solid #0f172a; padding-top: 12px; margin-top: 8px; }
        .footer { text-align: center; margin-top: 50px; padding-top: 24px; border-top: 1px solid #f1f5f9; color: #94a3b8; font-size: 12px; }
        @media print {
          body { padding: 0; }
          .invoice-card { border: none; box-shadow: none; padding: 0; }
          .print-btn { display: none; }
        }
      </style>
    </head>
    <body>
      <div class="invoice-card">
        <div class="header">
          <div>
            <div class="logo-title">Sub<span>Sync</span></div>
            <p style="margin: 4px 0 0 0; color: #64748b; font-size: 13px;">Membership & Subscription Cloud</p>
          </div>
          <div style="text-align: right;">
            <div class="badge">${invoice.status}</div>
            <p style="margin: 8px 0 0 0; font-weight: 700; font-size: 16px;">${invoice.invoiceNumber}</p>
          </div>
        </div>

        <div class="meta-grid">
          <div class="meta-col">
            <h4>Billed To:</h4>
            <p><strong>${user.name}</strong></p>
            <p>${user.email}</p>
            <p>Phone: ${user.phone || 'N/A'}</p>
          </div>
          <div class="meta-col" style="text-align: right;">
            <h4>Invoice Details:</h4>
            <p><strong>Issue Date:</strong> ${new Date(invoice.issueDate).toLocaleDateString()}</p>
            <p><strong>Payment Status:</strong> ${invoice.status}</p>
            <p><strong>Currency:</strong> ${invoice.currency}</p>
          </div>
        </div>

        <table>
          <thead>
            <tr>
              <th>Description</th>
              <th style="text-align: center;">Qty</th>
              <th style="text-align: right;">Amount (${invoice.currency})</th>
            </tr>
          </thead>
          <tbody>
            ${invoice.items
              .map(
                (item) => `
              <tr>
                <td><strong>${item.description}</strong></td>
                <td style="text-align: center;">${item.quantity}</td>
                <td style="text-align: right;">₹${item.amount.toFixed(2)}</td>
              </tr>
            `
              )
              .join('')}
          </tbody>
        </table>

        <div class="totals-section">
          <div class="total-row">
            <span>Subtotal:</span>
            <span>₹${invoice.subtotal.toFixed(2)}</span>
          </div>
          <div class="total-row">
            <span>GST (${invoice.taxRate}%):</span>
            <span>₹${invoice.taxAmount.toFixed(2)}</span>
          </div>
          <div class="total-row grand-total">
            <span>Total Paid:</span>
            <span>₹${invoice.total.toFixed(2)}</span>
          </div>
        </div>

        <div class="footer">
          <p>Thank you for subscribing to SubSync! This is a computer-generated tax invoice and requires no physical signature.</p>
          <p>Need support? Contact us at support@subsync.com</p>
        </div>
      </div>
      <div style="text-align: center; margin-top: 24px;" class="print-btn">
        <button onclick="window.print()" style="background: #0f172a; color: white; padding: 10px 24px; border-radius: 8px; border: none; font-weight: 600; cursor: pointer;">
          Print / Download PDF
        </button>
      </div>
    </body>
    </html>
  `;
};
