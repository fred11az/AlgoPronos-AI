/**
 * Gabarits HTML des emails.
 *
 * Deux styles distincts, et ce n'est pas qu'esthétique : le classifieur de Gmail
 * lit la structure HTML. Un bandeau en dégradé, un gros bouton coloré, des
 * images pleine largeur et un pied de page "gérer mes préférences" sont des
 * marqueurs promotionnels reconnus. Un email transactionnel doit donc ressembler
 * à un email transactionnel — sobre, clair, une seule information.
 */

const APP_URL = process.env.NEXT_PUBLIC_APP_URL || 'https://www.algopronos.com';

/**
 * Gabarit TRANSACTIONNEL — fond blanc, pas de dégradé, pas de pied de page
 * marketing. Reprend la mise en forme de l'email OTP, qui est celle qui arrive
 * correctement en boîte principale.
 *
 * @param content     Corps HTML (titres, paragraphes, bloc d'info)
 * @param previewText Texte d'aperçu affiché par le client mail après l'objet
 */
export function transactionalLayout(content: string, previewText: string): string {
  return `<!DOCTYPE html>
<html lang="fr">
<head>
  <meta charset="UTF-8"/>
  <meta name="viewport" content="width=device-width,initial-scale=1"/>
  <title>AlgoPronos AI</title>
</head>
<body style="margin:0;padding:20px;background-color:#FFFFFF;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,Helvetica,Arial,sans-serif;color:#111827;line-height:1.5;">
  <span style="display:none;font-size:1px;color:#FFFFFF;max-height:0;max-width:0;opacity:0;overflow:hidden;">${previewText}</span>
  <div style="max-width:600px;margin:0 auto;border:1px solid #E5E7EB;border-radius:8px;padding:40px;">

    <div style="margin-bottom:32px;text-align:center;">
      <a href="${APP_URL}" style="text-decoration:none;font-size:24px;font-weight:bold;color:#111827;">
        AlgoPronos <span style="color:#0099FF">AI</span>
      </a>
    </div>

    ${content}

    <div style="margin-top:48px;padding-top:24px;border-top:1px solid #E5E7EB;text-align:center;font-size:12px;color:#6B7280;">
      <p style="margin:0 0 8px;">© ${new Date().getFullYear()} AlgoPronos AI · Service de notifications transactionnelles</p>
      <p style="margin:0;">
        <a href="${APP_URL}" style="color:#0099FF;text-decoration:none;">algopronos.com</a> ·
        <a href="${APP_URL}/privacy" style="color:#6B7280;text-decoration:none;">Confidentialité</a>
      </p>
    </div>
  </div>
</body>
</html>`;
}

/**
 * Bouton d'action sobre pour les emails transactionnels (aplat, pas de dégradé).
 */
export function transactionalButton(label: string, url: string, color = '#0099FF'): string {
  return `<div style="text-align:center;margin:32px 0;">
    <a href="${url}" style="display:inline-block;padding:14px 32px;background-color:${color};color:#FFFFFF;text-decoration:none;border-radius:6px;font-weight:bold;font-size:16px;">
      ${label}
    </a>
  </div>`;
}

/** Titre de section d'un email transactionnel. */
export function transactionalHeading(text: string): string {
  return `<h2 style="margin:0 0 16px;font-size:20px;font-weight:bold;color:#111827;">${text}</h2>`;
}

/** Paragraphe standard. */
export function transactionalParagraph(text: string): string {
  return `<p style="margin:0 0 16px;font-size:16px;color:#374151;">${text}</p>`;
}

/** Encadré d'information neutre (récapitulatif, motif, montant…). */
export function transactionalInfoBox(html: string): string {
  return `<div style="margin:24px 0;padding:20px;background-color:#F9FAFB;border:1px solid #E5E7EB;border-radius:8px;font-size:15px;color:#374151;">
    ${html}
  </div>`;
}
