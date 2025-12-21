import { NextRequest, NextResponse } from 'next/server'
import { Resend } from 'resend'
import { db } from '@/lib/firebase'
import { collection, query, where, getDocs, doc, updateDoc, getDoc } from 'firebase/firestore'
import { generateTaskReminderHTML } from '@/lib/emailTemplates'

const resend = new Resend(process.env.RESEND_API_KEY)

export async function POST(request: NextRequest) {
  try {
    const authHeader = request.headers.get('authorization')
    const expectedToken = process.env.CRON_SECRET

    if (!expectedToken || authHeader !== `Bearer ${expectedToken}`) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    if (!process.env.RESEND_API_KEY) {
      return NextResponse.json({ error: 'Resend API key not configured' }, { status: 500 })
    }

    const now = new Date()
    const tomorrow = new Date(now)
    tomorrow.setDate(tomorrow.getDate() + 1)
    
    const tomorrowStart = new Date(tomorrow.getFullYear(), tomorrow.getMonth(), tomorrow.getDate())
    const tomorrowEnd = new Date(tomorrow.getFullYear(), tomorrow.getMonth(), tomorrow.getDate(), 23, 59, 59)

    const tasksRef = collection(db, 'tasks')
    const q = query(
      tasksRef,
      where('reminderEnabled', '==', true),
      where('reminderSent', '==', false)
    )

    const querySnapshot = await getDocs(q)
    const remindersSent = []
    const errors = []

    for (const taskDoc of querySnapshot.docs) {
      const task = taskDoc.data()
      
      if (task.status === 'Done') {
        continue
      }

      if (!task.deadlineAt) {
        continue
      }

      let deadlineDate: Date
      if (task.deadlineAt.toDate) {
        deadlineDate = task.deadlineAt.toDate()
      } else if (task.deadlineAt instanceof Date) {
        deadlineDate = task.deadlineAt
      } else {
        deadlineDate = new Date(task.deadlineAt)
      }

      if (deadlineDate >= tomorrowStart && deadlineDate <= tomorrowEnd) {
        try {
          const userDoc = await getDoc(doc(db, 'users', task.assignedTo))
          if (!userDoc.exists()) {
            errors.push({ taskId: taskDoc.id, error: 'User not found' })
            continue
          }

          const userData = userDoc.data()
          const userEmail = userData.email

          const projectDoc = await getDoc(doc(db, 'projects', task.projectId))
          const projectName = projectDoc.exists() ? projectDoc.data().name : 'Unknown Project'

          const emailHTML = generateTaskReminderHTML({
            taskTitle: task.title,
            projectName,
            deadline: deadlineDate.toLocaleDateString('en-US', {
              year: 'numeric',
              month: 'long',
              day: 'numeric'
            }),
            memberName: task.assignedToName || userData.name || 'Team Member'
          })

          await resend.emails.send({
            from: 'Ontrackr <noreply@ontrackr.app>',
            to: userEmail,
            subject: `Task Reminder: ${task.title}`,
            html: emailHTML
          })

          await updateDoc(doc(db, 'tasks', taskDoc.id), {
            reminderSent: true
          })

          remindersSent.push({
            taskId: taskDoc.id,
            taskTitle: task.title,
            email: userEmail
          })
        } catch (error: any) {
          errors.push({
            taskId: taskDoc.id,
            error: error.message
          })
        }
      }
    }

    return NextResponse.json({
      success: true,
      remindersSent: remindersSent.length,
      errors: errors.length,
      details: {
        remindersSent,
        errors
      }
    })
  } catch (error: any) {
    console.error('Error sending reminders:', error)
    return NextResponse.json(
      { error: 'Failed to send reminders', details: error.message },
      { status: 500 }
    )
  }
}
