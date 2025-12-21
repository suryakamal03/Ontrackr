import { NextRequest, NextResponse } from 'next/server';
import { adminDb } from '@/lib/firebase-admin';

// Test endpoint to check project configuration and activities
export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const projectId = searchParams.get('projectId');

    if (!projectId) {
      return NextResponse.json({ error: 'Missing projectId parameter' }, { status: 400 });
    }

    // Get project details
    const projectDoc = await adminDb.collection('projects').doc(projectId).get();
    
    if (!projectDoc.exists) {
      return NextResponse.json({ error: 'Project not found' }, { status: 404 });
    }

    const projectData = projectDoc.data();

    // Get activities for this project
    const activitiesSnapshot = await adminDb
      .collection('githubActivity')
      .where('projectId', '==', projectId)
      .orderBy('createdAt', 'desc')
      .limit(10)
      .get();

    const activities = activitiesSnapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data(),
      createdAt: doc.data().createdAt?.toDate?.()?.toISOString() || 'N/A'
    }));

    // Get recent webhook events
    const eventsSnapshot = await adminDb
      .collection('github_events')
      .where('projectId', '==', projectId)
      .orderBy('createdAt', 'desc')
      .limit(5)
      .get();

    const events = eventsSnapshot.docs.map(doc => ({
      id: doc.id,
      eventType: doc.data().eventType,
      action: doc.data().action,
      repository: doc.data().repository,
      createdAt: doc.data().createdAt?.toDate?.()?.toISOString() || 'N/A'
    }));

    return NextResponse.json({
      project: {
        id: projectId,
        name: projectData?.name,
        githubOwner: projectData?.githubOwner,
        githubRepo: projectData?.githubRepo,
        githubRepoUrl: projectData?.githubRepoUrl,
      },
      activitiesCount: activities.length,
      activities: activities,
      recentEventsCount: events.length,
      recentEvents: events,
      diagnostics: {
        hasGitHubConfig: !!(projectData?.githubOwner && projectData?.githubRepo),
        expectedRepository: projectData?.githubOwner && projectData?.githubRepo 
          ? `${projectData.githubOwner}/${projectData.githubRepo}` 
          : 'Not configured'
      }
    });

  } catch (error: any) {
    console.error('Debug endpoint error:', error);
    return NextResponse.json({ 
      error: 'Internal server error',
      message: error.message 
    }, { status: 500 });
  }
}
