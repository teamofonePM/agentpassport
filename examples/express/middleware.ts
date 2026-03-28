/**
 * ACF — Agent Credential Format
 * Express middleware example
 *
 * Drop into any Express API to start verifying agent credentials.
 * Spec: https://github.com/teamofonePM/agentpassport/blob/main/docs/SPEC.md
 */

import { Request, Response, NextFunction } from 'express'
import { verify, VerifiedCredential } from 'acf-token'

declare global {
  namespace Express {
    interface Request {
      agent?: VerifiedCredential
    }
  }
}

interface AgentAuthOptions {
  requiredScopes?: string[]
  allowAnonymous?: boolean
  onUnauthorized?: (req: Request, res: Response, reason: string) => void
}

/**
 * Verify ACF credentials on incoming requests.
 *
 * @example
 * // Require any valid ACF credential
 * app.use(agentAuth())
 *
 * @example
 * // Require specific scopes
 * app.get('/data', agentAuth({ requiredScopes: ['read:crm'] }), handler)
 *
 * @example
 * // Allow anonymous but attach credential if present
 * app.use(agentAuth({ allowAnonymous: true }))
 */
export function agentAuth(options: AgentAuthOptions = {}) {
  const { requiredScopes = [], allowAnonymous = false, onUnauthorized } = options

  return async (req: Request, res: Response, next: NextFunction) => {
    const token = req.headers['x-acf-token'] as string | undefined

    if (!token) {
      if (allowAnonymous) return next()
      const reason = 'No ACF credential provided'
      if (onUnauthorized) return onUnauthorized(req, res, reason)
      return res.status(401).json({
        error: 'acf_credential_required',
        message: reason,
        spec: 'https://github.com/teamofonePM/agentpassport/blob/main/docs/SPEC.md'
      })
    }

    try {
      const credential = await verify(token)
      req.agent = credential

      const missing = requiredScopes.filter(s => !credential.scopes.includes(s))
      if (missing.length > 0) {
        const reason = `Missing scopes: ${missing.join(', ')}`
        if (onUnauthorized) return onUnauthorized(req, res, reason)
        return res.status(403).json({
          error: 'insufficient_scope',
          message: reason,
          required: requiredScopes,
          granted: credential.scopes
        })
      }

      next()
    } catch (err: any) {
      const reason = err.message || 'Invalid ACF credential'
      if (onUnauthorized) return onUnauthorized(req, res, reason)
      return res.status(401).json({ error: 'invalid_acf_credential', message: reason })
    }
  }
}

// Usage:
//
// import express from 'express'
// import { agentAuth } from './acf-express'
//
// const app = express()
// app.use(agentAuth())
//
// app.get('/data', agentAuth({ requiredScopes: ['read:crm'] }), (req, res) => {
//   console.log(`${req.agent!.org} / ${req.agent!.agentId}`)
//   res.json({ data: '...' })
// })
