'use client'

import { useListQuery } from '@payloadcms/ui'
import { useSearchParams } from 'next/navigation'
import { useEffect, useRef } from 'react'

// Opens the contacts list on the `new` requests unless the URL already carries a filter or a search.
export function DefaultNewFilter() {
  const { query, refineListData } = useListQuery()
  const searchParams = useSearchParams()
  const applied = useRef(false)

  useEffect(() => {
    if (applied.current) return
    applied.current = true
    const hasUrlFilter = [...searchParams.keys()].some((key) => key === 'search' || key.startsWith('where'))
    if (hasUrlFilter) return
    void refineListData({ ...query, where: { status: { equals: 'new' } } })
    // Runs once on mount: later filter changes by the user must stick.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  return null
}
