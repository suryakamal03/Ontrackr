import { NextRequest, NextResponse } from 'next/server';
import { githubService } from '@/backend/integrations/githubService';
import { adminDb } from '@/lib/firebase-admin';

export async function POST(req: NextRequest) {
  const startTime = Date.now();
  
  try {
    const signature = req.headers.get('x-hub-signature-256');
    const event = req.headers.get('x-github-event');
    const deliveryId = req.headers.get('x-github-delivery');
    
    console.log(`[Webhook] Received GitHub event: ${event} (delivery: ${deliveryId})`);
    
    if (!event) {
      console.error('[Webhook] Missing event type header');
      return NextResponse.json({ error: 'Missing event type' }, { status: 400 });
    }

    const payload = await req.json();

    if (!payload.repository) {
      console.error('[Webhook] Invalid payload: missing repository');
      return NextResponse.json({ error: 'Invalid payload' }, { status: 400 });
    }

    const { owner, name: repo } = payload.repository;
    const fullRepoName = `${owner.login}/${repo}`;

    console.log(`[Webhook] Event ${event} for repository: ${fullRepoName}`);

    // Handle ping event
    if (event === 'ping') {
      console.log(`[Webhook] Ping received for ${fullRepoName}`);
      return NextResponse.json({ 
        success: true, 
        message: 'Webhook received successfully',
        repository: fullRepoName
      });
    }

    // Find project by repository
    const projectsRef = adminDb.collection('projects');
    const querySnapshot = await projectsRef
      .where('githubOwner', '==', owner.login)
      .where('githubRepo', '==', repo)
      .get();

    if (querySnapshot.empty) {
      console.warn(`[Webhook] No project found for repository: ${fullRepoName}`);
      return NextResponse.json({ 
        error: 'Project not found for this repository',
        repository: fullRepoName
      }, { status: 404 });
    }

    const projectId = querySnapshot.docs[0].id;
    const projectName = querySnapshot.docs[0].data().name;
    
    console.log(`[Webhook] Matched to project: ${projectName} (${projectId})`);

    // Process event based on type
    switch (event) {
      case 'push':
        await githubService.processPushEvent(payload, projectId);
        console.log(`[Webhook] Successfully processed push event for ${projectName}`);
        break;
        
      case 'pull_request':
        await githubService.processPullRequestEvent(payload, projectId);
        console.log(`[Webhook] Successfully processed pull_request event for ${projectName}`);
        break;
        
      case 'issues':
        await githubService.processIssueEvent(payload, projectId);
        console.log(`[Webhook] Successfully processed issues event for ${projectName}`);
        break;
        
      default:
        console.log(`[Webhook] Unhandled event type: ${event} for ${projectName}`);
    }

    const processingTime = Date.now() - startTime;
    console.log(`[Webhook] Event processed in ${processingTime}ms`);

    return NextResponse.json({ 
      success: true, 
      event,
      projectId,
      projectName,
      repository: fullRepoName,
      processingTime: `${processingTime}ms`
    });

  } catch (error: any) {
    const processingTime = Date.now() - startTime;
    console.error('[Webhook] Processing error:', error);
    console.error('[Webhook] Error details:', {
      message: error.message,
      stack: error.stack,
      processingTime: `${processingTime}ms`
    });
    
    return NextResponse.json({ 
      error: 'Webhook processing failed',
      message: error.message 
    }, { status: 500 });
  }
}

export async function GET() {
  return NextResponse.json({
    status: 'active',
    endpoint: '/api/webhooks/github',
    supportedEvents: ['push', 'pull_request', 'issues'],
    instructions: {
      setup: [
        '1. Go to your GitHub repository settings',
        '2. Navigate to Webhooks section',
        '3. Click "Add webhook"',
        '4. Set Payload URL to: https://your-domain.com/api/webhooks/github',
        '5. Set Content type to: application/json',
        '6. Select events: Push, Pull requests, Issues',
        '7. Click "Add webhook"'
      ],
      localDevelopment: [
        '1. Install ngrok: npm install -g ngrok',
        '2. Run your dev server: npm run dev',
        '3. In a new terminal, run: ngrok http 3000',
        '4. Copy the HTTPS URL from ngrok (e.g., https://abc123.ngrok.io)',
        '5. Use this URL in GitHub webhook: https://abc123.ngrok.io/api/webhooks/github'
      ]
    }
  });
}
