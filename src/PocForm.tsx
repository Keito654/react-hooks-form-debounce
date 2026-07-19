import { useState } from 'react'
import { Controller, useForm, type SubmitHandler } from 'react-hook-form'
import { Box, Button, Stack, TextField } from '@mui/material'

type FormValues = {
  trigger: string
  question: string
  category: string
}

export default function PocForm() {
  const { control, handleSubmit } = useForm<FormValues>({
    defaultValues: { trigger: '', question: '', category: '' },
  })
  const [submitted, setSubmitted] = useState<FormValues | null>(null)

  const onSubmit: SubmitHandler<FormValues> = (data) => setSubmitted(data)

  return (
    <Box component="form" onSubmit={handleSubmit(onSubmit)} noValidate>
      <Stack spacing={2} sx={{ maxWidth: 480 }}>
        <Controller
          name="trigger"
          control={control}
          rules={{ required: '質問のきっかけは必須です' }}
          render={({ field: { ref, ...rest }, fieldState }) => (
            <TextField
              {...rest}
              inputRef={ref}
              label="質問のきっかけ"
              error={!!fieldState.error}
              helperText={fieldState.error?.message}
            />
          )}
        />
        <Controller
          name="question"
          control={control}
          rules={{ required: '質問内容は必須です' }}
          render={({ field: { ref, ...rest }, fieldState }) => (
            <TextField
              {...rest}
              inputRef={ref}
              label="質問内容"
              multiline
              minRows={3}
              error={!!fieldState.error}
              helperText={fieldState.error?.message}
            />
          )}
        />
        <Controller
          name="category"
          control={control}
          rules={{ required: '質問分野や種別は必須です' }}
          render={({ field: { ref, ...rest }, fieldState }) => (
            <TextField
              {...rest}
              inputRef={ref}
              label="質問分野や種別"
              error={!!fieldState.error}
              helperText={fieldState.error?.message}
            />
          )}
        />
        <Button type="submit" variant="contained">
          送信
        </Button>
        {submitted && <pre>{JSON.stringify(submitted, null, 2)}</pre>}
      </Stack>
    </Box>
  )
}
