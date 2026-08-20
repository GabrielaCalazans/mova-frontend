import { useCallback, useState } from "react";

export function useFormState(initialValues) {
  const [initialSnapshot] = useState(initialValues);

  const [values, setValues] = useState(initialValues);
  const [errors, setErrors] = useState({});
  const [feedback, setFeedback] = useState(null);

  const setFieldValue = useCallback((field, value) => {
    setValues((prev) => ({ ...prev, [field]: value }));

    setErrors((prev) => {
      if (!prev[field]) return prev;
      return { ...prev, [field]: undefined };
    });
  }, []);

  const setFormErrors = useCallback((nextErrors) => {
    setErrors(nextErrors);
  }, []);

  const resetForm = useCallback(() => {
    setValues(initialSnapshot);
    setErrors({});
    setFeedback(null);
  }, [initialSnapshot]);

  return {
    values,
    setValues,
    errors,
    setErrors,
    setFormErrors,
    feedback,
    setFeedback,
    setFieldValue,
    resetForm,
  };
}