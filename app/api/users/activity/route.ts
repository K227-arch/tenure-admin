import { NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabase/client';

export async function GET() {
  try {
    // Get users with recent activity (last 30 minutes = online)
    const thirtyMinutesAgo = new Date(Date.now() - 30 * 60 * 1000).toISOString();
    const oneDayAgo = new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString();
    const oneWeekAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString();

    const { data: users, error } = await supabaseAdmin
      .from('users')
      .select('id, name, email, avatar, last_active, status, created_at')
      .order('last_active', { ascending: false, nullsLast: true });

    if (error) {
      throw error;
    }

    // Categorize users by activity
    const now = new Date();
    const categorizedUsers = {
      online: [],
      today: [],
      thisWeek: [],
      inactive: []
    };

    users?.forEach(user => {
      if (!user.last_active) {
        categorizedUsers.inactive.push(user);
        return;
      }

      const lastActive = new Date(user.last_active);
      const diffMinutes = (now.getTime() - lastActive.getTime()) / (1000 * 60);

      if (diffMinutes <= 30) {
        categorizedUsers.online.push(user);
      } else if (diffMinutes <= 1440) { // 24 hours
        categorizedUsers.today.push(user);
      } else if (diffMinutes <= 10080) { // 7 days
        categorizedUsers.thisWeek.push(user);
      } else {
        categorizedUsers.inactive.push(user);
      }
    });

    // Calculate retention metrics
    const totalUsers = users?.length || 0;
    const activeToday = categorizedUsers.online.length + categorizedUsers.today.length;
    const activeThisWeek = activeToday + categorizedUsers.thisWeek.length;

    const metrics = {
      totalUsers,
      onlineNow: categorizedUsers.online.length,
      activeToday,
      activeThisWeek,
      inactiveUsers: categorizedUsers.inactive.length,
      dailyRetention: totalUsers > 0 ? ((activeToday / totalUsers) * 100).toFixed(1) : 0,
      weeklyRetention: totalUsers > 0 ? ((activeThisWeek / totalUsers) * 100).toFixed(1) : 0
    };

    return NextResponse.json({
      metrics,
      users: categorizedUsers
    });
  } catch (error) {
    console.error('Error fetching user activity:', error);
    return NextResponse.json(
      { error: 'Failed to fetch user activity' },
      { status: 500 }
    );
  }
}

export async function POST(request: Request) {
  try {
    const { userId } = await request.json();
    
    // Update user's last_active timestamp
    const { error } = await supabaseAdmin
      .from('users')
      .update({ 
        last_active: new Date().toISOString(),
        updated_at: new Date().toISOString()
      })
      .eq('id', userId);

    if (error) {
      throw error;
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Error updating user activity:', error);
    return NextResponse.json(
      { error: 'Failed to update user activity' },
      { status: 500 }
    );
  }
}