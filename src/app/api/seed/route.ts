import { NextResponse } from 'next/server';
import { seedDataFixed } from '@/lib/seed';

/**
 * POST /api/seed
 * Seed the database with sample tournament data
 */
export async function POST() {
  try {
    const result = await seedDataFixed();
    return NextResponse.json({
      message: 'Seed data created successfully',
      ...result,
    });
  } catch (error) {
    console.error('Error seeding data:', error);
    return NextResponse.json(
      { error: 'Failed to seed data' },
      { status: 500 }
    );
  }
}
