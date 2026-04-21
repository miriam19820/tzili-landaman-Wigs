import nodemailer from 'nodemailer';
import pkg from 'whatsapp-web.js';
const { Client, LocalAuth } = pkg;
import qrcode from 'qrcode-terminal';

export const transporter = nodemailer.createTransport({
  service: 'gmail',
  auth: {
    user: process.env.EMAIL_USER, 
    pass: process.env.EMAIL_PASS  
  }
});

const whatsappClient = new Client({
    authStrategy: new LocalAuth(), 
    authTimeoutMs: 120000, 
    puppeteer: {
        args: ['--no-sandbox', '--disable-setuid-sandbox']
    }
});


whatsappClient.on('qr', (qr) => {
    console.log('\n--- 📱 סריקת וואטסאפ נדרשת ---');
    console.log('יש לסרוק את הברקוד הבא בעזרת הוואטסאפ של העסק:');
    qrcode.generate(qr, { small: true });
});

whatsappClient.on('ready', () => {
    console.log('✅ וואטסאפ מחובר ומוכן לשליחת הודעות אוטומטיות!');
});

whatsappClient.on('auth_failure', (msg) => {
    console.error('❌ שגיאה באימות וואטסאפ:', msg);
});

whatsappClient.initialize().catch(err => {
    console.error('⚠️ שגיאה בהפעלת וואטסאפ:', err);
});


export const sendSalonUpdate = async (wig: any, stage: string) => {

  const customerName = wig.customer ? `${wig.customer.firstName} ${wig.customer.lastName}` : 'לקוחה לא ידועה';
  const orderCode = wig.orderCode || 'ללא קוד';
  

  let workerNames = 'לא שובצה עובדת מוגדרת';
  if (wig.assignedWorkers && wig.assignedWorkers.length > 0) {
      workerNames = wig.assignedWorkers.map((w: any) => w.fullName || w.username || 'עובדת').join(', ');
  }
  

  const message = `🔔 *עדכון מערכת WigFlow*\nהפאה של ${customerName} (קוד: ${orderCode})\nברגע זה ממש הועברה לשלב: *${stage}*\nוהתקבלה לטיפולה של: *${workerNames}*.`;

  console.log(`--- מפעיל שליחת עדכון וואטסאפ למנהלת הסלון ---`);

  // מספר הטלפון של הסלון/המנהלת. מומלץ להכניס את המספר לקובץ .env בתור MANAGER_PHONE
  // במידה ואין בקובץ .env, אפשר לשים את המספר הקבוע כאן
  const managerPhone = process.env.MANAGER_PHONE || '0500000000'; // <--- החליפי למספר של הסלון כאן!

  try {
    
      let formattedPhone = managerPhone.replace(/-/g, '').replace(/^0/, '972');
      const chatId = `${formattedPhone}@c.us`;

      if (whatsappClient.info) {
          await whatsappClient.sendMessage(chatId, message);
          console.log(`✅ הודעת וואטסאפ נשלחה אוטומטית למנהלת (${managerPhone}) - שובצה ל${workerNames}`);
      } else {
          console.log(`⚠️ וואטסאפ לא מחובר! יש לסרוק את הברקוד בטרמינל כדי לשלוח למנהלת.`);
      }
  } catch (err) {
      console.error("❌ שגיאה בשליחת וואטסאפ למנהלת:", err);
  }

  return true;
};