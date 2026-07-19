import { useState } from 'react'
import { Controller, useForm, type SubmitHandler } from 'react-hook-form'
import { Box, Button, Stack, TextField, Typography } from '@mui/material'
import { useFaqSuggestionTrigger } from './useFaqSuggestionTrigger'

export type FormValues = {
  trigger: string
  question: string
  category: string
}

type FireLogEntry = {
  id: number
  firedAt: string
  values: FormValues
}

// 履歴の無制限な増加によるメモリ・描画コストの単調増加を防ぐ
const MAX_FIRE_LOG_ENTRIES = 20

export default function PocForm() {
  const { control, handleSubmit, subscribe } = useForm<FormValues>({
    defaultValues: { trigger: '', question: '', category: '' },
  })
  const [submitted, setSubmitted] = useState<FormValues | null>(null)
  const [fireLog, setFireLog] = useState<FireLogEntry[]>([])

  // 将来はここが FAQ 提案 AI の API コールに置き換わる
  const { cancel } = useFaqSuggestionTrigger(subscribe, (values) => {
    setFireLog((prev) => [
      {
        id: (prev[0]?.id ?? 0) + 1,
        firedAt: new Date().toLocaleTimeString('ja-JP'),
        values,
      },
      ...prev.slice(0, MAX_FIRE_LOG_ENTRIES - 1),
    ])
  })

  const onSubmit: SubmitHandler<FormValues> = (data) => {
    cancel()
    setSubmitted(data)
  }

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
        {fireLog.length > 0 && (
          <Box>
            <Typography variant="subtitle2">
              デバウンス発火履歴(新しい順)
            </Typography>
            <Box component="ul" sx={{ pl: 2, m: 0 }}>
              {fireLog.map((entry) => (
                <li key={entry.id}>
                  {entry.firedAt} — {JSON.stringify(entry.values)}
                </li>
              ))}
            </Box>
          </Box>
        )}
      </Stack>
    </Box>
  )
}
