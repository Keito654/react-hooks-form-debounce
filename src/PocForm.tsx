import { useState } from 'react'
import { Controller, useForm, type SubmitHandler } from 'react-hook-form'
import { Box, Button, Stack, TextField } from '@mui/material'

type FormValues = {
  name: string
  email: string
  comment: string
}

export default function PocForm() {
  const { control, handleSubmit } = useForm<FormValues>({
    defaultValues: { name: '', email: '', comment: '' },
  })
  const [submitted, setSubmitted] = useState<FormValues | null>(null)

  const onSubmit: SubmitHandler<FormValues> = (data) => setSubmitted(data)

  return (
    <Box component="form" onSubmit={handleSubmit(onSubmit)} noValidate>
      <Stack spacing={2} sx={{ maxWidth: 480 }}>
        <Controller
          name="name"
          control={control}
          rules={{ required: '名前は必須です' }}
          render={({ field, fieldState }) => (
            <TextField
              {...field}
              label="名前"
              error={!!fieldState.error}
              helperText={fieldState.error?.message}
            />
          )}
        />
        <Controller
          name="email"
          control={control}
          rules={{ required: 'メールアドレスは必須です' }}
          render={({ field, fieldState }) => (
            <TextField
              {...field}
              label="メールアドレス"
              error={!!fieldState.error}
              helperText={fieldState.error?.message}
            />
          )}
        />
        <Controller
          name="comment"
          control={control}
          rules={{ required: 'コメントは必須です' }}
          render={({ field, fieldState }) => (
            <TextField
              {...field}
              label="コメント"
              multiline
              minRows={3}
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
