import { NextResponse } from 'next/server';
import { db, schema } from '@/app/lib/db';
import { eq, and, isNotNull, gte, lt, sql } from 'drizzle-orm';

const { news, newsTypes } = schema;

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const userId = searchParams.get('userId');

  if (!userId) {
    return NextResponse.json({ error: 'userId required' }, { status: 400 });
  }

  try {
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    // Fetch all news with alerts
    const alertsData = await db
      .select({
        news_id: news.news_id,
        ticker: news.ticker,
        company_name: news.company_name,
        news_description: news.news_description,
        news_date: news.news_date,
        alert_date: news.alert_date,
        alert_notes: news.alert_notes,
        news_type: {
          type_code: newsTypes.type_code,
          type_name: newsTypes.type_name,
        },
      })
      .from(news)
      .leftJoin(newsTypes, eq(news.news_type_id, newsTypes.news_type_id))
      .where(
        and(
          eq(news.user_id, userId),
          isNotNull(news.alert_date)
        )
      )
      .orderBy(news.alert_date);

    // Group alerts by time ranges
    const todayStr = today.toISOString().split('T')[0];
    const threeDaysFromNow = new Date(today);
    threeDaysFromNow.setDate(threeDaysFromNow.getDate() + 3);
    const threeDaysStr = threeDaysFromNow.toISOString().split('T')[0];

    const sevenDaysFromNow = new Date(today);
    sevenDaysFromNow.setDate(sevenDaysFromNow.getDate() + 7);
    const sevenDaysStr = sevenDaysFromNow.toISOString().split('T')[0];

    const thirtyDaysFromNow = new Date(today);
    thirtyDaysFromNow.setDate(thirtyDaysFromNow.getDate() + 30);
    const thirtyDaysStr = thirtyDaysFromNow.toISOString().split('T')[0];

    const grouped = {
      urgent: [] as any[],      // 0-3 days (today to today+3)
      thisWeek: [] as any[],    // 4-7 days
      comingSoon: [] as any[],  // 8-30 days
      past: [] as any[],        // before today
    };

    alertsData.forEach((alert) => {
      const alertDate = alert.alert_date;
      if (!alertDate) return;

      if (alertDate < todayStr) {
        grouped.past.push(alert);
      } else if (alertDate <= threeDaysStr) {
        grouped.urgent.push(alert);
      } else if (alertDate <= sevenDaysStr) {
        grouped.thisWeek.push(alert);
      } else if (alertDate <= thirtyDaysStr) {
        grouped.comingSoon.push(alert);
      } else {
        // Future beyond 30 days - put in coming soon
        grouped.comingSoon.push(alert);
      }
    });

    // Calculate total count for badge (urgent + thisWeek)
    const badgeCount = grouped.urgent.length + grouped.thisWeek.length;

    return NextResponse.json({
      data: grouped,
      badgeCount,
      totalAlerts: alertsData.length,
    });
  } catch (e: any) {
    console.error('Error fetching alerts:', e);
    return NextResponse.json({ error: e.message }, { status: 500 });
  }
}