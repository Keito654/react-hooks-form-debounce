import { useState } from 'react'
import { Controller, useForm, type SubmitHandler } from 'react-hook-form'
import { Box, Button, Skeleton, Stack, TextField, Typography } from '@mui/material'
import { useFaqSuggestionTrigger } from './useFaqSuggestionTrigger'
import { useFaqSuggestions } from './useFaqSuggestions'

export type FormValues = {
  trigger: string
  question: string
  category: string
}

export default function PocForm() {
  const { control, handleSubmit, subscribe } = useForm<FormValues>({
    defaultValues: { trigger: '', question: '', category: '' },
  })
  const [submitted, setSubmitted] = useState<FormValues | null>(null)
  const [faqParams, setFaqParams] = useState<FormValues | null>(null)

  // デモAPI呼び出し
  const { data, isLoading, isError, error } = useFaqSuggestions(faqParams)

  // デバウンスして発火する
  const { cancel } = useFaqSuggestionTrigger(subscribe, (values) => {
    // stateが変わることで、useFaqSuggestionsの引数が変化しAPIが再Fetchされる
    setFaqParams(values);
  })

  const onSubmit: SubmitHandler<FormValues> = (data) => {
    cancel(); // submitされた場合、APIをコールする必要がなくなるためcancel
    setSubmitted(data);
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
        {faqParams && (
          <Box>
            <Typography variant="subtitle2">関連する FAQ 候補</Typography>
            {isLoading ? (
              <Stack spacing={0.5}>
                <Skeleton variant="text" />
                <Skeleton variant="text" />
                <Skeleton variant="text" />
              </Stack>
            ) : isError ? (
              <Typography variant="body2" color="error">
                FAQ の取得に失敗しました: {error.message}
              </Typography>
            ) : data?.length === 0 ? (
              <Typography variant="body2">該当する FAQ はありません</Typography>
            ) : (
              <Box component="ul" sx={{ pl: 2, m: 0 }}>
                {data?.map((faq) => (
                  <li key={faq.id}>{faq.title}</li>
                ))}
              </Box>
            )}
          </Box>
        )}
        {submitted && <pre>{JSON.stringify(submitted, null, 2)}</pre>}
      </Stack>
    </Box>
  )
}
