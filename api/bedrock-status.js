export default async function bedrockStatusHandler(req, res) {
  try {
    const hasCredentials = !!(process.env.AWS_ACCESS_KEY_ID && process.env.AWS_SECRET_ACCESS_KEY)
    const accessKeyId = process.env.AWS_ACCESS_KEY_ID

    res.json({
      hasCredentials,
      accessKeyId: hasCredentials ? 'AKIA' + '*'.repeat(16) : null,
      region: process.env.AWS_REGION || 'eu-south-2',
      timestamp: new Date().toISOString(),
      inferenceProfiles: [
        {
          name: 'EU Anthropic Claude Haiku 4.5',
          id: 'eu.anthropic.claude-haiku-4-5-20251001-v1:0',
          regions: ['eu-north-1', 'eu-west-3', 'eu-south-1', 'eu-south-2', 'eu-west-1', 'eu-central-1'],
          models: ['Claude Haiku 4.5']
        },
        {
          name: 'EU Anthropic Claude Opus 4.7',
          id: 'eu.anthropic.claude-opus-4-7',
          regions: ['eu-central-1', 'eu-north-1', 'eu-south-1', 'eu-south-2', 'eu-west-1', 'eu-west-3'],
          models: ['Claude Opus 4.7']
        },
        {
          name: 'EU Anthropic Claude Sonnet 4.5',
          id: 'eu.anthropic.claude-sonnet-4-5-20250929-v1:0',
          regions: ['eu-north-1', 'eu-west-3', 'eu-south-1', 'eu-south-2', 'eu-west-1', 'eu-central-1'],
          models: ['Claude Sonnet 4.5']
        }
      ]
    })
  } catch (err) {
    console.error('Error in bedrock-status:', err)
    res.status(500).json({ error: err.message })
  }
}
