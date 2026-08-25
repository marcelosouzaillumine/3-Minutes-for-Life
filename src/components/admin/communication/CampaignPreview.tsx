import type {
    CommunicationCampaign,
} from '../../../types/Communication';

interface CampaignPreviewProps {
    campaign: CommunicationCampaign;
    onBack: () => void;
    onSend: () => void;
    sending?: boolean;
}

export default function CampaignPreview({
    campaign,
    onBack,
    onSend,
    sending = false,
}: CampaignPreviewProps) {

    return (
        <section
            style={{
                maxWidth: '760px',
                margin: '0 auto',
                padding: '32px 20px',
            }}
        >
            <button
                type="button"
                className="communication-button communication-button-secondary"
                onClick={onBack}
                disabled={sending}
            >
                ← Voltar
            </button>

            <div
                style={{
                    marginTop: '24px',
                    padding: '32px',
                    border: '1px solid #ddd',
                    borderRadius: '16px',
                    background: '#fff',
                }}
            >
                <span
                    style={{
                        fontSize: '0.75rem',
                        textTransform: 'uppercase',
                        letterSpacing: '0.08em',
                        color: '#777',
                    }}
                >
                    Pré-visualização
                </span>

                {campaign.title && (
                    <h1
                        style={{
                            marginTop: '12px',
                            marginBottom: '16px',
                        }}
                    >
                        {campaign.title}
                    </h1>
                )}

                {campaign.subject && (
                    <p>
                        <strong>
                            Assunto:
                        </strong>{' '}
                        {campaign.subject}
                    </p>
                )}

                <div
                    style={{
                        marginTop: '24px',
                        lineHeight: 1.7,
                    }}
                    dangerouslySetInnerHTML={{
                        __html:
                            campaign.body ?? '',
                    }}
                />
            </div>

            <footer
                style={{
                    display: 'flex',
                    justifyContent: 'flex-end',
                    gap: '12px',
                    marginTop: '24px',
                }}
            >
                <button
                    type="button"
                    className="communication-button communication-button-secondary"
                    onClick={onBack}
                    disabled={sending}
                >
                    Voltar
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
