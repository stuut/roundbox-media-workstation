import nodemailer from 'nodemailer';
import { NextResponse } from 'next/server';


export async function GET(request) {

  const to = 'daniel@stuut.com.au'
  const subject = 'cron test'
  const text = 'cron test'

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

    return  new Response({status: 200});
  } catch (error) {
    console.error(error);
    return new Response({status: 500});
  }
}
