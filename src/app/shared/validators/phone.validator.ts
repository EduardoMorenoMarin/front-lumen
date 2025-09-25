import { AbstractControl, ValidationErrors, ValidatorFn } from '@angular/forms';

export function phoneValidator(): ValidatorFn {
  const phoneRegex = /^\+?\d{7,15}$/;
  return (control: AbstractControl): ValidationErrors | null => {
    const value = control.value as string | null | undefined;
    if (value == null || value === '') {
      return null;
    }

    return phoneRegex.test(value.replace(/\s|-/g, '')) ? null : { phone: true };
  };
}
