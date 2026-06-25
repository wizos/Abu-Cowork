/// <reference types="@testing-library/jest-dom" />
import { render, screen, cleanup } from '@testing-library/react'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import EnterpriseLoginPage from './EnterpriseLoginPage'
import type { BootstrapDTO } from '@/core/enterprise/bootstrap'

// Mock startBind to avoid calling Tauri openUrl
vi.mock('@/core/enterprise/auth', () => ({
  startBind: vi.fn(),
}))

// Mock enterpriseStore bind action — use zustand setState pattern
// (boot.ts uses Tauri FS which is already mocked in setup.ts)

global.fetch = vi.fn()

function makeBootstrap(
  methods: string[],
  ssoButtonLabel = 'Sign in with SSO',
): BootstrapDTO {
  return {
    instanceName: 'Test Corp',
    branding: { name: 'Test Corp', logoUrl: null, primaryColor: null },
    auth: {
      methods,
      ...(methods.includes('sso') ? { sso: { provider: 'generic', buttonLabel: ssoButtonLabel } } : {}),
    },
    registration: { mode: 'open_approval', domainAllowlist: [] },
    minClientVersion: '0.6.0',
    configVersion: 'sha256-test',
  }
}

describe('EnterpriseLoginPage', () => {
  const serverUrl = 'https://test.acme.com'
  const onSuccess = vi.fn()

  beforeEach(() => {
    onSuccess.mockReset()
    vi.mocked(global.fetch).mockReset()
  })

  afterEach(() => cleanup())

  describe('only password method', () => {
    it('renders password form and no other method sections', () => {
      render(
        <EnterpriseLoginPage
          serverUrl={serverUrl}
          bootstrap={makeBootstrap(['password'])}
          onSuccess={onSuccess}
        />,
      )
      expect(screen.getByTestId('password-form')).toBeInTheDocument()
      expect(screen.queryByTestId('sso-button')).not.toBeInTheDocument()
      expect(screen.queryByTestId('magic-form')).not.toBeInTheDocument()
    })

    it('does not render method tabs when single method', () => {
      render(
        <EnterpriseLoginPage
          serverUrl={serverUrl}
          bootstrap={makeBootstrap(['password'])}
          onSuccess={onSuccess}
        />,
      )
      expect(screen.queryByRole('tablist')).not.toBeInTheDocument()
    })
  })

  describe('only SSO method', () => {
    it('renders SSO button with the bootstrap-provided label', () => {
      render(
        <EnterpriseLoginPage
          serverUrl={serverUrl}
          bootstrap={makeBootstrap(['sso'], 'Sign in with Feishu')}
          onSuccess={onSuccess}
        />,
      )
      const btn = screen.getByTestId('sso-button')
      expect(btn).toBeInTheDocument()
      expect(btn).toHaveTextContent('Sign in with Feishu')
    })

    it('does not render password form or magic link form', () => {
      render(
        <EnterpriseLoginPage
          serverUrl={serverUrl}
          bootstrap={makeBootstrap(['sso'])}
          onSuccess={onSuccess}
        />,
      )
      expect(screen.queryByTestId('password-form')).not.toBeInTheDocument()
      expect(screen.queryByTestId('magic-form')).not.toBeInTheDocument()
    })
  })

  describe('all methods enabled', () => {
    it('renders a tab for each method', () => {
      render(
        <EnterpriseLoginPage
          serverUrl={serverUrl}
          bootstrap={makeBootstrap(['password', 'magic_link', 'sso'])}
          onSuccess={onSuccess}
        />,
      )
      expect(screen.getByTestId('method-tab-password')).toBeInTheDocument()
      expect(screen.getByTestId('method-tab-magic_link')).toBeInTheDocument()
      expect(screen.getByTestId('method-tab-sso')).toBeInTheDocument()
    })

    it('shows a tablist role', () => {
      render(
        <EnterpriseLoginPage
          serverUrl={serverUrl}
          bootstrap={makeBootstrap(['password', 'magic_link', 'sso'])}
          onSuccess={onSuccess}
        />,
      )
      expect(screen.getByRole('tablist')).toBeInTheDocument()
    })

    it('defaults to password tab and shows password form', () => {
      render(
        <EnterpriseLoginPage
          serverUrl={serverUrl}
          bootstrap={makeBootstrap(['password', 'magic_link', 'sso'])}
          onSuccess={onSuccess}
        />,
      )
      expect(screen.getByTestId('password-form')).toBeInTheDocument()
      // SSO button not visible until SSO tab is clicked
      expect(screen.queryByTestId('sso-button')).not.toBeInTheDocument()
    })
  })
})
