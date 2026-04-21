import { prisma } from '@/lib/prisma'
import { getJotformApiKey, fetchJotformSubmissionsPage } from '@/lib/jotform-client'
import { ingestJotformPayload } from '@/lib/jotform-ingest'
import { resolveJotformSyncFormIds } from '@/lib/jotform-resolve-form-ids'

/** Map one JotForm REST submission row into the shape `ingestJotformPayload` expects. */
export function submissionPayloadFromApiRow(sub: Record<string, unknown>): Record<string, unknown> {
  const answersObj = sub.answers as Record<string, unknown> | undefined
  const answersArray: unknown[] = []
  if (answersObj && typeof answersObj === 'object' && !Array.isArray(answersObj)) {
    for (const [fieldId, val] of Object.entries(answersObj)) {
      const v = val as Record<string, unknown>
      answersArray.push({
        id: fieldId,
        name: v?.name ?? v?.text ?? '',
        text: v?.text,
        answer: v?.answer ?? v?.prettyFormat ?? v?.text,
        value: v?.value,
        answerID: v?.answerID,
      })
    }
  }
  const r = sub as Record<string, unknown>
  return {
    submissionID: String(sub.id ?? ''),
    formID: String(sub.form_id ?? ''),
    answers: answersArray,
    formData: sub.formData,
    created_at: r.created_at,
    updated_at: r.updated_at,
    rawRequest: typeof r.rawRequest === 'string' ? r.rawRequest : undefined,
    requestURL: typeof r.requestURL === 'string' ? r.requestURL : undefined,
  }
}

export type JotformInboxSyncResult = {
  ok: boolean
  formsProcessed: number
  imported: number
  skipped: number
  errors: string[]
  message?: string
}

/**
 * Poll JotForm inbox via API, skip already-synced submission IDs, ingest the rest.
 * Complements webhooks (missed deliveries, new environment, historical backlog).
 */
export async function syncJotformInbox(options?: {
  maxSubmissionsPerForm?: number
  maxOffsetPerForm?: number
}): Promise<JotformInboxSyncResult> {
  const errors: string[] = []
  if (!getJotformApiKey()) {
    return {
      ok: false,
      formsProcessed: 0,
      imported: 0,
      skipped: 0,
      errors: ['JOTFORM_API_KEY is not set'],
      message: 'Missing API key',
    }
  }

  const formIds = await resolveJotformSyncFormIds()
  if (formIds.length === 0) {
    return {
      ok: true,
      formsProcessed: 0,
      imported: 0,
      skipped: 0,
      errors: [],
      message: 'No form IDs configured. Set JOTFORM_FORM_ID and/or JOTFORM_SYNC_FORM_IDS.',
    }
  }

  const perPage = 50
  const maxTotal = options?.maxSubmissionsPerForm ?? 100
  const maxOffset = options?.maxOffsetPerForm ?? 500

  let imported = 0
  let skipped = 0

  for (const formId of formIds) {
    let offset = 0
    let totalSeen = 0
    try {
      scan: while (totalSeen < maxTotal && offset < maxOffset) {
        const page = await fetchJotformSubmissionsPage(formId, {
          limit: perPage,
          offset,
          orderby: 'created_at',
        })
        if (!page.length) break

        const chronological = [...page].sort((a, b) => {
          const ta = new Date(String((a as { created_at?: string }).created_at || 0)).getTime()
          const tb = new Date(String((b as { created_at?: string }).created_at || 0)).getTime()
          return ta - tb
        })

        for (const row of chronological) {
          if (totalSeen >= maxTotal) break scan
          totalSeen++
          const sid = String((row as { id?: string }).id || '').trim()
          if (!sid) {
            skipped++
            continue
          }

          const existing = await prisma.jotformSyncedSubmission.findUnique({
            where: { submissionId: sid },
          })
          if (existing) {
            skipped++
            continue
          }

          const body = submissionPayloadFromApiRow(row as Record<string, unknown>)
          if (!Array.isArray(body.answers) || body.answers.length === 0) {
            skipped++
            continue
          }

          try {
            await ingestJotformPayload(body, {
              verboseLog: false,
              syncSource: 'api_poll',
            })
            imported++
          } catch (e: unknown) {
            const msg = e instanceof Error ? e.message : String(e)
            errors.push(`${formId}/${sid}: ${msg}`)
          }
        }

        offset += perPage
        if (page.length < perPage) break
      }
    } catch (e: unknown) {
      const msg = e instanceof Error ? e.message : String(e)
      errors.push(`form ${formId}: ${msg}`)
    }
  }

  return {
    ok: errors.length === 0,
    formsProcessed: formIds.length,
    imported,
    skipped,
    errors,
  }
}
