import { NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabase/admin';

export async function GET() {
  try {
    // First, try to fetch from the view
    const { data: members, error } = await supabaseAdmin
      .from('active_member_queue_view')
      .select('*')
      .order('queue_position', { ascending: true });

    if (error) {
      console.error('Error from Supabase (active_member_queue_view):', error);
      
      // If view doesn't exist or has issues, fall back to the table with join
      console.log('Falling back to membership_queue table...');
      const { data: fallbackMembers, error: fallbackError } = await supabaseAdmin
        .from('membership_queue')
        .select(`
          *,
          users!inner(
            id,
            name,
            email,
            image,
            status,
            email_verified,
            created_at,
            updated_at
          )
        `)
        .eq('status', 'active')
        .order('queue_position', { ascending: true });

      if (fallbackError) {
        console.error('Fallback error:', fallbackError);
        throw fallbackError;
      }

      // Enrich with phone and address data
      const enrichedMembers = await Promise.all(
        (fallbackMembers || []).map(async (member) => {
          const userId = member.user_id;
          
          // Fetch phone number from user_contacts
          const { data: contacts } = await supabaseAdmin
            .from('user_contacts')
            .select('contact_value, contact_type, is_primary')
            .eq('user_id', userId)
            .eq('contact_type', 'phone')
            .order('is_primary', { ascending: false })
            .limit(1);
          
          // Fetch address from user_addresses
          const { data: addresses } = await supabaseAdmin
            .from('user_addresses')
            .select('*')
            .eq('user_id', userId)
            .order('is_primary', { ascending: false })
            .limit(1);
          
          return {
            ...member,
            phone: contacts?.[0]?.contact_value || null,
            address: addresses?.[0] ? 
              `${addresses[0].street_address}${addresses[0].address_line_2 ? ', ' + addresses[0].address_line_2 : ''}` : null,
            city: addresses?.[0]?.city || null,
            state: addresses?.[0]?.state || null,
            postal_code: addresses?.[0]?.postal_code || null,
            country_code: addresses?.[0]?.country_code || null,
          };
        })
      );

      console.log('Fetched members from membership_queue (fallback):', enrichedMembers?.length || 0);
      return NextResponse.json({
        members: enrichedMembers || [],
        source: 'membership_queue'
      });
    }

    // Enrich view data with phone and address
    const enrichedMembers = await Promise.all(
      (members || []).map(async (member) => {
        const userId = member.user_id;
        
        // Fetch phone number from user_contacts
        const { data: contacts } = await supabaseAdmin
          .from('user_contacts')
          .select('contact_value, contact_type, is_primary')
          .eq('user_id', userId)
          .eq('contact_type', 'phone')
          .order('is_primary', { ascending: false })
          .limit(1);
        
        // Fetch address from user_addresses
        const { data: addresses } = await supabaseAdmin
          .from('user_addresses')
          .select('*')
          .eq('user_id', userId)
          .order('is_primary', { ascending: false })
          .limit(1);
        
        return {
          ...member,
          phone: contacts?.[0]?.contact_value || null,
          address: addresses?.[0] ? 
            `${addresses[0].street_address}${addresses[0].address_line_2 ? ', ' + addresses[0].address_line_2 : ''}` : null,
          city: addresses?.[0]?.city || null,
          state: addresses?.[0]?.state || null,
          postal_code: addresses?.[0]?.postal_code || null,
          country_code: addresses?.[0]?.country_code || null,
        };
      })
    );

    console.log('Fetched members from active_member_queue_view:', enrichedMembers?.length || 0);
    if (enrichedMembers && enrichedMembers.length > 0) {
      console.log('Sample member data:', JSON.stringify(enrichedMembers[0], null, 2));
    }

    return NextResponse.json({
      members: enrichedMembers || [],
      source: 'active_member_queue_view'
    });
  } catch (error: any) {
    console.error('Error fetching membership queue:', error);
    return NextResponse.json(
      { 
        error: 'Failed to fetch membership queue',
        details: error?.message || 'Unknown error'
      },
      { status: 500 }
    );
  }
}