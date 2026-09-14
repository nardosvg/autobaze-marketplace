import { AuthenticatedMedusaRequest, MedusaResponse } from "@medusajs/framework/http"
import { Modules } from "@medusajs/framework/utils"

// ---------------------------------------------------------------------------
// GET /store/auth-perfil — dados do perfil vindos do provedor social (email,
// nome) pra criar o customer apos o callback do Google. O token pos-callback
// ainda nao tem actor (allowUnregistered no middleware); o que temos e' a
// auth identity com o user_metadata do provedor.
// ---------------------------------------------------------------------------

export async function GET(req: AuthenticatedMedusaRequest, res: MedusaResponse) {
  const authIdentityId = req.auth_context?.auth_identity_id
  if (!authIdentityId) {
    return res.status(401).json({ message: "Sessão de autenticação inválida" })
  }

  const authService = req.scope.resolve(Modules.AUTH) as any
  const identity = await authService.retrieveAuthIdentity(authIdentityId, {
    relations: ["provider_identities"],
  })

  const google = (identity?.provider_identities ?? []).find(
    (p: any) => p.provider === "google"
  )
  const meta = (google?.user_metadata ?? {}) as Record<string, string>

  const email = meta.email || google?.entity_id || null
  if (!email || !String(email).includes("@")) {
    return res.status(404).json({ message: "E-mail não disponível no perfil Google" })
  }

  res.json({
    email,
    first_name: meta.given_name || meta.name?.split(" ")[0] || null,
    last_name:
      meta.family_name ||
      (meta.name ? meta.name.split(" ").slice(1).join(" ") || null : null),
  })
}
