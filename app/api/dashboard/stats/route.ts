import { NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabase/client';
import { getStripeAnalytics } from '@/lib/stripe/client';
import { getTwilioAnalytics } from '@/lib/twilio/client';
import { getEmailAnalytics } from '@/lib/email/analytics';
import { microserviceClient } from '@/lib/microservices/client';
import { subDays, subMonths } from 'date-fns';

export async function GET() {
  try {
    const thirtyDaysAgo = subDays(new Date(), 30);
    const sixMonthsAgo = subMonths(new Date(), 6);

    // Fetch data from multiple sources in parallel
    const [
      supabaseData,
      stripeData,
      twilioData,
      emailData,
      microserviceHealth
    ] = await Promise.allSettled([
      fetchSupabaseStats(thirtyDaysAgo, sixMonthsAgo),
      getStripeAnalytics(),
      getTwilioAnalytics(),
      getEmailAnalytics(),
      microserviceClient.getAllServicesHealth()
    ]);

    // Extract successful results or throw error if Supabase fails
    if (supabaseData.status === 'rejected') {
      throw new Error('Failed to fetch Supabase data: ' + supabaseData.reason);
    }
    const supabase = supabaseData.value;
    const stripe = stripeData.status === 'fulfilled' ? stripeData.value : null;
    const twilio = twilioData.status === 'fulfilled' ? twilioData.value : null;
    const email = emailData.status === 'fulfilled' ? emailData.value : null;
    const services = microserviceHealth.status === 'fulfilled' ? microserviceHealth.value : [];

    // Combine revenue from Supabase transactions and Stripe
    const totalRevenue = (supabase.totalRevenue || 0) + (stripe?.totalRevenue || 0);

    return NextResponse.json({
      stats: {
        totalRevenue: `$${totalRevenue.toLocaleString()}`,
        activeMembers: supabase.activeMembers,
        defaultedMembers: supabase.defaultedMembers,
        totalTransactions: supabase.totalTransactions,
        revenueChange: supabase.revenueChange,
        memberChange: supabase.memberChange,
        defaultedChange: supabase.defaultedChange,
        transactionChange: supabase.transactionChange,
      },
      charts: {
        revenueData: combineRevenueData(supabase.revenueData, stripe?.monthlyRevenue),
        memberData: supabase.memberData,
      },
      recentActivity: supabase.recentActivity,
      integrations: {
        stripe: {
          connected: stripe !== null,
          mrr: stripe?.mrr || 0,
          subscriptions: stripe?.subscriptionStats || { active: 0, canceled: 0, pastDue: 0, trialing: 0 },
          churnRate: stripe?.churnRate || 0
        },
        twilio: {
          connected: twilio !== null,
          totalMessages: twilio?.totalMessages || 0,
          deliveryRate: twilio ? ((twilio.messageStats.delivered / twilio.totalMessages) * 100) : 0,
          totalCost: twilio?.costAnalysis.totalCost || 0
        },
        email: {
          connected: email !== null,
          totalEmails: email?.totalEmails || 0,
          deliveryRate: email ? ((email.emailStats.delivered / email.totalEmails) * 100) : 0
        },
        microservices: services.map(service => ({
          name: service.service,
          status: service.status,
          responseTime: service.responseTime
        }))
      }
    });
  } catch (error) {
    console.error('Error fetching dashboard stats:', error);
    return NextResponse.json({
      error: 'Failed to fetch dashboard stats',
      stats: {
        totalRevenue: '$0',
        activeMembers: 0,
        defaultedMembers: 0,
        totalTransactions: 0,
        revenueChange: 'Error loading data',
        memberChange: 'Error loading data',
        defaultedChange: 'Error loading data',
        transactionChange: 'Error loading data',
      },
      charts: {
        revenueData: [],
        memberData: [],
      },
      recentActivity: [],
      integrations: {
        stripe: { connected: false, mrr: 0, subscriptions: { active: 0, canceled: 0, pastDue: 0, trialing: 0 }, churnRate: 0 },
        twilio: { connected: false, totalMessages: 0, deliveryRate: 0, totalCost: 0 },
        email: { connected: false, totalEmails: 0, deliveryRate: 0 },
        microservices: []
      }
    }, { status: 500 });
  }
}

async function fetchSupabaseStats(thirtyDaysAgo: Date, sixMonthsAgo: Date) {
  // Get user stats
  const { data: totalUsers, count: totalUsersCount } = await supabaseAdmin
    .from('users')
    .select('id', { count: 'exact' });

  const { data: activeUsers, count: activeUsersCount } = await supabaseAdmin
    .from('users')
    .select('id', { count: 'exact' })
    .eq('status', 'active');

  const { data: suspendedUsers, count: suspendedUsersCount } = await supabaseAdmin
    .from('users')
    .select('id', { count: 'exact' })
    .eq('status', 'suspended');

  // Get users from last month for comparison
  const lastMonth = new Date();
  lastMonth.setMonth(lastMonth.getMonth() - 1);
  
  const { data: lastMonthUsers, count: lastMonthUsersCount } = await supabaseAdmin
    .from('users')
    .select('id', { count: 'exact' })
    .lte('created_at', lastMonth.toISOString());

  // Get transaction stats
  const { data: transactions } = await supabaseAdmin
    .from('transactions')
    .select('amount, created_at, status')
    .gte('created_at', sixMonthsAgo.toISOString());

  const { data: allTransactions, count: totalTransactionsCount } = await supabaseAdmin
    .from('transactions')
    .select('id', { count: 'exact' });

  const totalRevenue = transactions
    ?.filter(t => t.status === 'completed')
    .reduce((sum, t) => sum + (t.amount || 0), 0) || 0;

  // Calculate last month revenue for comparison
  const lastMonthRevenue = transactions
    ?.filter(t => t.status === 'completed' && new Date(t.created_at) <= lastMonth)
    .reduce((sum, t) => sum + (t.amount || 0), 0) || 0;

  // Generate monthly revenue data
  const revenueData = [];
  for (let i = 5; i >= 0; i--) {
    const monthStart = new Date();
    monthStart.setMonth(monthStart.getMonth() - i, 1);
    monthStart.setHours(0, 0, 0, 0);
    
    const monthEnd = new Date(monthStart);
    monthEnd.setMonth(monthEnd.getMonth() + 1, 0);
    monthEnd.setHours(23, 59, 59, 999);

    const monthTransactions = transactions?.filter(t => {
      const tDate = new Date(t.created_at);
      return tDate >= monthStart && tDate <= monthEnd && t.status === 'completed';
    }) || [];

    revenueData.push({
      month: monthStart.toLocaleDateString('en-US', { month: 'short' }),
      revenue: monthTransactions.reduce((sum, t) => sum + (t.amount || 0), 0)
    });
  }

  // Generate member growth data
  const { data: recentUsers } = await supabaseAdmin
    .from('users')
    .select('created_at, status')
    .gte('created_at', sixMonthsAgo.toISOString());

  const memberData = [];
  for (let i = 5; i >= 0; i--) {
    const monthStart = new Date();
    monthStart.setMonth(monthStart.getMonth() - i, 1);
    
    const monthEnd = new Date(monthStart);
    monthEnd.setMonth(monthEnd.getMonth() + 1, 0);
    
    const monthUsers = recentUsers?.filter(u => {
      const uDate = new Date(u.created_at);
      return uDate >= monthStart && uDate <= monthEnd;
    }) || [];

    const activeInMonth = monthUsers.filter(u => u.status === 'active').length;
    const defaultedInMonth = monthUsers.filter(u => u.status === 'suspended').length;

    memberData.push({
      month: monthStart.toLocaleDateString('en-US', { month: 'short' }),
      active: activeInMonth,
      defaulted: defaultedInMonth
    });
  }

  // Get recent activity from multiple sources
  const { data: recentNewUsers } = await supabaseAdmin
    .from('users')
    .select('name, email, created_at')
    .gte('created_at', thirtyDaysAgo.toISOString())
    .order('created_at', { ascending: false })
    .limit(5);

  const { data: recentTransactions } = await supabaseAdmin
    .from('transactions')
    .select(`
      amount,
      currency,
      status,
      created_at,
      users(name, email)
    `)
    .gte('created_at', thirtyDaysAgo.toISOString())
    .order('created_at', { ascending: false })
    .limit(5);

  // Combine recent activities
  const recentActivity = [];
  
  // Add user registrations
  recentNewUsers?.forEach(user => {
    recentActivity.push({
      action: 'New member registration',
      user: user.name || user.email,
      time: new Date(user.created_at).toLocaleString()
    });
  });

  // Add recent transactions
  recentTransactions?.forEach(transaction => {
    recentActivity.push({
      action: transaction.status === 'completed' ? 'Payment received' : 'Transaction processed',
      user: transaction.users?.name || transaction.users?.email || 'Unknown',
      time: new Date(transaction.created_at).toLocaleString()
    });
  });

  // Sort by time and limit
  recentActivity.sort((a, b) => new Date(b.time).getTime() - new Date(a.time).getTime());
  const limitedActivity = recentActivity.slice(0, 10);

  // Calculate percentage changes
  const memberGrowth = lastMonthUsersCount ? 
    parseFloat((((totalUsersCount || 0) - lastMonthUsersCount) / lastMonthUsersCount * 100).toFixed(1)) : 0;
  
  const revenueGrowth = lastMonthRevenue ? 
    parseFloat(((totalRevenue - lastMonthRevenue) / lastMonthRevenue * 100).toFixed(1)) : 0;

  return {
    totalRevenue,
    activeMembers: activeUsersCount || 0,
    defaultedMembers: suspendedUsersCount || 0,
    totalTransactions: totalTransactionsCount || 0,
    revenueChange: `${revenueGrowth > 0 ? '+' : ''}${revenueGrowth}% vs last month`,
    memberChange: `${memberGrowth > 0 ? '+' : ''}${memberGrowth}% vs last month`,
    defaultedChange: `${suspendedUsersCount || 0} total suspended`,
    transactionChange: `${totalTransactionsCount || 0} total transactions`,
    revenueData,
    memberData,
    recentActivity: limitedActivity
  };
}

function combineRevenueData(supabaseData: any[], stripeData?: any[]) {
  if (!stripeData) return supabaseData;
  
  return supabaseData.map(item => {
    const stripeItem = stripeData.find(s => s.month === item.month);
    return {
      ...item,
      revenue: item.revenue + (stripeItem?.revenue || 0)
    };
  });
}

