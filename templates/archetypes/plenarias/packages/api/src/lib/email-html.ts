export function confirmationEmailHtml(opts: {
  fullName: string
  churchName: string
  conventionName: string
  portalUrl: string
}): string {
  const { fullName, churchName, conventionName, portalUrl } = opts
  return `<!DOCTYPE html>
<html lang="es">
<head><meta charset="UTF-8"><meta name="viewport" content="width=device-width,initial-scale=1"></head>
<body style="margin:0;padding:0;background:#F8F9FB;font-family:Arial,Helvetica,sans-serif;">
  <table width="100%" cellpadding="0" cellspacing="0" style="background:#F8F9FB;padding:32px 16px;">
    <tr><td align="center">
      <table width="560" cellpadding="0" cellspacing="0" style="max-width:560px;width:100%;background:#ffffff;border-radius:12px;overflow:hidden;border:1px solid #E5E7EB;">

        <!-- Gold accent line -->
        <tr><td style="height:3px;background:linear-gradient(90deg,#C8A44A,#E8D088,#C8A44A);font-size:0;">&nbsp;</td></tr>

        <!-- Header -->
        <tr><td style="background:#1A1A2E;padding:20px 32px;">
          <table width="100%" cellpadding="0" cellspacing="0">
            <tr>
              <td>
                <span style="color:#E8D088;font-size:20px;font-weight:700;letter-spacing:2px;">CXVI</span>
                <span style="color:#C8A44A;margin:0 8px;font-size:14px;">·</span>
                <span style="color:#C8A44A;font-size:12px;letter-spacing:2px;text-transform:uppercase;">Reuniones Plenarias</span>
              </td>
              <td align="right">
                <span style="color:#4A4A6A;font-size:11px;">CNBM · 2026</span>
              </td>
            </tr>
          </table>
        </td></tr>

        <!-- Content -->
        <tr><td style="padding:36px 32px 28px;">

          <!-- Success icon row -->
          <table width="100%" cellpadding="0" cellspacing="0" style="margin-bottom:24px;">
            <tr>
              <td>
                <div style="display:inline-block;background:#1A1A2E;border-radius:50%;width:48px;height:48px;line-height:48px;text-align:center;font-size:22px;">✓</div>
              </td>
            </tr>
          </table>

          <h1 style="margin:0 0 8px;font-size:22px;font-weight:700;color:#111827;">¡Tu registro fue exitoso!</h1>
          <p style="margin:0 0 20px;font-size:15px;color:#6B7280;">Hola <strong style="color:#111827;">${fullName}</strong>,</p>
          <p style="margin:0 0 20px;font-size:15px;color:#374151;line-height:1.6;">
            Tu registro para las <strong>CXVI Reuniones Plenarias CNBM 2026</strong> ha sido recibido correctamente.
          </p>

          <!-- Info box -->
          <table width="100%" cellpadding="0" cellspacing="0" style="background:#F8F9FB;border-radius:8px;border:1px solid #E5E7EB;margin:0 0 24px;">
            <tr><td style="padding:16px 20px;">
              <table width="100%" cellpadding="0" cellspacing="0">
                <tr>
                  <td style="padding:6px 0;border-bottom:1px solid #E5E7EB;">
                    <span style="font-size:11px;color:#9CA3AF;text-transform:uppercase;letter-spacing:1px;">Iglesia</span><br>
                    <span style="font-size:14px;color:#111827;font-weight:600;">${churchName}</span>
                  </td>
                </tr>
                <tr>
                  <td style="padding:6px 0;">
                    <span style="font-size:11px;color:#9CA3AF;text-transform:uppercase;letter-spacing:1px;">Convención</span><br>
                    <span style="font-size:14px;color:#111827;font-weight:600;">${conventionName}</span>
                  </td>
                </tr>
              </table>
            </td></tr>
          </table>

          <!-- Ornament divider -->
          <table width="100%" cellpadding="0" cellspacing="0" style="margin:0 0 20px;">
            <tr>
              <td style="height:1px;background:#E5E7EB;width:40%;"></td>
              <td align="center" style="padding:0 12px;color:#C8A44A;font-size:12px;white-space:nowrap;">✦</td>
              <td style="height:1px;background:#E5E7EB;width:40%;"></td>
            </tr>
          </table>

          <p style="margin:0 0 20px;font-size:15px;color:#374151;line-height:1.6;">
            El siguiente paso es completar tu pago. Accede a tu portal personal:
          </p>

          <!-- Button -->
          <table cellpadding="0" cellspacing="0" style="margin:0 0 24px;">
            <tr>
              <td style="background:#1A1A2E;border-radius:8px;">
                <a href="${portalUrl}" style="display:inline-block;padding:14px 28px;color:#ffffff;font-size:14px;font-weight:600;text-decoration:none;letter-spacing:0.3px;">
                  Acceder a mi portal personal →
                </a>
              </td>
            </tr>
          </table>

          <p style="margin:0;font-size:12px;color:#9CA3AF;line-height:1.6;">
            Guarda este correo — el enlace de arriba es tu acceso personal al proceso de registro.
            No lo compartas con nadie más.
          </p>

        </td></tr>

        <!-- Footer -->
        <tr><td style="background:#F8F9FB;border-top:1px solid #E5E7EB;padding:16px 32px;text-align:center;">
          <p style="margin:0;font-size:11px;color:#9CA3AF;letter-spacing:0.5px;">
            Convención Nacional Bautista de México, A.R. · CXVI Reuniones Plenarias · 19–23 de Octubre 2026
          </p>
        </td></tr>

      </table>
    </td></tr>
  </table>
</body>
</html>`
}

export function approvalEmailHtml(opts: {
  fullName: string
  churchName: string
  conventionName: string
  delegateLabel: string
  pdfUrl: string
}): string {
  const { fullName, churchName, conventionName, delegateLabel, pdfUrl } = opts
  return `<!DOCTYPE html>
<html lang="es">
<head><meta charset="UTF-8"><meta name="viewport" content="width=device-width,initial-scale=1"></head>
<body style="margin:0;padding:0;background:#F8F9FB;font-family:Arial,Helvetica,sans-serif;">
  <table width="100%" cellpadding="0" cellspacing="0" style="background:#F8F9FB;padding:32px 16px;">
    <tr><td align="center">
      <table width="560" cellpadding="0" cellspacing="0" style="max-width:560px;width:100%;background:#ffffff;border-radius:12px;overflow:hidden;border:1px solid #E5E7EB;">

        <!-- Gold accent line -->
        <tr><td style="height:3px;background:linear-gradient(90deg,#C8A44A,#E8D088,#C8A44A);font-size:0;">&nbsp;</td></tr>

        <!-- Header -->
        <tr><td style="background:#1A1A2E;padding:20px 32px;">
          <table width="100%" cellpadding="0" cellspacing="0">
            <tr>
              <td>
                <span style="color:#E8D088;font-size:20px;font-weight:700;letter-spacing:2px;">CXVI</span>
                <span style="color:#C8A44A;margin:0 8px;font-size:14px;">·</span>
                <span style="color:#C8A44A;font-size:12px;letter-spacing:2px;text-transform:uppercase;">Reuniones Plenarias</span>
              </td>
              <td align="right">
                <span style="color:#4A4A6A;font-size:11px;">CNBM · 2026</span>
              </td>
            </tr>
          </table>
        </td></tr>

        <!-- Content -->
        <tr><td style="padding:36px 32px 28px;">

          <h1 style="margin:0 0 8px;font-size:22px;font-weight:700;color:#111827;">¡Tu registro está aprobado!</h1>
          <p style="margin:0 0 20px;font-size:15px;color:#6B7280;">Hola <strong style="color:#111827;">${fullName}</strong>,</p>
          <p style="margin:0 0 20px;font-size:15px;color:#374151;line-height:1.6;">
            Tu registro para las <strong>CXVI Reuniones Plenarias CNBM 2026</strong> ha sido confirmado por el equipo administrativo.
          </p>

          <!-- Info box -->
          <table width="100%" cellpadding="0" cellspacing="0" style="background:#F8F9FB;border-radius:8px;border:1px solid #E5E7EB;margin:0 0 24px;">
            <tr><td style="padding:16px 20px;">
              <table width="100%" cellpadding="0" cellspacing="0">
                <tr>
                  <td style="padding:6px 0;border-bottom:1px solid #E5E7EB;">
                    <span style="font-size:11px;color:#9CA3AF;text-transform:uppercase;letter-spacing:1px;">Iglesia</span><br>
                    <span style="font-size:14px;color:#111827;font-weight:600;">${churchName}</span>
                  </td>
                </tr>
                <tr>
                  <td style="padding:6px 0;border-bottom:1px solid #E5E7EB;">
                    <span style="font-size:11px;color:#9CA3AF;text-transform:uppercase;letter-spacing:1px;">Convención</span><br>
                    <span style="font-size:14px;color:#111827;font-weight:600;">${conventionName}</span>
                  </td>
                </tr>
                <tr>
                  <td style="padding:6px 0;">
                    <span style="font-size:11px;color:#9CA3AF;text-transform:uppercase;letter-spacing:1px;">Tipo de delegado</span><br>
                    <span style="font-size:14px;color:#111827;font-weight:600;">${delegateLabel}</span>
                  </td>
                </tr>
              </table>
            </td></tr>
          </table>

          <!-- Ornament divider -->
          <table width="100%" cellpadding="0" cellspacing="0" style="margin:0 0 20px;">
            <tr>
              <td style="height:1px;background:#E5E7EB;width:40%;"></td>
              <td align="center" style="padding:0 12px;color:#C8A44A;font-size:12px;white-space:nowrap;">✦</td>
              <td style="height:1px;background:#E5E7EB;width:40%;"></td>
            </tr>
          </table>

          <p style="margin:0 0 8px;font-size:13px;font-weight:600;color:#111827;text-transform:uppercase;letter-spacing:1px;">
            Tu Hoja de Nombramiento
          </p>
          <p style="margin:0 0 20px;font-size:14px;color:#374151;line-height:1.6;">
            Tu hoja de nombramiento fue generada y está lista para descargarse. Preséntala impresa o en pantalla el día del evento.
          </p>

          <!-- Button -->
          <table cellpadding="0" cellspacing="0" style="margin:0 0 24px;">
            <tr>
              <td style="background:#1A1A2E;border-radius:8px;">
                <a href="${pdfUrl}" style="display:inline-block;padding:14px 28px;color:#ffffff;font-size:14px;font-weight:600;text-decoration:none;letter-spacing:0.3px;">
                  Descargar Hoja de Nombramiento →
                </a>
              </td>
            </tr>
          </table>

          <p style="margin:0;font-size:12px;color:#9CA3AF;line-height:1.6;">
            El enlace es válido por un año. Te esperamos del <strong style="color:#6B7280;">19 al 23 de Octubre de 2026</strong>.
          </p>

        </td></tr>

        <!-- Footer -->
        <tr><td style="background:#F8F9FB;border-top:1px solid #E5E7EB;padding:16px 32px;text-align:center;">
          <p style="margin:0;font-size:11px;color:#9CA3AF;letter-spacing:0.5px;">
            Convención Nacional Bautista de México, A.R. · CXVI Reuniones Plenarias · 19–23 de Octubre 2026
          </p>
        </td></tr>

      </table>
    </td></tr>
  </table>
</body>
</html>`
}
