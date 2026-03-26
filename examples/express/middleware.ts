/**
 * AgentPassport — Express middleware example
 *
 * Drop this into any Express API to start verifying agent credentials.
 * Full spec: https://github.com/agentpassport/agentpassport/blob/main/docs/SPEC.md
 */

import { Request, Response, NextFunction } from 'express'
import { verify, VerifiedPassport } from 'agentpassport'

declare global {
  namespace Express {
    interface Request {
      agent?: VerifiedPassport
    }
  }
}

interface AgentAuthOptions {
  /** Required scopes — request rejected with 403 if agent doesn't have all of them */
  requiredScopes?: string[]
  /** If true, allow requests with no passport (anonymous agents) — default false */
  allowAnonymous?: boolean
  /** Custom handler for unauthorized requests */
  onUnauthorized?: (req: Request, res: Response, reason: string) => void
}

/**
 * Express middleware that verifies AgentPassport credentials.
 *
 * @example
 * // Require any valid passport
 * app.use(agentAuth())
 *
 * @example
 * // Require specific scopes
 * app.get('/crm-data', agentAuth({ requiredScopes: ['read:crm'] }), handler)
 *
 * @example
 * // Allow anonymous but attach passport if present
 * app.use(agentAuth({ allowAnonymous: true }))
 */
export function agentAuth(options: AgentAuthOptions = {}) {
  const {
    requiredScopes = [],
    allowAnonymous = false,
    onUnauthorized
  } = options

  return async (req: Request, res: Response, next: NextFunction) => {
    const token = req.headers['x-agent-passport'] as string | undefined

    if (!token) {
      if (allowAnonymous) return next()
      const reason = 'No agent passport provided'
      if (onUnauthorized) return onUnauthorized(req, res, reason)
      return res.status(401).json({
        error: 'agent_passport_required',
        message: reason,
        docs: 'https://github.com/agentpassport/agentpassport'
      })
    }

    try {
      const passport = await verify(token)
      req.agent = passport

      // Check required scopes
      const missingScopes = requiredScopes.filter(s => !passport.scopes.includes(s))
      if (missingScopes.length > 0) {
        const reason = `Missing required scopes: ${missingScopes.join(', ')}`
        if (onUnauthorized) return onUnauthorized(req, res, reason)
        return res.status(403).json({
          error: 'insufficient_scope',
          message: reason,
          required: requiredScopes,
          granted: passport.scopes
        })
      }

      next()
    } catch (err: any) {
      const reason = err.message || 'Invalid agent passport'
      if (onUnauthorized) return onUnauthorized(req, res, reason)
      return res.status(401).json({
        error: 'invalid_agent_passport',
        message: reason
      })
    }
  }
}

// Usage example:
//
// import express from 'express'
// import { agentAuth } from './agentpassport-express'
//
// const app = express()
//
// // Require passport on all routes
// app.use(agentAuth())
//
// // Require specific scope on sensitive route
// app.get('/financial-data', agentAuth({ requiredScopes: ['read:financial'] }), (req, res) => {
//   // req.agent is typed VerifiedPassport
//   console.log(`Request from ${req.agent!.org} / ${req.agent!.agentId}`)
//   res.json({ data: '...' })
// })
