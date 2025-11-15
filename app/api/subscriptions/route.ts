import { NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabase/admin';

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const page = parseInt(searchParams.get('page') || '1');
    const limit = parseInt(searchParams.get('limit') || '10');
    const status = searchParams.get('status');
    const search = searchParams.get('search');

    const offset = (page - 1) * limit;

    // Build query using user_billing_schedules table
    let query = supabaseAdmin
      .from('user_billing_schedules')
      .select(`
        *,
        users!inner(
          id,
          name,
          email,
          image
        )
      `, { count: 'exact' })
      .order('created_at', { ascending: false });

    // Apply filters
    if (status && status !== 'all') {
      if (status === 'active') {
        query = query.eq('is_active', true);
      } else if (status === 'canceled') {
        query = query.eq('is_active', false);
      }
    }

    // Note: Search filtering will be done after fetching due to joined table limitations
    // Supabase doesn't support .or() with nested relations in the same query

    // Get all data first (we'll filter after due to join limitations)
    const { data: billingSchedules, error } = await query;

    if (error) {
      throw error;
    }

    // Transform billing schedules to match subscription format
    let subscriptions = (billingSchedules || []).map(schedule => ({
      id: schedule.id,
      user_id: schedule.user_id,
      provider_subscription_id: schedule.subscription_id,
      stripe_subscription_id: schedule.subscription_id,
      provider: 'billing_schedule',
      status: schedule.is_active ? 'active' : 'canceled',
      current_period_start: schedule.created_at,
      current_period_end: schedule.next_billing_date,
      created_at: schedule.created_at,
      users: schedule.users,
      billing_cycle: schedule.billing_cycle,
      amount: schedule.amount,
      currency: schedule.currency
    }));

    // Apply search filter after transformation
    if (search) {
      const searchLower = search.toLowerCase();
      subscriptions = subscriptions.filter(sub => 
        sub.users?.name?.toLowerCase().includes(searchLower) ||
        sub.users?.email?.toLowerCase().includes(searchLower) ||
        sub.provider_subscription_id?.toLowerCase().includes(searchLower)
      );
    }

    // Calculate total before pagination
    const total = subscriptions.length;

    // Apply pagination
    const paginatedSubscriptions = subscriptions.slice(offset, offset + limit);

    return NextResponse.json({
      subscriptions: paginatedSubscriptions,
      pagination: {
        page,
        pages: Math.ceil(total / limit),
        total: total,
        limit
      }
    });
  } catch (error) {
    console.error('Error fetching subscriptions:', error);
    return NextResponse.json(
      { error: 'Failed to fetch subscriptions' },
      { status: 500 }
    );
  }
}

export async function POST(request: Request) {
  try {
    const body = await request.json();
    
    const { data: subscription, error } = await supabaseAdmin
      .from('user_subscriptions')
      .insert([{
        user_id: body.user_id,
        provider: body.provider || 'stripe',
        provider_subscription_id: body.stripe_subscription_id,
        provider_customer_id: body.provider_customer_id || '',
        status: body.status || 'active',
        current_period_start: body.current_period_start,
        current_period_end: body.current_period_end,
        cancel_at_period_end: false
      }])
      .select()
      .single();

    if (error) {
      throw error;
    }

    return NextResponse.json(subscription);
  } catch (error) {
    console.error('Error creating subscription:', error);
    return NextResponse.json(
      { error: 'Failed to create subscription' },
      { status: 500 }
    );
  }
}