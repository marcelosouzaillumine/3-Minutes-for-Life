import type {
  CommunicationCampaign,
} from '../../../types/Communication';

interface CampaignPreviewProps {
  campaign: CommunicationCampaign;
  onBack: () => void;
  onSend: () => void;
  sending?: boolean;
}

// ─────────────────────────────────────────────────────────────────────────────
// HELPERS
// ─────────────────────────────────────────────────────────────────────────────

function htmlToPlainText(html: string): string {
  if (!html) {
    return '';
  }

  if (typeof window === 'undefined') {
    return html
      .replace(/<[^>]*>/g, ' ')
      .replace(/\s+/g, ' ')
      .trim();
  }

  const container = document.createElement('div');

  container.innerHTML = html;

  /*
   * Remove informações técnicas do CTA
   * antes de calcular a quantidade de caracteres.
   */
  container
    .querySelectorAll(
      '[data-type="cta"]'
    )
    .forEach((cta) => {
      const target = cta.querySelector(
        '[data-cta-target]'
      );

      target?.remove();
    });

  return (
    container.textContent ||
    container.innerText ||
    ''
  )
    .replace(/\s+/g, ' ')
    .trim();
}

// ─────────────────────────────────────────────────────────────────────────────
// PREVIEW
// ─────────────────────────────────────────────────────────────────────────────

export default function CampaignPreview({
  campaign,
  onBack,
  onSend,
  sending = false,
}: CampaignPreviewProps) {
  const body = campaign.body ?? '';

  const plainText = htmlToPlainText(body);

  const bodyLength = plainText.length;

  return (
    <section
      style={{
        width: '100%',
        maxWidth: '760px',
        margin: '0 auto',
        padding: '32px 20px 48px',
        boxSizing: 'border-box',
      }}
    >
      {/* ─────────────────────────────────────
          HEADER
      ───────────────────────────────────── */}

      <button
        type="button"
        className="communication-button communication-button-secondary"
        onClick={onBack}
        disabled={sending}
      >
        ← Voltar
      </button>

      {/* ─────────────────────────────────────
          PREVIEW HEADER
      ───────────────────────────────────── */}

      <div
        style={{
          marginTop: '24px',
          width: '100%',
          boxSizing: 'border-box',
        }}
      >
        <div
          style={{
            marginBottom: '12px',
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            gap: '12px',
            flexWrap: 'wrap',
          }}
        >
          <span
            style={{
              fontSize: '0.75rem',
              textTransform: 'uppercase',
              letterSpacing: '0.08em',
              color: '#777',
              fontWeight: 600,
            }}
          >
            Pré-visualização completa
          </span>

          <span
            style={{
              fontSize: '0.72rem',
              color: '#999',
            }}
          >
            {bodyLength.toLocaleString('pt-BR')} caracteres
          </span>
        </div>

        {/* ─────────────────────────────────
            MESSAGE CARD
        ───────────────────────────────── */}

        <article
          style={{
            width: '100%',
            boxSizing: 'border-box',
            padding: '32px',
            border: '1px solid #ddd',
            borderRadius: '16px',
            background: '#fff',
            overflow: 'visible',
            height: 'auto',
            minHeight: '200px',
          }}
        >
          {/* ───────────────────────────────
              TITLE
          ─────────────────────────────── */}

          {campaign.title && (
            <h1
              style={{
                margin: '0 0 16px',
                fontSize: '28px',
                lineHeight: 1.25,
                color: '#1a1a1a',
              }}
            >
              {campaign.title}
            </h1>
          )}

          {/* ───────────────────────────────
              SUBJECT
          ─────────────────────────────── */}

          {campaign.subject && (
            <div
              style={{
                marginBottom: '24px',
                paddingBottom: '16px',
                borderBottom: '1px solid #eee',
              }}
            >
              <p
                style={{
                  margin: 0,
                  fontSize: '0.9rem',
                  color: '#555',
                }}
              >
                <strong>Assunto:</strong>{' '}
                {campaign.subject}
              </p>
            </div>
          )}

          {/* ───────────────────────────────
              BODY
          ─────────────────────────────── */}

          <div
            style={{
              width: '100%',
              maxWidth: '100%',
              overflow: 'visible',
              height: 'auto',
              minHeight: 0,
              lineHeight: 1.7,
              color: '#222',
              wordBreak: 'break-word',
              overflowWrap: 'anywhere',
            }}
            dangerouslySetInnerHTML={{
              __html: body || '<p></p>',
            }}
          />

          {/* ───────────────────────────────
              CAMPAIGN ACTION BUTTON
          ─────────────────────────────── */}

          {campaign.cta_label &&
            campaign.cta_url && (
              <div
                style={{
                  marginTop: '28px',
                  paddingTop: '24px',
                  borderTop: '1px solid #eee',
                  display: 'flex',
                  justifyContent: 'center',
                }}
              >
                <a
                  href={campaign.cta_url}
                  target="_blank"
                  rel="noopener noreferrer"
                  style={{
                    display: 'inline-flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    minHeight: '44px',
                    padding: '0 24px',
                    borderRadius: '8px',
                    background: '#1a1a1a',
                    color: '#fff',
                    textDecoration: 'none',
                    fontSize: '0.9rem',
                    fontWeight: 600,
                    lineHeight: 1,
                  }}
                >
                  {campaign.cta_label}
                </a>
              </div>
            )}
        </article>
      </div>

      {/* ─────────────────────────────────────
          ACTIONS
      ───────────────────────────────────── */}

      <footer
        style={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          gap: '12px',
          marginTop: '24px',
          flexWrap: 'wrap',
        }}
      >
        <button
          type="button"
          className="communication-button communication-button-secondary"
          onClick={onBack}
          disabled={sending}
        >
          ← Voltar para edição
        </button>

        <button
          type="button"
          className="communication-button communication-button-primary"
          onClick={onSend}
          disabled={sending}
        >
          {sending
            ? 'Enviando...'
            : 'Enviar campanha'}
        </button>
      </footer>
    </section>
  );
}