import React from 'react'

interface EmailTemplateProps {
  taskTitle: string
  projectName: string
  deadline: string
  memberName: string
}

export const TaskReminderEmailTemplate = ({
  taskTitle,
  projectName,
  deadline,
  memberName
}: EmailTemplateProps) => {
  return (
    <html>
      <head>
        <style>
          {`
            body {
              font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif;
              line-height: 1.6;
              color: #333;
              background-color: #f4f4f5;
              margin: 0;
              padding: 0;
            }
            .container {
              max-width: 600px;
              margin: 40px auto;
              background-color: #ffffff;
              border-radius: 8px;
              overflow: hidden;
              box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
            }
            .header {
              background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
              padding: 30px 20px;
              text-align: center;
            }
            .header h1 {
              color: #ffffff;
              margin: 0;
              font-size: 24px;
              font-weight: 600;
            }
            .content {
              padding: 40px 30px;
            }
            .greeting {
              font-size: 16px;
              color: #374151;
              margin-bottom: 20px;
            }
            .message {
              font-size: 15px;
              color: #6b7280;
              margin-bottom: 30px;
            }
            .task-details {
              background-color: #f9fafb;
              border-left: 4px solid #667eea;
              padding: 20px;
              margin: 20px 0;
              border-radius: 4px;
            }
            .task-details h3 {
              margin: 0 0 15px 0;
              color: #111827;
              font-size: 18px;
            }
            .detail-row {
              display: flex;
              margin: 10px 0;
              font-size: 14px;
            }
            .detail-label {
              font-weight: 600;
              color: #374151;
              min-width: 100px;
            }
            .detail-value {
              color: #6b7280;
            }
            .deadline-highlight {
              background-color: #fef3c7;
              color: #92400e;
              padding: 2px 8px;
              border-radius: 4px;
              font-weight: 600;
            }
            .cta-button {
              display: inline-block;
              background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
              color: #ffffff;
              padding: 12px 30px;
              text-decoration: none;
              border-radius: 6px;
              font-weight: 600;
              margin: 20px 0;
              transition: transform 0.2s;
            }
            .footer {
              background-color: #f9fafb;
              padding: 20px;
              text-align: center;
              font-size: 13px;
              color: #9ca3af;
              border-top: 1px solid #e5e7eb;
            }
            .footer p {
              margin: 5px 0;
            }
          `}
        </style>
      </head>
      <body>
        <div className="container">
          <div className="header">
            <h1>Ontrackr Task Reminder</h1>
          </div>
          <div className="content">
            <p className="greeting">Hi {memberName},</p>
            <p className="message">
              This is a friendly reminder that one of your tasks is due tomorrow. Please ensure it is completed on time to keep the project on track.
            </p>
            <div className="task-details">
              <h3>Task Details</h3>
              <div className="detail-row">
                <span className="detail-label">Task:</span>
                <span className="detail-value">{taskTitle}</span>
              </div>
              <div className="detail-row">
                <span className="detail-label">Project:</span>
                <span className="detail-value">{projectName}</span>
              </div>
              <div className="detail-row">
                <span className="detail-label">Deadline:</span>
                <span className="deadline-highlight">{deadline}</span>
              </div>
            </div>
            <p className="message">
              Please log in to Ontrackr to view the task details and update its status if you have already completed it.
            </p>
            <div style={{ textAlign: 'center' }}>
              <a href="https://ontrackr.app" className="cta-button">
                View Task
              </a>
            </div>
          </div>
          <div className="footer">
            <p>This is an automated reminder from Ontrackr</p>
            <p>To manage your notification preferences, log in to your account</p>
          </div>
        </div>
      </body>
    </html>
  )
}

export const generateTaskReminderHTML = (props: EmailTemplateProps): string => {
  const { taskTitle, projectName, deadline, memberName } = props
  
  return `
<!DOCTYPE html>
<html>
  <head>
    <meta charset="utf-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <style>
      body {
        font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif;
        line-height: 1.6;
        color: #333;
        background-color: #f4f4f5;
        margin: 0;
        padding: 0;
      }
      .container {
        max-width: 600px;
        margin: 40px auto;
        background-color: #ffffff;
        border-radius: 8px;
        overflow: hidden;
        box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
      }
      .header {
        background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
        padding: 30px 20px;
        text-align: center;
      }
      .header h1 {
        color: #ffffff;
        margin: 0;
        font-size: 24px;
        font-weight: 600;
      }
      .content {
        padding: 40px 30px;
      }
      .greeting {
        font-size: 16px;
        color: #374151;
        margin-bottom: 20px;
      }
      .message {
        font-size: 15px;
        color: #6b7280;
        margin-bottom: 30px;
      }
      .task-details {
        background-color: #f9fafb;
        border-left: 4px solid #667eea;
        padding: 20px;
        margin: 20px 0;
        border-radius: 4px;
      }
      .task-details h3 {
        margin: 0 0 15px 0;
        color: #111827;
        font-size: 18px;
      }
      .detail-row {
        margin: 10px 0;
        font-size: 14px;
      }
      .detail-label {
        font-weight: 600;
        color: #374151;
        display: inline-block;
        min-width: 100px;
      }
      .detail-value {
        color: #6b7280;
      }
      .deadline-highlight {
        background-color: #fef3c7;
        color: #92400e;
        padding: 2px 8px;
        border-radius: 4px;
        font-weight: 600;
      }
      .cta-button {
        display: inline-block;
        background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
        color: #ffffff;
        padding: 12px 30px;
        text-decoration: none;
        border-radius: 6px;
        font-weight: 600;
        margin: 20px 0;
      }
      .footer {
        background-color: #f9fafb;
        padding: 20px;
        text-align: center;
        font-size: 13px;
        color: #9ca3af;
        border-top: 1px solid #e5e7eb;
      }
      .footer p {
        margin: 5px 0;
      }
    </style>
  </head>
  <body>
    <div class="container">
      <div class="header">
        <h1>Ontrackr Task Reminder</h1>
      </div>
      <div class="content">
        <p class="greeting">Hi ${memberName},</p>
        <p class="message">
          This is a friendly reminder that one of your tasks is due tomorrow. Please ensure it is completed on time to keep the project on track.
        </p>
        <div class="task-details">
          <h3>Task Details</h3>
          <div class="detail-row">
            <span class="detail-label">Task:</span>
            <span class="detail-value">${taskTitle}</span>
          </div>
          <div class="detail-row">
            <span class="detail-label">Project:</span>
            <span class="detail-value">${projectName}</span>
          </div>
          <div class="detail-row">
            <span class="detail-label">Deadline:</span>
            <span class="deadline-highlight">${deadline}</span>
          </div>
        </div>
        <p class="message">
          Please log in to Ontrackr to view the task details and update its status if you have already completed it.
        </p>
        <div style="text-align: center;">
          <a href="https://ontrackr.app" class="cta-button">
            View Task
          </a>
        </div>
      </div>
      <div class="footer">
        <p>This is an automated reminder from Ontrackr</p>
        <p>To manage your notification preferences, log in to your account</p>
      </div>
    </div>
  </body>
</html>
  `.trim()
}
