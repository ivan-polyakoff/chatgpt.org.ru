const nodemailer = require('nodemailer');

async function testEmail() {
  console.log('Testing email configuration...');
  
  const transporterOptions = {
    host: 'mail.chatgpt.org.ru',
    port: 587,
    secure: false,
    requireTls: true,
    auth: {
      user: 'noreply',
      pass: 'qwerty123'
    },
    tls: {
      rejectUnauthorized: false,
      servername: 'mail.chatgpt.org.ru'
    }
  };
  
  console.log('Creating transporter with:', transporterOptions);
  
  try {
    const transporter = nodemailer.createTransport(transporterOptions);
    
    console.log('Verifying transporter...');
    await transporter.verify();
    console.log('✅ Transporter verified successfully\!');
    
    const mailOptions = {
      from: '"Support" <noreply@chatgpt.org.ru>',
      to: 'shuttle.dee@gmail.com',
      subject: 'Test Email from ChatGPT.org.ru',
      text: 'This is a test email to verify SMTP configuration',
      html: '<b>This is a test email to verify SMTP configuration</b>'
    };
    
    console.log('Sending test email to shuttle.dee@gmail.com...');
    const info = await transporter.sendMail(mailOptions);
    console.log('✅ Email sent successfully\!');
    console.log('Message ID:', info.messageId);
    console.log('Response:', info.response);
  } catch (error) {
    console.error('❌ Error:', error.message);
    console.error('Full error:', error);
  }
}

testEmail();
