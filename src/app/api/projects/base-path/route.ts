import { NextResponse } from 'next/server';

export async function GET() {
  const basePath = process.env.BASE_PROJECT_PATH || '';
  
  if (!basePath) {
    return NextResponse.json(
      { error: 'BASE_PROJECT_PATH not configured in .env.local' },
      { status: 500 }
    );
  }
  
  return NextResponse.json({ basePath });
}
