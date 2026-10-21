const { json, getUser, supabaseRest } = require('./_shared');
exports.handler = async (event) => {
  if (event.httpMethod !== 'POST' && event.httpMethod !== 'GET') return json(405, { error: 'Method not allowed' });
  try {
    let user;
    if (event.httpMethod === 'POST') user = await getUser(event.headers.authorization || event.headers.Authorization);
    const reference = event.queryStringParameters?.reference || (event.body ? JSON.parse(event.body).reference : '');
    if (!reference) return json(400, { error: 'A Paystack reference is required.' });
    const rows = await supabaseRest(`global_pen_purchases?paystack_reference=eq.${encodeURIComponent(reference)}&select=id,reader_id,book_id,amount_minor,payment_status`, 'GET');
    if (!rows.length) return json(404, { error: 'Purchase record not found.' });
    const purchase = rows[0];
    if (user && user.id !== purchase.reader_id) return json(403, { error: 'This purchase belongs to another account.' });
    const verifyResponse = await fetch(`https://api.paystack.co/transaction/verify/${encodeURIComponent(reference)}`, { headers: { Authorization: `Bearer ${process.env.PAYSTACK_SECRET_KEY}` } });
    const verified = await verifyResponse.json();
    if (!verifyResponse.ok || !verified.status || verified.data?.status !== 'success' || Number(verified.data?.amount) !== Number(purchase.amount_minor) || verified.data?.currency !== 'NGN') {
      if (purchase.payment_status !== 'paid') await supabaseRest(`global_pen_purchases?id=eq.${encodeURIComponent(purchase.id)}&payment_status=eq.pending`, 'PATCH', { payment_status: 'failed' });
      if (event.httpMethod === 'GET') return { statusCode: 302, headers: { Location: `${process.env.URL || '/'}#/library` }, body: '' };
      return json(400, { error: 'Paystack could not confirm this payment.' });
    }
    await supabaseRest(`global_pen_purchases?id=eq.${encodeURIComponent(purchase.id)}`, 'PATCH', { payment_status: 'paid', paid_at: new Date().toISOString() });
    if (event.httpMethod === 'GET') return { statusCode: 302, headers: { Location: `${process.env.URL || '/'}#/library` }, body: '' };
    return json(200, { success: true, message: 'Payment verified.' });
  } catch (e) { return json(e.statusCode || 500, { error: e.message || 'Unable to verify payment.' }); }
};
