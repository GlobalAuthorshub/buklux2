const { json, getUser, supabaseRest } = require('./_shared');
exports.handler = async (event) => {
  if (event.httpMethod !== 'POST') return json(405, { error: 'Method not allowed' });
  try {
    const user = await getUser(event.headers.authorization || event.headers.Authorization);
    const { bookId } = JSON.parse(event.body || '{}');
    if (!bookId) return json(400, { error: 'A book ID is required.' });
    const book = await supabaseRest(`global_pen_books?id=eq.${encodeURIComponent(bookId)}&status=eq.approved&select=id,title,price_minor,currency`, 'GET');
    if (!book.length) return json(404, { error: 'This book is not available for purchase.' });
    const existing = await supabaseRest(`global_pen_purchases?reader_id=eq.${user.id}&book_id=eq.${encodeURIComponent(bookId)}&payment_status=eq.paid&select=id`, 'GET');
    if (existing.length) return json(409, { error: 'You already own this book.' });
    if (!Number.isInteger(book[0].price_minor) || book[0].price_minor < 100) return json(400, { error: 'This book price is not valid for Paystack checkout.' });
    const reference = `buklux_${user.id.slice(0,8)}_${Date.now()}_${Math.random().toString(36).slice(2,8)}`;
    const purchase = await supabaseRest('global_pen_purchases', 'POST', {
      reader_id: user.id, book_id: book[0].id, amount_minor: book[0].price_minor,
      currency: 'NGN', payment_provider: 'paystack', paystack_reference: reference, payment_status: 'pending'
    }, 'return=representation');
    const response = await fetch('https://api.paystack.co/transaction/initialize', {
      method: 'POST', headers: { Authorization: `Bearer ${process.env.PAYSTACK_SECRET_KEY}`, 'Content-Type': 'application/json' },
      body: JSON.stringify({ email: user.email, amount: book[0].price_minor, currency: 'NGN', reference, callback_url: `${process.env.URL || ''}/.netlify/functions/paystack-verify?reference=${encodeURIComponent(reference)}`, metadata: { book_id: book[0].id, purchase_id: purchase[0].id, user_id: user.id } })
    });
    const result = await response.json();
    if (!response.ok || !result.status || !result.data?.authorization_url) {
      await supabaseRest(`global_pen_purchases?id=eq.${encodeURIComponent(purchase[0].id)}`, 'PATCH', { payment_status: 'failed' });
      return json(502, { error: result.message || 'Paystack could not start checkout.' });
    }
    return json(200, { authorization_url: result.data.authorization_url, reference });
  } catch (e) { return json(e.statusCode || 500, { error: e.message || 'Unable to start checkout.' }); }
};
