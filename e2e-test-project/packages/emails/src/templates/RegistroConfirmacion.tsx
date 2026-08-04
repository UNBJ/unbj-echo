import {
  Html,
  Head,
  Body,
  Container,
  Section,
  Text,
  Button,
  Hr,
  Heading,
} from '@react-email/components'

interface RegistroConfirmacionProps {
  fullName: string
  churchName: string
  convention: string
  portalUrl: string
}

export function RegistroConfirmacion({
  fullName,
  churchName,
  convention,
  portalUrl,
}: RegistroConfirmacionProps) {

  return (
    <Html lang="es">
      <Head />
      <Body style={body}>
        <Container style={container}>
          <Section style={header}>
            <Text style={headerText}>CNBM · CXVI Reuniones Plenarias</Text>
          </Section>

          <Section style={content}>
            <Heading style={heading}>¡Tu registro fue exitoso!</Heading>

            <Text style={text}>Hola {fullName},</Text>
            <Text style={text}>
              Tu registro para las <strong>CXVI Reuniones Plenarias CNBM 2026</strong> ha sido recibido correctamente.
            </Text>

            <Section style={infoBox}>
              <Text style={infoRow}>
                <strong>Iglesia:</strong> {churchName}
              </Text>
              <Text style={infoRow}>
                <strong>Convención:</strong> {convention}
              </Text>

            </Section>

            <Text style={text}>
              Para continuar con tu proceso de pago, accede a tu portal personal:
            </Text>

            <Button href={portalUrl} style={button}>
              Acceder a mi portal personal
            </Button>

            <Text style={smallText}>
              Guarda este correo — el enlace de arriba es tu acceso personal al proceso de registro.
            </Text>

            <Hr style={hr} />

            <Text style={footer}>
              Convención Nacional Bautista de México, A.R. · CXVI Reuniones Plenarias 2026
            </Text>
          </Section>
        </Container>
      </Body>
    </Html>
  )
}

export default RegistroConfirmacion

const body = { backgroundColor: '#F8F9FB', fontFamily: 'Inter, Arial, sans-serif' }
const container = { maxWidth: '560px', margin: '0 auto', backgroundColor: '#ffffff', borderRadius: '12px', overflow: 'hidden' }
const header = { backgroundColor: '#1A1A2E', padding: '20px 32px' }
const headerText = { color: '#CBD5E1', fontSize: '14px', margin: 0 }
const content = { padding: '32px' }
const heading = { fontSize: '24px', fontWeight: '700', color: '#111827', margin: '0 0 16px' }
const text = { fontSize: '15px', color: '#374151', lineHeight: '1.6', margin: '0 0 12px' }
const infoBox = { backgroundColor: '#F3F4F6', borderRadius: '8px', padding: '16px', margin: '16px 0' }
const infoRow = { fontSize: '14px', color: '#374151', margin: '4px 0' }
const button = { backgroundColor: '#2563EB', color: '#ffffff', borderRadius: '8px', padding: '12px 24px', fontSize: '15px', fontWeight: '600', display: 'inline-block', margin: '16px 0' }
const smallText = { fontSize: '13px', color: '#6B7280', margin: '8px 0' }
const hr = { borderColor: '#E5E7EB', margin: '24px 0' }
const footer = { fontSize: '12px', color: '#9CA3AF', textAlign: 'center' as const }
