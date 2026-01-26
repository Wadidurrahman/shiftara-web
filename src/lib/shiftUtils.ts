interface Shift {
  employee_id: string;
  date: string;
  start_time: string;
  end_time: string;
}

export const checkShiftConflict = (
  employeeId: string, 
  date: string, 
  newStartTime: string, 
  newEndTime: string,
  existingShifts: Shift[]
) => {
  const employeeShifts = existingShifts.filter(
    s => s.employee_id === employeeId && s.date === date
  );

  for (const shift of employeeShifts) {
    if (isOverlap(newStartTime, newEndTime, shift.start_time, shift.end_time)) {
        return { conflict: true, conflictingShift: shift };
    }
  }
  return { conflict: false };
};

function isOverlap(startA: string, endA: string, startB: string, endB: string) {
    const toMin = (t: string) => parseInt(t.split(':')[0]) * 60 + parseInt(t.split(':')[1]);
    return toMin(startA) < toMin(endB) && toMin(endA) > toMin(startB);
}

export const generateWALink = (phone: string, message: string) => {
    let formattedPhone = phone.replace(/\D/g, '');
    if (formattedPhone.startsWith('0')) {
        formattedPhone = '62' + formattedPhone.slice(1);
    }
    return `https://wa.me/${formattedPhone}?text=${encodeURIComponent(message)}`;
};