import { NextRequest, NextResponse } from 'next/server';
import { inviteServiceAdmin } from '@/backend/projects/inviteServiceAdmin';

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    console.log('Received invite creation request:', body);
    
    const { projectId, userId } = body;

    if (!projectId || !userId) {
      console.error('Missing required fields:', { projectId, userId });
      return NextResponse.json(
        { error: 'Missing required fields' },
        { status: 400 }
      );
    }

    console.log('Creating invite for project:', projectId, 'by user:', userId);
    const result = await inviteServiceAdmin.createInvite(projectId, userId);
    console.log('Invite created successfully:', result);

    return NextResponse.json({
      success: true,
      inviteId: result.inviteId,
      inviteLink: result.inviteLink
    });

  } catch (error: any) {
    console.error('Error creating invite:', error);
    console.error('Error stack:', error.stack);
    return NextResponse.json(
      { error: 'Failed to create invite', message: error.message },
      { status: 500 }
    );
  }
}
