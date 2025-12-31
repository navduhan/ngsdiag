import { NextRequest, NextResponse } from 'next/server';
import { getMountStatus, mountRemote, unmountRemote } from '@/lib/mount';

// GET - Get mount status
export async function GET() {
  try {
    const status = await getMountStatus();
    return NextResponse.json({ success: true, ...status });
  } catch (error) {
    console.error('Failed to get mount status:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to get mount status' },
      { status: 500 }
    );
  }
}

// POST - Mount or unmount
export async function POST(request: NextRequest) {
  try {
    const { action } = await request.json();
    
    if (action === 'mount') {
      const result = await mountRemote();
      return NextResponse.json({ success: result.success, message: result.message });
    } else if (action === 'unmount') {
      const result = await unmountRemote();
      return NextResponse.json({ success: result.success, message: result.message });
    } else {
      return NextResponse.json(
        { success: false, error: 'Invalid action. Use "mount" or "unmount".' },
        { status: 400 }
      );
    }
  } catch (error) {
    console.error('Mount operation failed:', error);
    return NextResponse.json(
      { success: false, error: 'Mount operation failed' },
      { status: 500 }
    );
  }
}
