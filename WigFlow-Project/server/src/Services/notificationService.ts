import nodemailer from 'nodemailer';

const transporter = nodemailer.createTransport({
  service: 'gmail',
  auth: {
    user: process.env.EMAIL_USER, // המייל שלך (למשל tzili.wigs@gmail.com)
    pass: process.env.EMAIL_PASS  // סיסמת אפליקציה של גוגל
  }
});


export const sendCustomerUpdate = async (customer: any, stage: string) => {
  const message = `היי ${customer.firstName}, הפאה שלך התקדמה לשלב: ${stage}  נמשיך לעדכן, צוות WigFlow.`;

  console.log(`--- מפעיל שליחת הודעות חינמיות ל${customer.firstName} ---`);

  if (customer.email) {
    const mailOptions = {
      from: `"צילי לנדמן - WigFlow" <${process.env.EMAIL_USER}>`,
      to: customer.email,
      subject: `עדכון על הפאה שלך - ${stage}`,
      html: `
        <div dir="rtl" style="font-family: sans-serif; text-align: right; padding: 20px; border: 2px solid #6f42c1; border-radius: 15px;">
          <h2 style="color: #6f42c1;">שלום ${customer.firstName}!</h2>
          <p style="font-size: 1.1rem;">הפאה שלך עברה כרגע לשלב: <strong>${stage}</strong>.</p>
          <p>אנחנו עובדים עליה במרץ ומבטיחים לעדכן בשלב הבא.</p>
          <hr style="border: 0; border-top: 1px solid #eee;" />
          <small>נשלח אוטומטית על ידי מערכת WigFlow של צילי לנדמן</small>
        </div>
      `
    };

    try {
      await transporter.sendMail(mailOptions);
      console.log(` מייל נשלח בהצלחה ל: ${customer.email}`);
    } catch (err) {
      console.error("❌ שגיאה בשליחת מייל:", err);
    }
  }

  if (customer.phoneNumber) {
    console.log(`📱 וואטסאפ ללקוחה: wa.me/${customer.phoneNumber.replace(/-/g, '')}?text=${encodeURIComponent(message)}`);
    // בשלב הבא אפשר להטמיע את whatsapp-web.js לשליחה אוטומטית לגמרי בלי כפתור
  }

  return true;
};