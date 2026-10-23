import nodemailer from 'nodemailer';
function mailSettings(){const {SMTP_HOST,SMTP_PORT,SMTP_USER,SMTP_PASS,SMTP_FROM}=process.env;return {SMTP_HOST,SMTP_PORT,SMTP_USER,SMTP_PASS,SMTP_FROM};}
export function mailConfigured(){const c=mailSettings();return Boolean(c.SMTP_HOST&&c.SMTP_PORT&&c.SMTP_USER&&c.SMTP_PASS&&c.SMTP_FROM);}
export async function deliverInvitation({email,name,url}){
 if(!mailConfigured()){const err=new Error('Email is not configured. Set SMTP_HOST, SMTP_PORT, SMTP_USER, SMTP_PASS and SMTP_FROM.');err.status=503;throw err;}
 const port=Number(process.env.SMTP_PORT);if(!Number.isInteger(port)||port<1||port>65535){const err=new Error('Invalid SMTP_PORT.');err.status=503;throw err;}
 const transport=nodemailer.createTransport({host:process.env.SMTP_HOST,port,secure:port===465,auth:{user:process.env.SMTP_USER,pass:process.env.SMTP_PASS},connectionTimeout:12000,greetingTimeout:12000,socketTimeout:15000});
 const result=await transport.sendMail({from:process.env.SMTP_FROM,to:email,subject:'Your Bitstek Learning account — Set your password',text:`Hello ${name},\n\nYour Bitstek Learning account is ready.\n\nUse this one-time link to set your password (expires in 24 hours):\n${url}\n\nIf this was unexpected, please contact our team.\n\nBitstek Learning`});
 return {messageId:result.messageId};
}
