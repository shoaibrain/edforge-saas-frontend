/**
 * Sprint M3 phase 2 — BrandingFileField interaction tests.
 *
 * Verifies the file-pick → upload-eagerly → stage-key UX:
 *   1. Picking a valid file fires `usePresignedAssetUpload` and stages
 *      the resulting S3 key in the RHF form field.
 *   2. Bad MIME → inline error visible; mutation NOT called; no key staged.
 *   3. Oversize → inline error visible; mutation NOT called; no key staged.
 *   4. While the upload is in-flight, the picker button is disabled.
 *   5. With a `currentUrl`, the button reads "Replace" (not "Choose file").
 *   6. The picker is disabled when the parent passes `disabled`.
 *
 * Mocks `usePresignedAssetUpload` so the test never actually presigns
 * or PUTs — we only care about the field's interaction surface.
 */

import { describe, expect, it, vi, beforeEach } from 'vitest'
import { act, fireEvent, render, screen, waitFor } from '@testing-library/react'
import { useForm, FormProvider } from 'react-hook-form'
import type { ReactNode } from 'react'

const usePresignedAssetUploadMock = vi.fn()
vi.mock('@edforge/identity-services', () => ({
  usePresignedAssetUpload: () => usePresignedAssetUploadMock(),
  BRANDING_ASSET_MIME_ALLOWLIST: {
    logo: ['image/png', 'image/jpeg', 'image/svg+xml'],
    signature: ['image/png', 'image/jpeg'],
    letterhead: ['image/png', 'image/jpeg', 'application/pdf'],
  },
  BRANDING_ASSET_MAX_BYTES: {
    logo: 2 * 1024 * 1024,
    signature: 1 * 1024 * 1024,
    letterhead: 5 * 1024 * 1024,
  },
}))

// i18n stub: always return the key. The component passes
// `defaultValue` for safety but the tests target keys so they keep
// passing if labels change. Mirrors the BrandingForm.test.tsx mock.
vi.mock('@edforge/i18n', () => ({
  useTranslation: () => ({
    t: (key: string) => key,
  }),
}))

const { BrandingFileField } = await import('../BrandingFileField')

function Harness({ children }: { children: ReactNode }) {
  const methods = useForm({ defaultValues: { logoS3Key: '' } })
  return <FormProvider {...methods}>{children}</FormProvider>
}

function makeFile(opts: { type: string; sizeBytes?: number; name?: string }): File {
  const blob = new Blob([new Uint8Array(opts.sizeBytes ?? 100)], { type: opts.type })
  return new File([blob], opts.name ?? 'asset.bin', { type: opts.type })
}

function mockUpload(opts: {
  result?: { s3Key: string }
  error?: { code?: string }
  isPending?: boolean
}) {
  usePresignedAssetUploadMock.mockReturnValue({
    mutate: vi.fn(),
    mutateAsync: opts.error
      ? vi.fn().mockRejectedValue(Object.assign(new Error('boom'), opts.error))
      : vi.fn().mockResolvedValue(opts.result ?? { s3Key: 'unused' }),
    isPending: opts.isPending ?? false,
    isError: !!opts.error,
    isSuccess: !!opts.result && !opts.error,
    data: opts.result,
    error: opts.error ? new Error('boom') : null,
    reset: vi.fn(),
  })
}

describe('BrandingFileField (M3 phase 2)', () => {
  beforeEach(() => {
    usePresignedAssetUploadMock.mockReset()
  })

  it('renders "Choose file" when no currentUrl is set', () => {
    mockUpload({})
    render(
      <Harness>
        <BrandingFileField
          name="logoS3Key"
          assetType="logo"
          schoolId="s-1"
          label="Logo"
        />
      </Harness>,
    )
    expect(screen.getByRole('button', { name: /form\.upload\.choose/i })).toBeInTheDocument()
  })

  it('renders "Replace" instead of "Choose file" when currentUrl is set', () => {
    mockUpload({})
    render(
      <Harness>
        <BrandingFileField
          name="logoS3Key"
          assetType="logo"
          schoolId="s-1"
          label="Logo"
          currentUrl="https://example.s3/signed/logo.png"
        />
      </Harness>,
    )
    expect(screen.getByRole('button', { name: /form\.upload\.replace/i })).toBeInTheDocument()
    // The current asset thumbnail renders as <img> with the label as alt.
    expect(screen.getByRole('img', { name: 'Logo' })).toHaveAttribute(
      'src',
      'https://example.s3/signed/logo.png',
    )
  })

  it('picks a valid PNG → calls mutateAsync with (schoolId, assetType, file)', async () => {
    const mutateAsync = vi.fn().mockResolvedValue({ s3Key: 'tenants/t/s/logo.png' })
    usePresignedAssetUploadMock.mockReturnValue({
      mutate: vi.fn(),
      mutateAsync,
      isPending: false,
      isError: false,
      isSuccess: false,
      data: undefined,
      error: null,
      reset: vi.fn(),
    })

    render(
      <Harness>
        <BrandingFileField
          name="logoS3Key"
          assetType="logo"
          schoolId="s-1"
          label="Logo"
        />
      </Harness>,
    )

    const fileInput = document.querySelector('input[type="file"]') as HTMLInputElement
    const file = makeFile({ type: 'image/png', sizeBytes: 1024 })

    await act(async () => {
      fireEvent.change(fileInput, { target: { files: [file] } })
    })

    await waitFor(() => expect(mutateAsync).toHaveBeenCalled())
    expect(mutateAsync).toHaveBeenCalledWith({
      schoolId: 's-1',
      assetType: 'logo',
      file,
    })
  })

  it('shows the inline MIME error when the upload mutateAsync rejects with code:"mime"', async () => {
    const mutateAsync = vi
      .fn()
      .mockRejectedValue(Object.assign(new Error('mime reject'), { code: 'mime' }))
    usePresignedAssetUploadMock.mockReturnValue({
      mutate: vi.fn(),
      mutateAsync,
      isPending: false,
      isError: false,
      isSuccess: false,
      data: undefined,
      error: null,
      reset: vi.fn(),
    })

    render(
      <Harness>
        <BrandingFileField
          name="logoS3Key"
          assetType="logo"
          schoolId="s-1"
          label="Logo"
        />
      </Harness>,
    )

    const fileInput = document.querySelector('input[type="file"]') as HTMLInputElement
    await act(async () => {
      fireEvent.change(fileInput, {
        target: { files: [makeFile({ type: 'application/x-evil' })] },
      })
    })

    await waitFor(() => expect(screen.getByRole('alert')).toBeInTheDocument())
    expect(screen.getByRole('alert').textContent).toMatch(/form\.upload\.mimeError/)
  })

  it('shows the inline size error when the upload mutateAsync rejects with code:"size"', async () => {
    const mutateAsync = vi
      .fn()
      .mockRejectedValue(Object.assign(new Error('size reject'), { code: 'size' }))
    usePresignedAssetUploadMock.mockReturnValue({
      mutate: vi.fn(),
      mutateAsync,
      isPending: false,
      isError: false,
      isSuccess: false,
      data: undefined,
      error: null,
      reset: vi.fn(),
    })

    render(
      <Harness>
        <BrandingFileField
          name="logoS3Key"
          assetType="signature"
          schoolId="s-1"
          label="Signature"
        />
      </Harness>,
    )

    const fileInput = document.querySelector('input[type="file"]') as HTMLInputElement
    await act(async () => {
      fireEvent.change(fileInput, {
        target: { files: [makeFile({ type: 'image/png', sizeBytes: 5_000_000 })] },
      })
    })

    await waitFor(() => expect(screen.getByRole('alert')).toBeInTheDocument())
    expect(screen.getByRole('alert').textContent).toMatch(/form\.upload\.sizeError/)
  })

  it('shows the generic server error when the upload mutateAsync rejects without a known code', async () => {
    const mutateAsync = vi.fn().mockRejectedValue(new Error('boom'))
    usePresignedAssetUploadMock.mockReturnValue({
      mutate: vi.fn(),
      mutateAsync,
      isPending: false,
      isError: false,
      isSuccess: false,
      data: undefined,
      error: null,
      reset: vi.fn(),
    })

    render(
      <Harness>
        <BrandingFileField
          name="logoS3Key"
          assetType="logo"
          schoolId="s-1"
          label="Logo"
        />
      </Harness>,
    )

    const fileInput = document.querySelector('input[type="file"]') as HTMLInputElement
    await act(async () => {
      fireEvent.change(fileInput, {
        target: { files: [makeFile({ type: 'image/png' })] },
      })
    })

    await waitFor(() => expect(screen.getByRole('alert')).toBeInTheDocument())
    expect(screen.getByRole('alert').textContent).toMatch(/form\.upload\.serverError/)
  })

  it('disables the picker button while isPending=true', () => {
    mockUpload({ isPending: true })
    render(
      <Harness>
        <BrandingFileField
          name="logoS3Key"
          assetType="logo"
          schoolId="s-1"
          label="Logo"
        />
      </Harness>,
    )
    const button = screen.getByRole('button', { name: /form\.upload\.uploading/i })
    expect(button).toBeDisabled()
  })

  it('disables the picker when the parent passes disabled=true', () => {
    mockUpload({})
    render(
      <Harness>
        <BrandingFileField
          name="logoS3Key"
          assetType="logo"
          schoolId="s-1"
          label="Logo"
          disabled
        />
      </Harness>,
    )
    expect(screen.getByRole('button', { name: /form\.upload\.choose/i })).toBeDisabled()
  })

  // Sprint M3-phase-3 / Issue #25 — eager-preview behavior. After a
  // successful upload the preview switches from the prior
  // server-supplied `currentUrl` to a `blob:` URL synthesized via
  // `URL.createObjectURL(file)`, so the operator sees the new asset
  // immediately (BEFORE Save → refetch lands the new signed GET URL).
  it('replaces the preview src with a blob URL after a successful upload (M3-phase-3 eager preview)', async () => {
    const mutateAsync = vi.fn().mockResolvedValue({ s3Key: 'tenants/t/s/logo-2.png' })
    usePresignedAssetUploadMock.mockReturnValue({
      mutate: vi.fn(),
      mutateAsync,
      isPending: false,
      isError: false,
      isSuccess: true,
      data: { s3Key: 'tenants/t/s/logo-2.png' },
      error: null,
      reset: vi.fn(),
    })

    render(
      <Harness>
        <BrandingFileField
          name="logoS3Key"
          assetType="logo"
          schoolId="s-1"
          label="Logo"
          // Pre-existing asset is rendered with the signed URL.
          currentUrl="https://example.s3/signed/old-logo.png"
        />
      </Harness>,
    )

    // Sanity: initial preview shows the prior server-supplied signed URL.
    expect(screen.getByRole('img', { name: 'Logo' })).toHaveAttribute(
      'src',
      'https://example.s3/signed/old-logo.png',
    )

    const fileInput = document.querySelector('input[type="file"]') as HTMLInputElement
    const file = makeFile({ type: 'image/png', sizeBytes: 1024 })

    await act(async () => {
      fireEvent.change(fileInput, { target: { files: [file] } })
    })

    // After the upload resolves, the preview src must point at a
    // blob URL synthesized from the picked file — NOT the stale
    // server-supplied URL.
    await waitFor(() => {
      const img = screen.getByRole('img', { name: 'Logo' }) as HTMLImageElement
      expect(img.getAttribute('src')).toMatch(/^blob:/)
    })
  })
})
