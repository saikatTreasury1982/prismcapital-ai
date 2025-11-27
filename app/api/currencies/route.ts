import { NextResponse } from 'next/server';
import { db, schema } from '@/app/lib/db';
import { eq } from 'drizzle-orm';

const { countries } = schema;

export async function GET() {
  try {
    const allCountries = await db.select().from(countries).all();
    
    // Get distinct currency codes
    const uniqueCurrencies = [...new Set(allCountries.map(c => c.currency_code))];
    
    return NextResponse.json({ 
      success: true, 
      data: uniqueCurrencies.sort() 
    });
  } catch (error: any) {
    console.error('Error fetching currencies:', error);
    return NextResponse.json(
      { error: error.message || 'Failed to fetch currencies' },
      { status: 500 }
    );
  }
}