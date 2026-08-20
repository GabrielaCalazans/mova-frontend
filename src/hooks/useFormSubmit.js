import { useCallback, useState } from "react";

export function useFormSubmit({
  values,
  validate,
  setFormErrors,
  setFeedback,
  getInvalidFeedback,
  getValidFeedback,
  getSubmitErrorFeedback,
  onSubmit,
  onSuccess,
}) {
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleSubmit = useCallback(
    async (event) => {
      event.preventDefault();

      const nextErrors = validate(values);
      setFormErrors(nextErrors);

      if (Object.keys(nextErrors).length > 0) {
        if (getInvalidFeedback) {
          setFeedback(getInvalidFeedback(values, nextErrors));
        }
        return;
      }

      try {
        setIsSubmitting(true);

        const submitResult = onSubmit ? await onSubmit(values) : undefined;

        if (getValidFeedback) {
          setFeedback(getValidFeedback(values, submitResult));
        }

        if (onSuccess) {
          onSuccess(submitResult, values);
        }
      } catch (error) {
        const fallbackFeedback = {
          type: "error",
          message: "Nao foi possivel concluir a operacao. Tente novamente.",
        };

        if (getSubmitErrorFeedback) {
          setFeedback(getSubmitErrorFeedback(error, values));
        } else {
          setFeedback(fallbackFeedback);
        }
      } finally {
        setIsSubmitting(false);
      }
    },
    [
      values,
      validate,
      setFormErrors,
      getInvalidFeedback,
      setFeedback,
      getValidFeedback,
      getSubmitErrorFeedback,
      onSubmit,
      onSuccess,
    ]
  );

  return { handleSubmit, isSubmitting };
}