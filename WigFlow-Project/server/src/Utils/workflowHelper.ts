import { User } from '../Models_Service/User/userModel.js';

const STAGE_WORKFLOW: Record<string, { next: string; specialty: string | null }> = {
  'הזמנה התקבלה': { next: 'אישור התאמה ורישום', specialty: 'אישור התאמה' },
  'אישור התאמה ורישום': { next: 'התאמת שיער', specialty: 'התאמת שיער' },
  'התאמת שיער': { next: 'תפירת פאה', specialty: 'תפירה' },

  'תפירת פאה': { next: 'צבע', specialty: 'צבע' }, 
  'צבע': { next: 'עבודת יד', specialty: 'עבודת יד' },
  'עבודת יד': { next: 'חפיפה', specialty: 'חפיפה' },
  'חפיפה': { next: 'בקרה', specialty: 'בקרת איכות' },
  'בקרה': { next: 'הושלם', specialty: null }
};

export const moveToNextStage = async (currentStage: string) => {
  const workflow = STAGE_WORKFLOW[currentStage];
  
  if (!workflow || !workflow.next || workflow.next === 'הושלם') {
    return { 
      stage: workflow?.next || currentStage, 
      worker: null 
    };
  }

  const nextWorker = await User.findOne({ 
    role: 'Worker', 
    specialty: workflow.specialty 
  });

  return {
    stage: workflow.next,
    worker: nextWorker?._id || null
  };
};