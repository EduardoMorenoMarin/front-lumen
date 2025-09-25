import { AbstractControl, ValidationErrors, ValidatorFn } from '@angular/forms';

export function dniValidator(): ValidatorFn {
  const dniRegex = /^\d{8}$/;
  return (control: AbstractControl): ValidationErrors | null => {
    const value = control.value as string | null | undefined;
    if (value == null || value === '') {
      return null;
    }

    return dniRegex.test(value.trim()) ? null : { dni: true };
  };
}
