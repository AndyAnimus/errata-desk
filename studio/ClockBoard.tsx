import {useEffect, useState} from 'react'
import {useClient} from 'sanity'
import {Badge, Box, Card, Flex, Grid, Stack, Text} from '@sanity/ui'

const CLOCKS = [
  {platform: 'tabletop', label: 'Tabletop', day: 'Jun 1', iso: '2020-06-01'},
  {platform: 'mtgo', label: 'Magic Online', day: 'Jun 3', iso: '2020-06-03'},
  {platform: 'arena', label: 'MTG Arena', day: 'Jun 4', iso: '2020-06-04'},
]

type Claim = {
  platform: string
  status: string
  value: string
  effectiveFrom?: string
  effectiveUntil?: string
}

function inForce(c: Claim, date: string) {
  if (c.effectiveFrom && date < c.effectiveFrom) return false
  if (c.effectiveUntil && date >= c.effectiveUntil) return false
  return true
}

export function ClockBoard() {
  const client = useClient({apiVersion: '2021-10-21'})
  const [date, setDate] = useState('2020-06-02')
  const [claims, setClaims] = useState<Claim[]>([])

  useEffect(() => {
    client
      .fetch(
        `*[_type=="rulesClaim" && predicate=="bringIntoGame"]{platform,status,value,effectiveFrom,effectiveUntil}`,
      )
      .then((data: Claim[]) => setClaims(data || []))
      .catch(() => {})
  }, [client])

  return (
    <Box padding={4} style={{background: '#f4efe6', minHeight: '100%'}}>
      <Stack space={4}>
        <Flex align="center" justify="space-between" gap={3} wrap="wrap">
          <Stack space={2}>
            <Text size={1} weight="semibold" style={{letterSpacing: '0.16em'}}>
              ERRATA DESK
            </Text>
            <Text size={4} weight="bold">
              Three clocks, one sentence
            </Text>
            <Text size={1} muted>
            Move the day. Table, Magic Online, and Arena do not flip together.
          </Text>
          </Stack>
          <label>
            <Text size={1} muted>
              Day on the needle
            </Text>
            <input
              type="date"
              value={date}
              min="2020-04-24"
              max="2020-06-10"
              onChange={(e) => setDate(e.currentTarget.value)}
              style={{display: 'block', marginTop: 6, padding: '6px 8px'}}
            />
          </label>
        </Flex>

        <Grid columns={[1, 1, 3]} gap={3}>
          {CLOCKS.map((clock) => {
            const rows = claims.filter((c) => c.platform === clock.platform)
            const live = rows.find((c) => inForce(c, date))
            const switched = date >= clock.iso
            return (
              <Card key={clock.platform} padding={3} radius={3} shadow={1} tone={switched ? 'positive' : 'caution'}>
                <Stack space={3}>
                  <Flex justify="space-between" align="center">
                    <Text size={1} weight="semibold">
                      {clock.label}
                    </Text>
                    <Badge tone={switched ? 'positive' : 'caution'}>{switched ? 'new rule' : 'old rule'}</Badge>
                  </Flex>
                  <Text size={4} weight="bold">
                    {clock.day}
                  </Text>
                  <Text size={1}>{clock.iso}</Text>
                  <Text size={2} weight="semibold">
                    {live?.value || 'No claim covers this day.'}
                  </Text>
                </Stack>
              </Card>
            )
          })}
        </Grid>

        <Text size={1} muted>
          Amber is the old reminder. Green is pay 3. The switch is not the same day on each row.
        </Text>
      </Stack>
    </Box>
  )
}
