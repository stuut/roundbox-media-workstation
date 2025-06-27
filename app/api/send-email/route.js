import nodemailer from 'nodemailer';
import { NextResponse } from 'next/server';
import { supabaseAdmin } from '@/utils/supabase/superbaseAdmin.js'


export async function POST(request) {
  const { userId, subject, text } = await request.json();


  const { data, error } = await supabaseAdmin.auth.admin.getUserById(userId)
    if (error) {
      return new Response(JSON.stringify({ error: error.message }), { status: 500 })
    }

    const to = data.email

  const transporter = nodemailer.createTransport({
    service: 'gmail',
    auth: {
      user: process.env.GMAIL_USER,
      pass: process.env.GMAIL_APP_PASSWORD,
    },
  });

  try {
    const info = await transporter.sendMail({
      from: process.env.GMAIL_USER,
      to,
      subject,
      text,
    });

    return new Response(JSON.stringify({ message: 'Email sent', info }), {
      status: 200,
    });
  } catch (error) {
    console.error(error);
    return new Response(JSON.stringify({ error: 'Email failed to send' }), {
      status: 500,
    });
  }
}
