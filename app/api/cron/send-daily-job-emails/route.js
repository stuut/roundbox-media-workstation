import nodemailer from 'nodemailer';
import { supabaseAdmin } from '@/utils/supabase/superbaseAdmin.js';
import { generateTaskEmailHTML } from '@/lib/emailTemplates';

export async function GET(request) {

  const url = new URL(request.url);
  const secret = url.searchParams.get('secret');

  if (secret !== process.env.CRON_SECRET) {
    return new Response('Unauthorized', { status: 401 });
  }

  try {
    const { data: { users }, error: userError } = await supabaseAdmin.auth.admin.listUsers();
    if (userError) throw userError;

    const emailPromises = [];

    for (const user of users) {
      if (!user.email) continue;

      const { data, error } = await supabaseAdmin
        .from('task_members')
        .select(`
          tasks(
            *,
            created_by_user: users!tasks_created_by_fkey (
              id,
              full_name,
              avatar_url
            ),
            boards_assigned_to_task: board_tasks(
              *,
              boards(
                id,
                name
              )
            )
          )
        `)
        .eq('user_id', user.id);

      if (error || !data) continue;

      const pendingTasks = data
        .filter(task => task.tasks.status !== 'Completed')
        .sort((a, b) => new Date(a.tasks.due_date) - new Date(b.tasks.due_date));

      if (pendingTasks.length === 0) continue;

      const htmlBody = generateTaskEmailHTML(pendingTasks, process.env.WEBSITE);


      const transporter = nodemailer.createTransport({
        service: 'gmail',
        auth: {
          user: process.env.GMAIL_USER,
          pass: process.env.GMAIL_APP_PASSWORD,
        },
      });

      const mailOptions = {
        from: `"Roundbox Media Workstation" <${process.env.GMAIL_USER}>`,
        to: user.email,
        subject: 'Today\'s Jobs',
        html: htmlBody,
      };

      emailPromises.push(
        transporter.sendMail(mailOptions).catch(e => {
          console.error(`Failed to email ${user.email}:`, e);
        })
      );
    }

    await Promise.all(emailPromises);
    return new Response('Emails sent', { status: 200 });

  } catch (error) {
    console.error('Cron job failed:', error);
    return new Response('Internal Server Error', { status: 500 });
  }
}
