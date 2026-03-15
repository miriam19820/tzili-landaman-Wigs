import nodemailer from 'nodemailer';

// הגדרת המנוע לשליחת מיילים - משתמש במשתני סביבה ב-env.
const transporter = nodemailer.createTransport({
  service: 'gmail',
  auth: {
    user: process.env.EMAIL_USER, // המייל של הסלון
    pass: process.env.EMAIL_PASS  // סיסמת אפליקציה של גוגל
  }
});

/**
 * שליחת עדכון ללקוחה על התקדמות הפאה (במייל ובוואטסאפ)
 */
export const sendCustomerUpdate = async (customer: any, stage: string) => {
  const message = `היי ${customer.firstName}, הפאה שלך התקדמה לשלב: ${stage}. נמשיך לעדכן, צוות WigFlow.`;

  console.log(`--- מפעיל שליחת עדכונים ללקוחה: ${customer.firstName} ---`);

  // 1. שליחת מייל מעוצב (אם קיים מייל)
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
      console.log(`✅ מייל נשלח בהצלחה ל: ${customer.email}`);
    } catch (err) {
      console.error("❌ שגיאה בשליחת מייל:", err);
    }
  }

  // 2. הכנת קישור לוואטסאפ (אם קיים מספר טלפון)
  if (customer.phoneNumber) {
    const cleanPhone = customer.phoneNumber.replace(/-/g, '');
    const whatsappLink = `wa.me/${cleanPhone}?text=${encodeURIComponent(message)}`;
    console.log(`📱 קישור וואטסאפ מוכן לשימוש: ${whatsappLink}`);
    // הערה: כאן אפשר להוסיף בעתיד שליחה אוטומטית עם whatsapp-web.js
  }

  return true;
};