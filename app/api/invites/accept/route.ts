import { NextRequest, NextResponse } from 'next/server';
import { inviteServiceAdmin } from '@/backend/projects/inviteServiceAdmin';

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    console.log('Received invite acceptance request:', body);
    
    const { inviteId, userId } = body;

    if (!inviteId || !userId) {
      console.error('Missing required fields:', { inviteId, userId });
      return NextResponse.json(
        { error: 'Missing required fields' },
        { status: 400 }
      );
    }

    console.log('Accepting invite:', inviteId, 'for user:', userId);
    const result = await inviteServiceAdmin.acceptInvite(inviteId, userId);
    console.log('Invite acceptance result:', result);

    if (!result.success) {
      console.error('Invite acceptance failed:', result.message);
      return NextResponse.json(
        { error: result.message },
        { status: 400 }
      );
    }

    return NextResponse.json({
      success: true,
      message: result.message,
      projectId: result.projectId
    });

  } catch (error: any) {
    console.error('Error accepting invite:', error);
    console.error('Error stack:', error.stack);
    return NextResponse.json(
      { error: 'Failed to accept invite', message: error.message },
      { status: 500 }
    );
  }
}
