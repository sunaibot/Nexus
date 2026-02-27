import { useState, useCallback, FormEvent } from 'react'
import { z } from 'zod'

interface UseFormOptions<T> {
  schema: z.ZodSchema<T>
  initialValues: Partial<T>
  onSubmit: (values: T) => Promise<void> | void
  onSuccess?: () => void
  onError?: (error: Error) => void
}

interface UseFormReturn<T> {
  values: Partial<T>
  errors: Partial<Record<keyof T, string>>
  touched: Partial<Record<keyof T, boolean>>
  isSubmitting: boolean
  isValid: boolean
  setValue: <K extends keyof T>(key: K, value: T[K]) => void
  setValues: (values: Partial<T>) => void
  handleChange: (key: keyof T) => (value: unknown) => void
  handleBlur: (key: keyof T) => () => void
  handleSubmit: (e: FormEvent) => Promise<void>
  reset: () => void
  validate: () => boolean
  clearErrors: () => void
}

export function useForm<T extends Record<string, unknown>>(
  options: UseFormOptions<T>
): UseFormReturn<T> {
  const { schema, initialValues, onSubmit, onSuccess, onError } = options

  const [values, setValues] = useState<Partial<T>>(initialValues)
  const [errors, setErrors] = useState<Partial<Record<keyof T, string>>>({})
  const [touched, setTouched] = useState<Partial<Record<keyof T, boolean>>>({})
  const [isSubmitting, setIsSubmitting] = useState(false)

  const validate = useCallback((): boolean => {
    const result = schema.safeParse(values)
    if (!result.success) {
      const fieldErrors: Partial<Record<keyof T, string>> = {}
      result.error.issues.forEach((issue) => {
        const path = issue.path[0] as keyof T
        fieldErrors[path] = issue.message
      })
      setErrors(fieldErrors)
      return false
    }
    setErrors({})
    return true
  }, [values, schema])

  const setValue = useCallback(<K extends keyof T>(key: K, value: T[K]) => {
    setValues((prev) => ({ ...prev, [key]: value }))
    // 清除该字段的错误
    setErrors((prev) => ({ ...prev, [key]: undefined }))
  }, [])

  const handleChange = useCallback(
    (key: keyof T) => (value: unknown) => {
      setValue(key, value as T[typeof key])
    },
    [setValue]
  )

  const handleBlur = useCallback(
    (key: keyof T) => () => {
      setTouched((prev) => ({ ...prev, [key]: true }))
      // 单独验证该字段 - 使用完整 schema 验证
      const fieldValue = values[key]
      const testObj = { [key]: fieldValue } as Partial<T>
      const result = schema.safeParse(testObj)
      if (!result.success) {
        const fieldError = result.error.issues.find(issue => issue.path[0] === key)
        if (fieldError) {
          setErrors((prev) => ({ ...prev, [key]: fieldError.message }))
        }
      } else {
        setErrors((prev) => ({ ...prev, [key]: undefined }))
      }
    },
    [schema, values]
  )

  const handleSubmit = useCallback(
    async (e: FormEvent) => {
      e.preventDefault()

      // 标记所有字段为已触碰
      const allTouched = Object.keys(values).reduce(
        (acc, key) => ({ ...acc, [key]: true }),
        {}
      )
      setTouched(allTouched as Partial<Record<keyof T, boolean>>)

      if (!validate()) return

      setIsSubmitting(true)
      try {
        await onSubmit(values as T)
        onSuccess?.()
      } catch (error) {
        const message = error instanceof Error ? error.message : '提交失败'
        setErrors((prev) => ({ ...prev, _form: message } as Partial<Record<keyof T, string>>))
        onError?.(error as Error)
      } finally {
        setIsSubmitting(false)
      }
    },
    [validate, onSubmit, onSuccess, onError, values]
  )

  const reset = useCallback(() => {
    setValues(initialValues)
    setErrors({})
    setTouched({})
    setIsSubmitting(false)
  }, [initialValues])

  const clearErrors = useCallback(() => {
    setErrors({})
  }, [])

  const isValid = Object.keys(errors).length === 0

  return {
    values,
    errors,
    touched,
    isSubmitting,
    isValid,
    setValue,
    setValues,
    handleChange,
    handleBlur,
    handleSubmit,
    reset,
    validate,
    clearErrors,
  }
}
