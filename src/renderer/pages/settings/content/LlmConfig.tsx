import { Box, Grid, TextField } from '@mui/material';
import { useState, type FC } from 'react';
import { useTranslation } from 'react-i18next';
import { PageHeader } from '../../../shared/components/layout/pageHeader/PageHeader';
import { useAppSelector } from '../../../state/configureStore';
import { selectSettings } from '../../../state/pageSlice';

interface Props {
  showBack: boolean;
  onBack?: () => void;
  onLlmConfig?: (data: { llmApiUrl?: string; llmApiKey?: string; llmModel?: string }) => void;
}

export const LlmConfig: FC<Props> = ({ showBack, onLlmConfig = () => {}, onBack = () => {} }) => {
  const { t } = useTranslation();
  const storeSettings = useAppSelector(selectSettings);
  const [llmApiUrl, setLlmApiUrl] = useState<string>(storeSettings?.llmApiUrl ?? '');
  const [llmApiKey, setLlmApiKey] = useState<string>(storeSettings?.llmApiKey ?? '');
  const [llmModel, setLlmModel] = useState<string>(storeSettings?.llmModel ?? '');

  const emit = (next: { llmApiUrl: string; llmApiKey: string; llmModel: string }) => {
    onLlmConfig({
      llmApiUrl: next.llmApiUrl.trim() === '' ? undefined : next.llmApiUrl.trim(),
      llmApiKey: next.llmApiKey.trim() === '' ? undefined : next.llmApiKey.trim(),
      llmModel: next.llmModel.trim() === '' ? undefined : next.llmModel.trim()
    });
  };

  return (
    <Box sx={{ display: 'flex', flexDirection: 'column', gap: 3 }}>
      <PageHeader title={t('settingsMenuItems.titles.llmConfig')} showBack={showBack} onBack={onBack} />

      <Grid container spacing={2}>
        <Grid size={{ xs: 12 }}>
          <TextField
            fullWidth
            label={t('llmConfig.apiUrl')}
            helperText={t('llmConfig.apiUrlHelper')}
            value={llmApiUrl}
            onChange={e => {
              setLlmApiUrl(e.target.value);
              emit({ llmApiUrl: e.target.value, llmApiKey, llmModel });
            }}
          />
        </Grid>
        <Grid size={{ xs: 12 }}>
          <TextField
            fullWidth
            type="password"
            label={t('llmConfig.apiKey')}
            helperText={t('llmConfig.apiKeyHelper')}
            value={llmApiKey}
            onChange={e => {
              setLlmApiKey(e.target.value);
              emit({ llmApiUrl, llmApiKey: e.target.value, llmModel });
            }}
          />
        </Grid>
        <Grid size={{ xs: 12 }}>
          <TextField
            fullWidth
            label={t('llmConfig.model')}
            helperText={t('llmConfig.modelHelper')}
            value={llmModel}
            onChange={e => {
              setLlmModel(e.target.value);
              emit({ llmApiUrl, llmApiKey, llmModel: e.target.value });
            }}
          />
        </Grid>
      </Grid>
    </Box>
  );
};
