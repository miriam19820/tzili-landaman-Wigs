import { Service } from './serviceModel.js';
import { NewWig } from '../NewWigs/newWigModel.js'; 
import { Repair } from '../Repairs/repairModel.js';
import * as customerService from '../Customer/customerService.js'; 

export const createService = async (serviceData: any) => {
  if (typeof serviceData.customer === 'string' && serviceData.customer.length < 24) {
    const foundCustomer = await customerService.findCustomerByName(serviceData.customer);
    if (!foundCustomer) {
      throw new Error(`הלקוחה "${serviceData.customer}" לא נמצאה במערכת. יש להוסיף אותה קודם.`);
    }
    serviceData.customer = foundCustomer._id;
  }

 
  if (serviceData.serviceType === 'Style Only') {
    serviceData.status = 'Pending Style'; 
  } else {
    serviceData.status = 'Pending Wash';
  }

  return await Service.create(serviceData);
};


export const approveService = async (serviceId: string, inspectorId: string, photoUrl: string) => {
  const service = await Service.findByIdAndUpdate(
    serviceId,
    { 
      status: 'Ready',
      afterImageUrl: photoUrl, 
      inspectedBy: inspectorId,
      inspectedAt: new Date(),
      qaRejectionPhoto: null
    },
    { new: true }
  );

  if (!service) throw new Error('Service not found');

  if (service.origin === 'NewWig' && service.newWigReference) {
    await NewWig.findByIdAndUpdate(service.newWigReference, { 
      currentStage: 'מוכנה למסירה',
      finalPhotoUrl: photoUrl, 
      inspectorName: inspectorId,
      inspectionDate: new Date(),
      assignedWorkers: []
    });
  } else if (service.origin === 'Repair' && service.repairReference) {
    await Repair.findByIdAndUpdate(service.repairReference, {
      overallStatus: 'מוכן',
      afterImageUrl: photoUrl, 
      inspectedBy: inspectorId,
      inspectedAt: new Date()
    });
  }

  return service;
};

export const rejectService = async (
  serviceId: string, 
  qaNote: string, 
  photoUrl: string,
  returnStages?: string[]
) => {
  const service = await Service.findById(serviceId);
  if (!service) throw new Error('Service not found');

  if (!service.notes) {
    service.notes = { secretary: '', worker: '', qa: '' };
  }
  
  service.notes.qa = qaNote;
  service.qaRejectionPhoto = photoUrl;
  service.status = 'Rejected';

  if (service.origin === 'NewWig' && service.newWigReference) {
    const firstStage = (returnStages && returnStages.length > 0) ? returnStages[0] : 'תפירת פאה';
    
    const wig = await NewWig.findById(service.newWigReference);
    let originalWorkers: any[] = [];
    
    if (wig && wig.stageAssignments) {
      originalWorkers = typeof wig.stageAssignments.get === 'function' 
        ? wig.stageAssignments.get(firstStage) 
        : (wig.stageAssignments as any)[firstStage];
    }

    await NewWig.findByIdAndUpdate(service.newWigReference, {
       currentStage: firstStage,
       assignedWorkers: originalWorkers || [],
       qaNote: qaNote,
       qaRejectionPhoto: photoUrl, 
       pendingRepairStages: returnStages 
    });
  } else if (service.origin === 'Repair' && service.repairReference) {
   
      await Repair.findByIdAndUpdate(service.repairReference, {
          overallStatus: 'בתיקון',
          qaNote: qaNote,
          qaRejectionPhoto: photoUrl
      });
      service.status = 'Pending Wash'; 
  } else {
    service.status = 'Pending Wash'; 
  }

  await service.save();
  return service;
};

