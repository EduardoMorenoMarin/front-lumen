import { AbstractControl, ValidationErrors, ValidatorFn } from '@angular/forms';

export function dateMinTodayValidator(): ValidatorFn {
  return (control: AbstractControl): ValidationErrors | null => {
    const value = control.value as string | Date | null | undefined;
    if (!value) {
      return null;
    }

    const controlDate = typeof value === 'string' ? new Date(value) : value;
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    if (Number.isNaN(controlDate.getTime())) {
      return null;
    }

    return controlDate >= today ? null : { dateMinToday: true };
  };
}
