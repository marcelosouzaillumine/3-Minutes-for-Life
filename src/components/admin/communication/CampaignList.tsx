import { useEffect, useState } from 'react';

import type { CommunicationCampaign } from '../../../types/Communication';

import { adminCommunicationService } from '../../../services/AdminCommunicationService';

interface CampaignListProps {
    onCreate: () => void;
    onEdit: (campaign: CommunicationCampaign) => void;
}

const TYPE_LABELS: Record<string, string> = {
    devotional_update: 'Atualização devocional',
    project_support: 'Apoio ao projeto',
    announcement: 'Anúncio',
    engagement: 'Engajamento',
    custom: 'Personalizada',
};

const STATUS_LABELS: Record<string, string> = {
    draft: 'Rascunho',
    scheduled: 'Agendada',
    sending: 'Enviando',
    completed: 'Concluída',
    cancelled: 'Cancelada',
    failed: 'Falhou',
};

export default function CampaignList({
    onCreate,
    onEdit,
}: CampaignListProps) {
    const [campaigns, setCampaigns] = useState<
        CommunicationCampaign[]
    >([]);

    const [loading, setLoading] = useState(true);

    const [error, setError] = useState<string | null>(null);

    async function loadCampaigns() {
        try {
            setLoading(true);
            setError(null);

            const data =
                await adminCommunicationService.listCampaigns();

            setCampaigns(data);
        } catch (err) {
            console.error(err);

            setError(
                err instanceof Error
                    ? err.message
                    : 'Não foi possível carregar as campanhas.'
            );
        } finally {
            setLoading(false);
        }
    }

    useEffect(() => {
        loadCampaigns();
    }, []);

    if (loading) {
        return (
            <div className="communication-state">
                <div className="communication-spinner" />
                <p>Carregando campanhas...</p>
            </div>
        );
    }

    if (error) {
        return (
            <div className="communication-error">
                <strong>Não foi possível carregar as campanhas.</strong>
                <span>{error}</span>

                <button
                    type="button"
                    className="communication-button communication-button-secondary"
                    onClick={loadCampaigns}
                >
                    Tentar novamente
                </button>
            </div>
        );
    }

    return (
        <section className="communication-campaign-list">
            <div className="communication-list-header">
                <div>
                    <span className="communication-eyebrow">
                        Comunicação
                    </span>

                    <h2>Campanhas</h2>

                    <p>
                        Crie e acompanhe as comunicações do projeto.
                    </p>
                </div>

                <button
                    type="button"
                    className="communication-button communication-button-primary"
                    onClick={onCreate}
                >
                    <span className="communication-button-icon">
                        +
                    </span>

                    Nova campanha
                </button>
            </div>

            {campaigns.length === 0 ? (
                <div className="communication-empty">
                    <div className="communication-empty-icon">
                        ✦
                    </div>

                    <h3>Nenhuma campanha criada</h3>

                    <p>
                        Crie sua primeira campanha de comunicação
                        para começar a falar com a comunidade.
                    </p>

                    <button
                        type="button"
                        className="communication-button communication-button-primary"
                        onClick={onCreate}
                    >
                        Criar primeira campanha
                    </button>
                </div>
            ) : (
                <div className="communication-campaigns">
                    {campaigns.map((campaign) => (
                        <button
                            type="button"
                            key={campaign.id}
                            className="communication-campaign-card"
                            onClick={() => onEdit(campaign)}
                        >
                            <div className="communication-campaign-main">
                                <strong>
                                    {campaign.name}
                                </strong>

                                <span>
                                    {TYPE_LABELS[campaign.type] ??
                                        campaign.type}
                                </span>
                            </div>

                            <div className="communication-campaign-meta">
                                <span
                                    className={`communication-status communication-status-${campaign.status}`}
                                >
                                    {STATUS_LABELS[
                                        campaign.status
                                    ] ?? campaign.status}
                                </span>

                                <small>
                                    {new Date(
                                        campaign.created_at
                                    ).toLocaleDateString(
                                        'pt-BR'
                                    )}
                                </small>
                            </div>
                        </button>
                    ))}
                </div>
            )}
        </section>
    );
}